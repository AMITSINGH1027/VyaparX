from typing import List, Dict, Any

from sqlalchemy.orm import Session

from app.analytics.financial_engine import (
    get_dashboard_kpis,
    get_sales_by_category,
    get_top_products_analytics,
)

from app.ml.demand_prediction import DemandPredictionEngine
from app.ml.churn_prediction import ChurnPredictionEngine

from app.models.business import Business
from app.models.sale import Sale


class AIInsightsEngine:

    def __init__(self, business_id: str):
        self.business_id = business_id

    def generate_actionable_insights(
        self,
        db: Session
    ) -> List[Dict[str, Any]]:

        biz = db.query(Business).filter(
            Business.id == self.business_id
        ).first()

        currency = biz.currency_symbol if biz else "₹"

        kpis = get_dashboard_kpis(
            db,
            self.business_id
        )

        sales_count = db.query(Sale).filter(
            Sale.business_id == self.business_id
        ).count()

        insights = []

        # If zero sales, return clean onboarding discovery guidance
        if sales_count == 0:
            insights.append({
                "id": "onboarding_welcome",
                "type": "GROWTH",
                "title": "Welcome to VyaparX Intelligence",
                "impact": "HIGH",
                "tag": "ONBOARDING",
                "message": (
                    "Your automated AI insights engine is active. "
                    "As you add products and record sales transactions, "
                    "proactive intelligence cards will generate automatically."
                )
            })

            return insights

        # 1. Sales Growth
        if kpis["revenue"] > 0:
            insights.append({
                "id": "growth_revenue",
                "type": "GROWTH",
                "title": "Revenue Performance",
                "impact": "HIGH",
                "tag": "SALES VELOCITY",
                "message": (
                    f"Gross revenue stands at "
                    f"{currency}{kpis['revenue']:,} across "
                    f"{kpis['total_sales']} orders with an Average "
                    f"Order Value of "
                    f"{currency}{kpis['average_order_value']:,}."
                )
            })

        # 2. Inventory Alert
        if kpis["low_stock_products"] > 0:
            insights.append({
                "id": "inv_low_stock",
                "type": "INVENTORY",
                "title": "Low Stock Inventory Warning",
                "impact": "CRITICAL",
                "tag": "STOCKOUT RISK",
                "message": (
                    f"Identified "
                    f"{kpis['low_stock_products']} items at or below "
                    "safety stock threshold. Restock recommended "
                    "to prevent lost sales."
                )
            })

        # 3. Profit Margin
        if kpis["gross_profit"] > 0:
            insights.append({
                "id": "profit_margin",
                "type": "PROFIT",
                "title": "Gross Margin Efficiency",
                "impact": "MEDIUM",
                "tag": "MARGIN HEALTH",
                "message": (
                    f"Operating with a "
                    f"{kpis['gross_margin_pct']}% gross margin and "
                    f"{kpis['net_margin_pct']}% net margin after expenses."
                )
            })

        return insights

    def generate_dashboard_summary_text(
        self,
        db: Session
    ) -> Dict[str, Any]:
        """
        Generate the summary displayed on the Dashboard.
        """

        biz = db.query(Business).filter(
            Business.id == self.business_id
        ).first()

        currency = biz.currency_symbol if biz else "₹"

        kpis = get_dashboard_kpis(
            db,
            self.business_id
        )

        sales_count = db.query(Sale).filter(
            Sale.business_id == self.business_id
        ).count()

        # No sales yet
        if sales_count == 0:
            return {
                "overview": (
                    "Your VyaparX business intelligence dashboard "
                    "is ready. Start recording sales and adding "
                    "products to generate financial and AI insights."
                ),
                "currency": currency,
                "sales_count": 0,
                "revenue": 0,
                "gross_profit": 0,
                "gross_margin_pct": 0,
                "net_margin_pct": 0,
                "insights": self.generate_actionable_insights(db),
            }

        revenue = kpis.get("revenue", 0)
        total_sales = kpis.get("total_sales", 0)
        average_order_value = kpis.get("average_order_value", 0)
        gross_profit = kpis.get("gross_profit", 0)
        gross_margin_pct = kpis.get("gross_margin_pct", 0)
        net_margin_pct = kpis.get("net_margin_pct", 0)
        low_stock_products = kpis.get("low_stock_products", 0)

        overview = (
            f"Your business has generated "
            f"{currency}{revenue:,.2f} in revenue from "
            f"{total_sales} orders, with an average order value "
            f"of {currency}{average_order_value:,.2f}. "
        )

        if gross_profit > 0:
            overview += (
                f"Gross profit is "
                f"{currency}{gross_profit:,.2f}, "
                f"with a gross margin of "
                f"{gross_margin_pct}%. "
            )

        if low_stock_products > 0:
            overview += (
                f"{low_stock_products} products are currently "
                "at or below the low-stock threshold."
            )
        else:
            overview += "No immediate low-stock alerts were detected."

        return {
            "overview": overview,
            "currency": currency,
            "sales_count": sales_count,
            "revenue": revenue,
            "total_sales": total_sales,
            "average_order_value": average_order_value,
            "gross_profit": gross_profit,
            "gross_margin_pct": gross_margin_pct,
            "net_margin_pct": net_margin_pct,
            "low_stock_products": low_stock_products,
            "insights": self.generate_actionable_insights(db),
        }