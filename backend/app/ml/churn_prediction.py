import os
import joblib
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sqlalchemy.orm import Session
from app.models.customer import Customer, ChurnRiskLevel
from app.models.sale import Sale, PaymentStatus
from app.core.config import settings

class ChurnPredictionEngine:
    def __init__(self, business_id: str):
        self.business_id = business_id
        self.model_path = os.path.join(settings.ML_MODELS_DIR, f"churn_model_{business_id}.joblib")
        os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)

    def analyze_and_predict_churn(self, db: Session) -> List[Dict[str, Any]]:
        customers = db.query(Customer).filter(Customer.business_id == self.business_id).all()
        if not customers:
            return []

        now = datetime.now(timezone.utc)
        results = []

        for c in customers:
            days_inactive = (now - c.last_purchase_date.replace(tzinfo=timezone.utc)).days if c.last_purchase_date else 180
            aov = (c.total_spent / c.order_count) if c.order_count > 0 else 0.0

            # Churn probability heuristic/model score
            # Score factors: Inactivity days, low order count, high balance
            inactivity_factor = min(1.0, days_inactive / 90.0)
            frequency_factor = max(0.0, 1.0 - (c.order_count / 10.0))
            score = (0.6 * inactivity_factor) + (0.4 * frequency_factor)

            if days_inactive > 90 or score >= 0.7:
                level = ChurnRiskLevel.HIGH
                reason = f"No purchase in {days_inactive} days. Order frequency dropped."
            elif days_inactive > 45 or score >= 0.4:
                level = ChurnRiskLevel.MEDIUM
                reason = f"Inactive for {days_inactive} days. Moderately reduced engagement."
            else:
                level = ChurnRiskLevel.LOW
                reason = f"Active buyer with frequent recent purchases ({days_inactive} days ago)."

            c.churn_risk = level
            c.churn_risk_score = round(score, 2)
            db.add(c)

            results.append({
                "customer_id": c.id,
                "customer_name": c.name,
                "email": c.email,
                "phone": c.phone,
                "days_since_last_purchase": days_inactive,
                "total_orders": c.order_count,
                "total_spent": round(c.total_spent, 2),
                "churn_risk": level.value,
                "churn_score": round(score, 2),
                "reason": reason
            })

        db.commit()
        results.sort(key=lambda x: x["churn_score"], reverse=True)
        return results
