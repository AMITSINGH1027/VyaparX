import re
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.sale import Sale, SaleItem, PaymentStatus
from app.models.customer import Customer
from app.models.product import Product
from app.models.expense import Expense
from app.models.supplier import Supplier
from app.analytics.financial_engine import (
    get_dashboard_kpis, get_top_products_analytics, 
    get_expense_breakdown, get_sales_by_category, get_inventory_status_breakdown
)
from app.ml.demand_prediction import DemandPredictionEngine
from app.ml.churn_prediction import ChurnPredictionEngine
from app.ml.sales_forecasting import SalesForecastingEngine

class AIAssistantEngine:
    def __init__(self, business_id: str):
        self.business_id = business_id

    def process_query(self, db: Session, user_query: str) -> Dict[str, Any]:
        query = user_query.lower().strip()
        kpis = get_dashboard_kpis(db, self.business_id)
        sales_count = db.query(Sale).filter(Sale.business_id == self.business_id).count()

        # If zero transactions in DB
        if sales_count == 0 and not any(w in query for w in ["product", "customer", "supplier", "expense"]):
            return {
                "intent": "EMPTY_DATABASE",
                "answer": "Your business database is currently fresh and clean (0 sales recorded). Add your catalog items and record sales in the POS to unlock live analytics, forecasting, and customer insights!",
                "data": None,
                "type": "text"
            }

        # 1. Top Selling Products
        if any(w in query for w in ["top product", "sold the most", "best product", "best seller", "highest selling", "popular item"]):
            top_prods = get_top_products_analytics(db, self.business_id, limit=5)
            if top_prods:
                best = top_prods[0]
                return {
                    "intent": "TOP_PRODUCT",
                    "answer": f"Your top-selling product is **{best['name']}** with **{best['units_sold']} units sold**, generating **₹{best['total_revenue']:,}** in revenue and **₹{best['profit']:,}** in gross profit.",
                    "data": top_prods,
                    "type": "table"
                }
            return {
                "intent": "TOP_PRODUCT",
                "answer": "No sales records found yet. Once you complete sales in the POS, your top-performing products will be ranked here.",
                "data": None,
                "type": "text"
            }

        # 2. Best Customers
        if any(w in query for w in ["best customer", "top customer", "highest spender", "who spent the most", "valuable customer"]):
            custs = db.query(Customer).filter(Customer.business_id == self.business_id).order_by(Customer.total_spent.desc()).limit(5).all()
            if custs and custs[0].total_spent > 0:
                top_c = custs[0]
                return {
                    "intent": "TOP_CUSTOMER",
                    "answer": f"Your highest-spending customer is **{top_c.name}** with lifetime spend of **₹{top_c.total_spent:,}** across **{top_c.order_count} orders**.",
                    "data": [{"name": c.name, "phone": c.phone, "total_spent": c.total_spent, "order_count": c.order_count, "segment": c.rfm_segment.value} for c in custs],
                    "type": "table"
                }
            return {
                "intent": "TOP_CUSTOMER",
                "answer": "No customer purchase history available yet. Record sales to build customer lifetime value metrics.",
                "data": None,
                "type": "text"
            }

        # 3. Financial Health / Revenue & Profit
        if any(w in query for w in ["revenue", "profit", "sales", "how much did we make", "financial health", "margin", "pnl"]):
            return {
                "intent": "FINANCIAL_HEALTH",
                "answer": f"Total revenue is **₹{kpis['revenue']:,}** across **{kpis['total_sales']} orders**, operating expenses stand at **₹{kpis['expenses']:,}**, and net profit is **₹{kpis['net_profit']:,}** ({kpis['net_margin_pct']}% margin).",
                "data": [{"Metric": "Gross Revenue", "Amount (INR)": kpis["revenue"]}, {"Metric": "Gross Profit", "Amount (INR)": kpis["gross_profit"]}, {"Metric": "Total Expenses", "Amount (INR)": kpis["expenses"]}, {"Metric": "Net Profit", "Amount (INR)": kpis["net_profit"]}],
                "type": "table"
            }

        # 4. Low stock / Restock
        if any(w in query for w in ["restock", "low stock", "reorder", "out of stock", "inventory alert"]):
            prods = db.query(Product).filter(Product.business_id == self.business_id, Product.current_stock <= Product.min_stock_alert).all()
            if prods:
                return {
                    "intent": "RESTOCK_RECOMMENDATIONS",
                    "answer": f"Found **{len(prods)} products** at or below minimum safety stock threshold:",
                    "data": [{"product": p.name, "sku": p.sku, "current_stock": p.current_stock, "min_alert": p.min_stock_alert} for p in prods],
                    "type": "table"
                }
            return {
                "intent": "RESTOCK_RECOMMENDATIONS",
                "answer": "All products currently maintain healthy inventory levels above minimum thresholds.",
                "data": None,
                "type": "text"
            }

        # Fallback helpful response
        return {
            "intent": "GENERAL_HELP",
            "answer": "I am ready to query your live database! You can ask questions such as:\n- *'What is our total revenue and profit?'*\n- *'Which product sold the most?'*\n- *'Who is my best customer?'*\n- *'Which products should I restock?'*\n- *'What are our operating expenses?'*",
            "data": None,
            "type": "text"
        }
