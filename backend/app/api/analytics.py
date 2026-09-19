from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_business_id
from app.analytics.financial_engine import (
    get_dashboard_kpis, get_revenue_trends, get_sales_by_category, 
    get_top_products_analytics, get_expense_breakdown, get_inventory_status_breakdown
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/kpis")
def get_kpis(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    return get_dashboard_kpis(db, business_id)

@router.get("/revenue-trend")
def get_rev_trend(
    days: int = 30,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    return get_revenue_trends(db, business_id, days=days)

@router.get("/sales-category")
def get_sales_category(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    return get_sales_by_category(db, business_id)

@router.get("/top-products")
def get_top_products(
    limit: int = 10,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    return get_top_products_analytics(db, business_id, limit=limit)

@router.get("/expense-breakdown")
def get_expenses_chart(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    return get_expense_breakdown(db, business_id)

@router.get("/inventory-status")
def get_inv_status(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    return get_inventory_status_breakdown(db, business_id)
