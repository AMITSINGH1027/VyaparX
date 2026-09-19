from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_business_id, RoleChecker
from app.models.user import UserRole
from app.ml.customer_segmentation import CustomerSegmentationEngine
from app.ml.sales_forecasting import SalesForecastingEngine
from app.ml.demand_prediction import DemandPredictionEngine
from app.ml.churn_prediction import ChurnPredictionEngine
from app.ml.pipeline_manager import train_all_models

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.get("/customer-segments")
def get_customer_segments(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    engine = CustomerSegmentationEngine(business_id)
    return engine.train_and_segment(db)

@router.get("/sales-forecast")
def get_sales_forecast(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    engine = SalesForecastingEngine(business_id)
    return engine.generate_forecast(db)

@router.get("/demand-predictions")
def get_demand_predictions(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    engine = DemandPredictionEngine(business_id)
    return engine.predict_product_demands(db)

@router.get("/churn-radar")
def get_churn_radar(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    engine = ChurnPredictionEngine(business_id)
    return engine.analyze_and_predict_churn(db)

@router.post("/retrain-models")
def retrain_models(
    business_id: str = Depends(get_current_business_id),
    current_user = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    return train_all_models(db, business_id)
