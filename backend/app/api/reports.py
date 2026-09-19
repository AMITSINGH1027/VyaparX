import csv
import io
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_business_id, RoleChecker
from app.models.user import UserRole
from app.models.sale import Sale, SaleItem, PaymentStatus
from app.models.purchase import Purchase
from app.models.expense import Expense
from app.models.product import Product
from app.models.customer import Customer

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/sales")
def get_sales_report(
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    sales = db.query(Sale).filter(
        Sale.business_id == business_id,
        Sale.payment_status != PaymentStatus.CANCELLED
    ).all()

    total_revenue = sum(s.grand_total for s in sales)
    total_tax = sum(s.tax_amount for s in sales)
    total_discount = sum(s.discount_amount for s in sales)
    count = len(sales)

    return {
        "period": period,
        "total_revenue": round(total_revenue, 2),
        "total_tax_collected": round(total_tax, 2),
        "total_discounts_given": round(total_discount, 2),
        "total_orders": count,
        "average_order_value": round(total_revenue / count, 2) if count > 0 else 0.0
    }

@router.get("/profit-loss")
def get_profit_loss_statement(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    sales = db.query(Sale).filter(
        Sale.business_id == business_id,
        Sale.payment_status != PaymentStatus.CANCELLED
    ).all()
    revenue = sum(s.grand_total for s in sales)

    sale_items = db.query(SaleItem).join(Sale).filter(
        Sale.business_id == business_id,
        Sale.payment_status != PaymentStatus.CANCELLED
    ).all()
    cogs = sum(it.quantity * it.unit_cost for it in sale_items)
    gross_profit = revenue - cogs

    expenses = db.query(Expense).filter(Expense.business_id == business_id).all()
    operating_expenses = sum(e.amount for e in expenses)
    net_profit = gross_profit - operating_expenses

    return {
        "revenue": round(revenue, 2),
        "cogs": round(cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "gross_margin_pct": round((gross_profit / revenue * 100) if revenue > 0 else 0, 1),
        "operating_expenses": round(operating_expenses, 2),
        "net_profit": round(net_profit, 2),
        "net_margin_pct": round((net_profit / revenue * 100) if revenue > 0 else 0, 1)
    }

@router.get("/inventory")
def get_inventory_valuation_report(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.business_id == business_id).all()
    total_units = sum(p.current_stock for p in products)
    total_cost_val = sum(p.current_stock * p.cost_price for p in products)
    total_retail_val = sum(p.current_stock * p.selling_price for p in products)

    return {
        "total_skus": len(products),
        "total_units_in_stock": total_units,
        "inventory_cost_value": round(total_cost_val, 2),
        "inventory_retail_value": round(total_retail_val, 2),
        "potential_profit": round(total_retail_val - total_cost_val, 2)
    }
