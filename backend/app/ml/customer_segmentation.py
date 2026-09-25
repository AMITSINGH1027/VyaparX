import os
import joblib
from datetime import datetime, timezone
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session
from app.models.customer import Customer, CustomerSegment, ChurnRiskLevel
from app.models.sale import Sale, PaymentStatus
from app.core.config import settings

class CustomerSegmentationEngine:
    def __init__(self, business_id: str):
        self.business_id = business_id
        self.model_path = os.path.join(settings.ML_MODELS_DIR, f"kmeans_rfm_{business_id}.joblib")
        self.scaler_path = os.path.join(settings.ML_MODELS_DIR, f"scaler_rfm_{business_id}.joblib")
        os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)

    def extract_rfm_data(self, db: Session) -> pd.DataFrame:
        customers = db.query(Customer).filter(Customer.business_id == self.business_id).all()
        if not customers:
            return pd.DataFrame()

        now = datetime.now(timezone.utc)
        records = []
        for c in customers:
            # Recency: days since last purchase
            if c.last_purchase_date:
                dt = c.last_purchase_date.replace(tzinfo=timezone.utc) if c.last_purchase_date.tzinfo is None else c.last_purchase_date
                recency = max(0, (now - dt).days)
            else:
                recency = 365

            frequency = c.order_count
            monetary = c.total_spent
            records.append({
                "customer_id": c.id,
                "customer_name": c.name,
                "recency": recency,
                "frequency": frequency,
                "monetary": monetary
            })

        return pd.DataFrame(records)

    def train_and_segment(self, db: Session) -> dict:
        df = self.extract_rfm_data(db)
        if len(df) < 5:
            # Cold start rule-based segmentation
            return self._heuristic_segmentation(db, df)

        X = df[["recency", "frequency", "monetary"]].copy()
        # Handle log transforms for skewed monetary/frequency
        X["recency_log"] = np.log1p(X["recency"])
        X["freq_log"] = np.log1p(X["frequency"])
        X["monetary_log"] = np.log1p(X["monetary"])

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X[["recency_log", "freq_log", "monetary_log"]])

        n_clusters = min(5, len(df))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        df["cluster"] = kmeans.fit_predict(X_scaled)

        # Save artifacts
        joblib.dump(kmeans, self.model_path)
        joblib.dump(scaler, self.scaler_path)

        # Assign meaningful business segment labels based on cluster RFM averages
        cluster_stats = df.groupby("cluster")[["recency", "frequency", "monetary"]].mean()
        cluster_labels = {}

        for cl in cluster_stats.index:
            r = cluster_stats.loc[cl, "recency"]
            f = cluster_stats.loc[cl, "frequency"]
            m = cluster_stats.loc[cl, "monetary"]

            if m >= cluster_stats["monetary"].quantile(0.8) and f >= cluster_stats["frequency"].quantile(0.6):
                cluster_labels[cl] = CustomerSegment.VIP
            elif f >= cluster_stats["frequency"].mean() and r <= cluster_stats["recency"].median():
                cluster_labels[cl] = CustomerSegment.LOYAL
            elif r > cluster_stats["recency"].quantile(0.7) and f > 1:
                cluster_labels[cl] = CustomerSegment.AT_RISK
            elif r > cluster_stats["recency"].quantile(0.8):
                cluster_labels[cl] = CustomerSegment.INACTIVE
            elif f <= 2 and r <= 60:
                cluster_labels[cl] = CustomerSegment.POTENTIAL
            else:
                cluster_labels[cl] = CustomerSegment.REGULAR

        # Update customer records in database
        segment_summary = {}
        for _, row in df.iterrows():
            cid = row["customer_id"]
            seg = cluster_labels.get(row["cluster"], CustomerSegment.REGULAR)
            cust = db.query(Customer).filter(Customer.id == cid).first()
            if cust:
                cust.rfm_segment = seg
                db.add(cust)
            seg_str = seg.value if hasattr(seg, "value") else str(seg)
            segment_summary[seg_str] = segment_summary.get(seg_str, 0) + 1

        db.commit()

        return {
            "total_segmented": len(df),
            "clusters_count": n_clusters,
            "segment_distribution": segment_summary,
            "customers": df[["customer_id", "customer_name", "recency", "frequency", "monetary"]].to_dict(orient="records")
        }

    def _heuristic_segmentation(self, db: Session, df: pd.DataFrame) -> dict:
        summary = {}
        for _, row in df.iterrows():
            cid = row["customer_id"]
            m = row["monetary"]
            r = row["recency"]
            f = row["frequency"]

            if m > 100000 and f > 5:
                seg = CustomerSegment.VIP
            elif f > 4 and r < 30:
                seg = CustomerSegment.LOYAL
            elif r > 90 and f > 0:
                seg = CustomerSegment.AT_RISK
            elif r > 180:
                seg = CustomerSegment.INACTIVE
            elif f == 1 and r < 45:
                seg = CustomerSegment.POTENTIAL
            else:
                seg = CustomerSegment.REGULAR

            cust = db.query(Customer).filter(Customer.id == cid).first()
            if cust:
                cust.rfm_segment = seg
                db.add(cust)
            seg_str = seg.value if hasattr(seg, "value") else str(seg)
            summary[seg_str] = summary.get(seg_str, 0) + 1

        db.commit()
        return {
            "total_segmented": len(df),
            "clusters_count": len(summary),
            "segment_distribution": summary,
            "customers": df.to_dict(orient="records") if not df.empty else []
        }
