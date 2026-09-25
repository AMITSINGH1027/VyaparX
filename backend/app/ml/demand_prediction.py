from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
import numpy as np
from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.sale import Sale, SaleItem, PaymentStatus

class DemandPredictionEngine:
    def __init__(self, business_id: str):
        self.business_id = business_id

    def predict_product_demands(self, db: Session) -> List[Dict[str, Any]]:
        products = db.query(Product).filter(Product.business_id == self.business_id).all()
        if not products:
            return []

        now = datetime.now(timezone.utc)
        d60 = now - timedelta(days=60)

        sale_items = db.query(SaleItem).join(Sale).filter(
            Sale.business_id == self.business_id,
            Sale.payment_status != PaymentStatus.CANCELLED,
            Sale.sale_date >= d60
        ).all()

        item_sales_map = {}
        for item in sale_items:
            item_sales_map[item.product_id] = item_sales_map.get(item.product_id, 0) + item.quantity

        results = []
        for p in products:
            sold_60d = item_sales_map.get(p.id, 0)
            daily_velocity = sold_60d / 60.0
            
            # 30-day predicted demand
            predicted_30d_demand = int(np.ceil(daily_velocity * 30 * 1.1)) # 10% safety trend factor
            if predicted_30d_demand == 0 and p.current_stock > 0:
                predicted_30d_demand = max(2, int(p.min_stock_alert * 0.5))

            # Safety Stock = 7 days of demand + min alert buffer
            safety_stock = int(np.ceil(daily_velocity * 7)) + p.min_stock_alert

            # Recommended Purchase = Predicted Demand + Safety Stock - Current Stock
            recommended_reorder = max(0, predicted_30d_demand + safety_stock - p.current_stock)
            
            days_until_stockout = int(p.current_stock / daily_velocity) if daily_velocity > 0 else 999
            risk_status = "CRITICAL" if days_until_stockout <= 7 else ("WARNING" if days_until_stockout <= 14 else "HEALTHY")

            results.append({
                "product_id": p.id,
                "product_name": p.name,
                "sku": p.sku,
                "category": p.category.name if p.category else "General",
                "current_stock": p.current_stock,
                "min_stock": p.min_stock_alert,
                "daily_sales_velocity": round(daily_velocity, 2),
                "predicted_30d_demand": predicted_30d_demand,
                "safety_stock": safety_stock,
                "recommended_reorder": recommended_reorder,
                "days_until_stockout": days_until_stockout,
                "risk_status": risk_status
            })

        results.sort(key=lambda x: x["recommended_reorder"], reverse=True)
        return results
