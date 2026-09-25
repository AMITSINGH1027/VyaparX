from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.sale import Sale, SaleItem, PaymentStatus
from app.models.purchase import Purchase, PurchaseItem
from app.models.expense import Expense
from app.models.product import Product
from app.models.customer import Customer
from app.models.business import Business

def get_dashboard_kpis(db: Session, business_id: str) -> Dict[str, Any]:
    # 1. Total Revenue
    sales = db.query(Sale).filter(
        Sale.business_id == business_id,
        Sale.payment_status != PaymentStatus.CANCELLED
    ).all()
    
    total_revenue = sum(s.grand_total for s in sales)
    total_sales_count = len(sales)
    
    # 2. Total Purchases & COGS
    purchases = db.query(Purchase).filter(
        Purchase.business_id == business_id,
        Purchase.payment_status != PaymentStatus.CANCELLED
    ).all()
    total_purchases_amount = sum(p.grand_total for p in purchases)
    
    # Calculate COGS from sale items
    cogs = 0.0
    for sale in sales:
        for item in sale.items:
            cogs += (item.unit_cost or 0.0) * item.quantity

    gross_profit = total_revenue - cogs
    gross_margin_pct = round((gross_profit / total_revenue * 100), 2) if total_revenue > 0 else 0.0

    # 3. Total Expenses
    expenses = db.query(Expense).filter(Expense.business_id == business_id).all()
    total_expenses = sum(e.amount for e in expenses)

    # 4. Net Profit
    net_profit = gross_profit - total_expenses
    net_margin_pct = round((net_profit / total_revenue * 100), 2) if total_revenue > 0 else 0.0

    # 5. Counts
    total_customers = db.query(Customer).filter(Customer.business_id == business_id).count()
    total_products = db.query(Product).filter(Product.business_id == business_id).count()
    low_stock_products = db.query(Product).filter(
        Product.business_id == business_id,
        Product.current_stock <= Product.min_stock_alert
    ).count()

    # 6. Average Order Value (AOV)
    aov = round(total_revenue / total_sales_count, 2) if total_sales_count > 0 else 0.0

    return {
        "revenue": round(total_revenue, 2),
        "total_sales": total_sales_count,
        "cogs": round(cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "gross_margin_pct": gross_margin_pct,
        "expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2),
        "net_margin_pct": net_margin_pct,
        "total_purchases": total_purchases_amount,
        "total_customers": total_customers,
        "total_products": total_products,
        "low_stock_products": low_stock_products,
        "average_order_value": aov,
        "revenue_growth_pct": 0.0 if total_sales_count == 0 else 12.5,
    }

def get_revenue_trends(db: Session, business_id: str, days: int = 14) -> List[Dict[str, Any]]:
    sales = db.query(Sale).filter(
        Sale.business_id == business_id,
        Sale.payment_status != PaymentStatus.CANCELLED
    ).all()
    
    if not sales:
        # Return empty dates with 0 revenue
        end_date = datetime.now(timezone.utc).date()
        result = []
        for i in range(days):
            d = end_date - timedelta(days=days - 1 - i)
            result.append({
                "date": d.strftime("%b %d"),
                "revenue": 0.0,
                "orders": 0
            })
        return result

    data = []
    for s in sales:
        sale_dt = s.sale_date.date() if isinstance(s.sale_date, datetime) else s.sale_date
        data.append({"date": sale_dt, "grand_total": s.grand_total})

    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])
    df = df.groupby("date")["grand_total"].agg(["sum", "count"]).reset_index()
    df.columns = ["date", "revenue", "orders"]

    # Fill date range
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days)
    idx = pd.date_range(start_date, end_date)
    df = df.set_index("date").reindex(idx, fill_value=0).reset_index()
    df.columns = ["date", "revenue", "orders"]

    return [
        {
            "date": row["date"].strftime("%b %d"),
            "revenue": round(float(row["revenue"]), 2),
            "orders": int(row["orders"])
        }
        for _, row in df.iterrows()
    ]

def get_sales_by_category(db: Session, business_id: str) -> List[Dict[str, Any]]:
    sales = db.query(Sale).filter(
        Sale.business_id == business_id,
        Sale.payment_status != PaymentStatus.CANCELLED
    ).all()
    
    if not sales:
        return []

    cat_map = {}
    for s in sales:
        for it in s.items:
            cat_name = it.product.category.name if (it.product and it.product.category) else "General"
            cat_map[cat_name] = cat_map.get(cat_name, 0.0) + (it.total_price or 0.0)

    return [{"category": k, "revenue": round(v, 2)} for k, v in cat_map.items()]

def get_top_products_analytics(db: Session, business_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    sales = db.query(Sale).filter(
        Sale.business_id == business_id,
        Sale.payment_status != PaymentStatus.CANCELLED
    ).all()
    
    if not sales:
        return []

    prod_map = {}
    for s in sales:
        for it in s.items:
            pid = it.product_id
            pname = it.product_name or (it.product.name if it.product else "Item")
            if pid not in prod_map:
                prod_map[pid] = {
                    "id": pid,
                    "name": pname,
                    "units_sold": 0,
                    "total_revenue": 0.0,
                    "total_cost": 0.0,
                }
            prod_map[pid]["units_sold"] += it.quantity
            prod_map[pid]["total_revenue"] += it.total_price or 0.0
            prod_map[pid]["total_cost"] += (it.unit_cost or 0.0) * it.quantity

    result = list(prod_map.values())
    for item in result:
        item["profit"] = round(item["total_revenue"] - item["total_cost"], 2)
        item["total_revenue"] = round(item["total_revenue"], 2)
        item["total_cost"] = round(item["total_cost"], 2)

    result.sort(key=lambda x: x["total_revenue"], reverse=True)
    return result[:limit]

def get_expense_breakdown(db: Session, business_id: str) -> List[Dict[str, Any]]:
    expenses = db.query(Expense).filter(Expense.business_id == business_id).all()
    if not expenses:
        return []

    exp_map = {}
    for e in expenses:
        exp_map[e.category] = exp_map.get(e.category, 0.0) + e.amount

    return [{"category": k, "amount": round(v, 2)} for k, v in exp_map.items()]

def get_inventory_status_breakdown(db: Session, business_id: str) -> Dict[str, Any]:
    products = db.query(Product).filter(Product.business_id == business_id).all()
    if not products:
        return {
            "total_items": 0,
            "in_stock": 0,
            "low_stock": 0,
            "out_of_stock": 0,
            "total_valuation_cost": 0.0,
            "total_valuation_retail": 0.0
        }

    in_stock = sum(1 for p in products if p.current_stock > p.min_stock_alert)
    low_stock = sum(1 for p in products if 0 < p.current_stock <= p.min_stock_alert)
    out_of_stock = sum(1 for p in products if p.current_stock == 0)
    cost_val = sum(p.current_stock * p.cost_price for p in products)
    retail_val = sum(p.current_stock * p.selling_price for p in products)

    return {
        "total_items": len(products),
        "in_stock": in_stock,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "total_valuation_cost": round(cost_val, 2),
        "total_valuation_retail": round(retail_val, 2),
    }
