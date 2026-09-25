from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
from app.models.ml_model import MLModelRecord
from app.ml.customer_segmentation import CustomerSegmentationEngine
from app.ml.sales_forecasting import SalesForecastingEngine
from app.ml.churn_prediction import ChurnPredictionEngine
from app.ml.demand_prediction import DemandPredictionEngine

def train_all_models(db: Session, business_id: str) -> dict:
    seg_engine = CustomerSegmentationEngine(business_id)
    seg_res = seg_engine.train_and_segment(db)

    forecast_engine = SalesForecastingEngine(business_id)
    forecast_res = forecast_engine.generate_forecast(db)

    churn_engine = ChurnPredictionEngine(business_id)
    churn_res = churn_engine.analyze_and_predict_churn(db)

    demand_engine = DemandPredictionEngine(business_id)
    demand_res = demand_engine.predict_product_demands(db)

    # Save to ML model records table
    rec = MLModelRecord(
        business_id=business_id,
        model_type="FULL_PIPELINE",
        version="1.0.0",
        metrics_json=json.dumps(forecast_res.get("metrics", {})),
        status="TRAINED",
        last_trained_at=datetime.now(timezone.utc)
    )
    db.add(rec)
    db.commit()

    return {
        "status": "SUCCESS",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "segmentation": seg_res,
        "forecasting_metrics": forecast_res.get("metrics"),
        "high_churn_customers_count": sum(1 for c in churn_res if c["churn_risk"] == "HIGH"),
        "critical_reorders_count": sum(1 for d in demand_res if d["risk_status"] == "CRITICAL")
    }
