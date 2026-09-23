import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.models.sale import Sale, SaleItem, PaymentStatus
from app.models.customer import Customer
from app.models.product import Product
from app.models.expense import Expense
from app.models.supplier import Supplier

from app.analytics.financial_engine import (
    get_dashboard_kpis,
    get_top_products_analytics,
    get_expense_breakdown,
    get_sales_by_category,
    get_inventory_status_breakdown,
)

from app.ml.demand_prediction import DemandPredictionEngine
from app.ml.churn_prediction import ChurnPredictionEngine
from app.ml.sales_forecasting import SalesForecastingEngine


class AIAssistantEngine:
    """
    VyaparX Business Copilot.

    Security:
    - No raw SQL generated from user input.
    - All database access uses predefined SQLAlchemy queries/functions.
    - User query is used only for intent detection.
    """

    def __init__(self, business_id: str):
        self.business_id = business_id

    # ---------------------------------------------------------
    # Helpers
    # ---------------------------------------------------------

    @staticmethod
    def _money(value: Any) -> str:
        try:
            return f"₹{float(value or 0):,.2f}"
        except (TypeError, ValueError):
            return "₹0.00"

    @staticmethod
    def _number(value: Any) -> str:
        try:
            number = float(value or 0)
            if number.is_integer():
                return f"{int(number):,}"
            return f"{number:,.2f}"
        except (TypeError, ValueError):
            return "0"

    @staticmethod
    def _normalize_query(query: str) -> str:
        query = (query or "").lower().strip()

        replacements = {
            "sabse jyada": "highest",
            "sabse zyada": "highest",
            "zyada": "high",
            "jyada": "high",
            "bikne wala": "selling",
            "bik raha": "selling",
            "bikta": "selling",
            "kitna hua": "how much",
            "kitni hui": "how much",
            "kitne hai": "how many",
            "kaun sa": "which",
            "kaunsa": "which",
            "konsa": "which",
            "kaunse": "which",
            "kaun": "who",
            "mera": "my",
            "meri": "my",
            "mere": "my",
            "hai": "",
            "hain": "",
            "kya": "",
            "dikhao": "show",
            "batao": "show",
            "btao": "show",
            "pichle": "last",
            "aakhri": "last",
            "mahine": "month",
            "mahina": "month",
            "din": "days",
            "grahak": "customer",
            "customers": "customer",
            "maal": "product",
            "samaan": "product",
            "kharcha": "expense",
            "kharch": "expense",
            "stock kam": "low stock",
            "stock khatam": "out of stock",
        }

        for old, new in replacements.items():
            query = query.replace(old, new)

        query = re.sub(r"\s+", " ", query).strip()

        return query

    @staticmethod
    def _contains_any(query: str, phrases: List[str]) -> bool:
        return any(phrase in query for phrase in phrases)

    def _response(
        self,
        intent: str,
        answer: str,
        data: Optional[List[Dict[str, Any]]] = None,
        response_type: str = "text",
        meta: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        result = {
            "intent": intent,
            "answer": answer,
            "data": data,
            "type": response_type,
        }

        if meta:
            result["meta"] = meta

        return result

    # ---------------------------------------------------------
    # Main processor
    # ---------------------------------------------------------

    def process_query(
        self,
        db: Session,
        user_query: str
    ) -> Dict[str, Any]:

        query = self._normalize_query(user_query)

        if not query:
            return self._response(
                "EMPTY_QUERY",
                "Please ask me a business question. For example: "
                "'What is our profit?', 'Which product sold the most?' "
                "or 'Which products should I restock?'"
            )

        # =====================================================
        # 1. SALES FORECAST
        # =====================================================

        if self._contains_any(
            query,
            [
                "forecast",
                "future sales",
                "expected sales",
                "predict sales",
                "sales prediction",
                "next 7 days",
                "next 30 days",
                "next 90 days",
                "future revenue",
                "expected revenue",
                "agle 7 days",
                "agle 30 days",
                "agle 90 days",
            ],
        ):
            try:
                engine = SalesForecastingEngine(self.business_id)
                forecast = engine.generate_forecast(db)

                return self._response(
                    "SALES_FORECAST",
                    (
                        f"Based on your historical sales data, estimated revenue is "
                        f"**{self._money(forecast['forecast_7d'])}** for the next 7 days, "
                        f"**{self._money(forecast['forecast_30d'])}** for the next 30 days, "
                        f"and **{self._money(forecast['forecast_90d'])}** for the next 90 days."
                    ),
                    data=forecast.get("daily_forecast", []),
                    response_type="forecast",
                    meta={
                        "model": forecast.get("model"),
                        "metrics": forecast.get("metrics"),
                        "forecast_7d": forecast.get("forecast_7d"),
                        "forecast_30d": forecast.get("forecast_30d"),
                        "forecast_90d": forecast.get("forecast_90d"),
                    },
                )

            except Exception:
                return self._response(
                    "SALES_FORECAST",
                    "I couldn't generate the sales forecast right now. "
                    "Please make sure there is enough historical sales data."
                )

        # =====================================================
        # 2. DEMAND / PRODUCT RESTOCK PREDICTION
        # =====================================================

        if self._contains_any(
            query,
            [
                "demand",
                "predict demand",
                "product demand",
                "future demand",
                "restock",
                "reorder",
                "low stock",
                "out of stock",
                "inventory alert",
                "stockout",
                "stock out",
                "inventory risk",
                "which products should",
                "purchase recommendation",
            ],
        ):
            try:
                engine = DemandPredictionEngine(self.business_id)
                predictions = engine.predict_product_demands(db)

                if not predictions:
                    return self._response(
                        "DEMAND_PREDICTION",
                        "No products are available for demand analysis yet."
                    )

                # Actual restock/risk products first
                critical = [
                    p for p in predictions
                    if p["risk_status"] in ["CRITICAL", "WARNING"]
                    or p["recommended_reorder"] > 0
                ]

                rows = critical[:10] if critical else predictions[:10]

                if critical:
                    answer = (
                        f"I found **{len(critical)} products** that need inventory "
                        f"attention. The list is prioritized using predicted 30-day "
                        f"demand, safety stock, current inventory and stockout risk."
                    )
                else:
                    answer = (
                        "Your current inventory looks healthy based on the demand "
                        "prediction model. No immediate reorder recommendation was generated."
                    )

                return self._response(
                    "DEMAND_PREDICTION",
                    answer,
                    data=rows,
                    response_type="demand",
                    meta={
                        "total_products": len(predictions),
                        "attention_required": len(critical),
                    },
                )

            except Exception:
                return self._response(
                    "DEMAND_PREDICTION",
                    "I couldn't calculate product demand predictions right now."
                )

        # =====================================================
        # 3. CUSTOMER CHURN
        # =====================================================

        if self._contains_any(
            query,
            [
                "churn",
                "churn risk",
                "customer risk",
                "lose customer",
                "losing customer",
                "customers at risk",
                "inactive customer",
                "inactive customers",
                "inactive",
                "customer retention",
                "customers inactive",
            ],
        ):
            try:
                engine = ChurnPredictionEngine(self.business_id)
                churn_results = engine.analyze_and_predict_churn(db)

                if not churn_results:
                    return self._response(
                        "CUSTOMER_CHURN",
                        "There are no customers available for churn analysis yet."
                    )

                high = [
                    c for c in churn_results
                    if str(c["churn_risk"]).upper() == "HIGH"
                ]

                medium = [
                    c for c in churn_results
                    if str(c["churn_risk"]).upper() == "MEDIUM"
                ]

                if high:
                    answer = (
                        f"I found **{len(high)} high-risk customers**. "
                        f"They have signals such as prolonged inactivity or reduced "
                        f"purchase frequency."
                    )
                    rows = high[:10]
                elif medium:
                    answer = (
                        f"I found **{len(medium)} medium-risk customers**. "
                        f"These customers may need engagement or follow-up."
                    )
                    rows = medium[:10]
                else:
                    answer = (
                        "No high or medium customer churn risk was detected "
                        "by the current model."
                    )
                    rows = churn_results[:10]

                return self._response(
                    "CUSTOMER_CHURN",
                    answer,
                    data=rows,
                    response_type="churn",
                    meta={
                        "total_customers": len(churn_results),
                        "high_risk": len(high),
                        "medium_risk": len(medium),
                    },
                )

            except Exception:
                return self._response(
                    "CUSTOMER_CHURN",
                    "I couldn't calculate customer churn risk right now."
                )

        # =====================================================
        # 4. TOP SELLING PRODUCTS
        # =====================================================

        if self._contains_any(
            query,
            [
                "top product",
                "sold the most",
                "best product",
                "best seller",
                "highest selling",
                "popular item",
                "most selling",
                "top selling",
                "highest product",
                "selling product",
                "highest sales product",
            ],
        ):
            top_products = get_top_products_analytics(
                db,
                self.business_id,
                limit=10
            )

            if top_products:
                best = top_products[0]

                return self._response(
                    "TOP_PRODUCT",
                    (
                        f"Your top-selling product is **{best['name']}** "
                        f"with **{self._number(best['units_sold'])} units sold**, "
                        f"generating **{self._money(best['total_revenue'])}** "
                        f"in revenue and **{self._money(best['profit'])}** "
                        f"in gross profit."
                    ),
                    data=top_products,
                    response_type="table",
                )

            return self._response(
                "TOP_PRODUCT",
                "No sales records found yet. Once you complete sales in POS, "
                "your top-performing products will appear here."
            )

        # =====================================================
        # 5. SLOW MOVING PRODUCTS
        # =====================================================

        if self._contains_any(
            query,
            [
                "slow product",
                "slow moving",
                "slow-moving",
                "not selling",
                "least selling",
                "poor selling",
                "dead stock",
                "products not selling",
            ],
        ):
            products = db.query(Product).filter(
                Product.business_id == self.business_id
            ).all()

            if not products:
                return self._response(
                    "SLOW_PRODUCTS",
                    "No products are available for analysis yet."
                )

            demand_engine = DemandPredictionEngine(self.business_id)
            predictions = demand_engine.predict_product_demands(db)

            slow_products = sorted(
                predictions,
                key=lambda x: x["daily_sales_velocity"]
            )[:10]

            return self._response(
                "SLOW_PRODUCTS",
                (
                    f"Here are the products with the lowest recent sales velocity. "
                    f"These may need pricing, promotion or inventory review."
                ),
                data=slow_products,
                response_type="table",
            )

        # =====================================================
        # 6. BEST CUSTOMERS
        # =====================================================

        if self._contains_any(
            query,
            [
                "best customer",
                "top customer",
                "highest spender",
                "who spent the most",
                "valuable customer",
                "top buyer",
                "best buyer",
                "highest customer",
            ],
        ):
            customers = (
                db.query(Customer)
                .filter(Customer.business_id == self.business_id)
                .order_by(Customer.total_spent.desc())
                .limit(10)
                .all()
            )

            customers = [
                c for c in customers
                if float(c.total_spent or 0) > 0
            ]

            if customers:
                top_customer = customers[0]

                data = []

                for c in customers:
                    segment = getattr(c, "rfm_segment", None)

                    data.append(
                        {
                            "name": c.name,
                            "phone": c.phone,
                            "total_spent": float(c.total_spent or 0),
                            "order_count": c.order_count,
                            "segment": (
                                segment.value
                                if hasattr(segment, "value")
                                else str(segment or "N/A")
                            ),
                        }
                    )

                return self._response(
                    "TOP_CUSTOMER",
                    (
                        f"Your highest-spending customer is **{top_customer.name}** "
                        f"with lifetime spend of "
                        f"**{self._money(top_customer.total_spent)}** "
                        f"across **{top_customer.order_count} orders**."
                    ),
                    data=data,
                    response_type="table",
                )

            return self._response(
                "TOP_CUSTOMER",
                "No customer purchase history is available yet."
            )

        # =====================================================
        # 7. CUSTOMER COUNT
        # =====================================================

        if self._contains_any(
            query,
            [
                "how many customer",
                "number of customer",
                "total customer",
                "customer count",
                "customers count",
            ],
        ):
            count = (
                db.query(Customer)
                .filter(Customer.business_id == self.business_id)
                .count()
            )

            return self._response(
                "CUSTOMER_COUNT",
                f"You currently have **{count:,} customers** in VyaparX.",
                data=[
                    {
                        "metric": "Total Customers",
                        "value": count,
                    }
                ],
                response_type="table",
            )

        # =====================================================
        # 8. FINANCIAL HEALTH
        # =====================================================

        if self._contains_any(
            query,
            [
                "revenue",
                "profit",
                "sales",
                "how much did we make",
                "financial health",
                "margin",
                "pnl",
                "income",
                "earning",
                "earnings",
                "turnover",
                "business performance",
            ],
        ):
            kpis = get_dashboard_kpis(
                db,
                self.business_id
            )

            return self._response(
                "FINANCIAL_HEALTH",
                (
                    f"Your business has generated **{self._money(kpis['revenue'])}** "
                    f"revenue across **{kpis['total_sales']:,} orders**. "
                    f"Gross profit is **{self._money(kpis['gross_profit'])}**, "
                    f"operating expenses are **{self._money(kpis['expenses'])}**, "
                    f"and net profit is **{self._money(kpis['net_profit'])}** "
                    f"with a **{kpis['net_margin_pct']}%** net margin."
                ),
                data=[
                    {
                        "Metric": "Gross Revenue",
                        "Amount": kpis["revenue"],
                    },
                    {
                        "Metric": "Gross Profit",
                        "Amount": kpis["gross_profit"],
                    },
                    {
                        "Metric": "Total Expenses",
                        "Amount": kpis["expenses"],
                    },
                    {
                        "Metric": "Net Profit",
                        "Amount": kpis["net_profit"],
                    },
                    {
                        "Metric": "Net Margin",
                        "Amount": f"{kpis['net_margin_pct']}%",
                    },
                ],
                response_type="table",
            )

        # =====================================================
        # 9. EXPENSE INTELLIGENCE
        # =====================================================

        if self._contains_any(
            query,
            [
                "expense",
                "expenses",
                "highest expense",
                "highest expenses",
                "expense breakdown",
                "where are we spending",
                "spending",
                "cost breakdown",
                "operating cost",
            ],
        ):
            try:
                breakdown = get_expense_breakdown(
                    db,
                    self.business_id
                )

                if breakdown:
                    return self._response(
                        "EXPENSE_BREAKDOWN",
                        "Here is the current breakdown of your business expenses.",
                        data=breakdown[:10],
                        response_type="table",
                    )

                return self._response(
                    "EXPENSE_BREAKDOWN",
                    "No expense records were found yet."
                )

            except Exception:
                return self._response(
                    "EXPENSE_BREAKDOWN",
                    "I couldn't load the expense breakdown right now."
                )

        # =====================================================
        # 10. SALES BY CATEGORY
        # =====================================================

        if self._contains_any(
            query,
            [
                "category sales",
                "sales by category",
                "best category",
                "top category",
                "category performance",
                "which category",
            ],
        ):
            try:
                category_data = get_sales_by_category(
                    db,
                    self.business_id
                )

                return self._response(
                    "SALES_BY_CATEGORY",
                    "Here is your sales performance by product category.",
                    data=category_data[:10] if category_data else [],
                    response_type="table",
                )

            except Exception:
                return self._response(
                    "SALES_BY_CATEGORY",
                    "I couldn't calculate category-wise sales right now."
                )

        # =====================================================
        # 11. INVENTORY STATUS
        # =====================================================

        if self._contains_any(
            query,
            [
                "inventory",
                "stock status",
                "inventory status",
                "stock summary",
                "stock overview",
            ],
        ):
            try:
                inventory_data = get_inventory_status_breakdown(
                    db,
                    self.business_id
                )

                return self._response(
                    "INVENTORY_STATUS",
                    "Here is your current inventory status.",
                    data=inventory_data,
                    response_type="table",
                )

            except Exception:
                return self._response(
                    "INVENTORY_STATUS",
                    "I couldn't load the inventory status right now."
                )

        # =====================================================
        # 12. OUT OF STOCK
        # =====================================================

        if self._contains_any(
            query,
            [
                "out of stock",
                "stock khatam",
                "zero stock",
                "no stock",
            ],
        ):
            products = (
                db.query(Product)
                .filter(
                    Product.business_id == self.business_id,
                    Product.current_stock <= 0,
                )
                .limit(20)
                .all()
            )

            if products:
                data = [
                    {
                        "product": p.name,
                        "sku": p.sku,
                        "current_stock": p.current_stock,
                    }
                    for p in products
                ]

                return self._response(
                    "OUT_OF_STOCK",
                    f"**{len(products)} products** are currently out of stock.",
                    data=data,
                    response_type="table",
                )

            return self._response(
                "OUT_OF_STOCK",
                "Good news: no products are currently out of stock."
            )

        # =====================================================
        # 13. LOW STOCK
        # =====================================================

        if self._contains_any(
            query,
            [
                "low stock",
                "stock low",
                "kam stock",
                "minimum stock",
            ],
        ):
            products = (
                db.query(Product)
                .filter(
                    Product.business_id == self.business_id,
                    Product.current_stock <= Product.min_stock_alert,
                )
                .order_by(Product.current_stock.asc())
                .limit(20)
                .all()
            )

            if products:
                data = [
                    {
                        "product": p.name,
                        "sku": p.sku,
                        "current_stock": p.current_stock,
                        "min_alert": p.min_stock_alert,
                    }
                    for p in products
                ]

                return self._response(
                    "LOW_STOCK",
                    f"**{len(products)} products** are at or below their minimum stock level.",
                    data=data,
                    response_type="table",
                )

            return self._response(
                "LOW_STOCK",
                "All products are currently above their minimum stock thresholds."
            )

        # =====================================================
        # 14. SUPPLIER COUNT / SUPPLIER INFO
        # =====================================================

        if self._contains_any(
            query,
            [
                "supplier",
                "suppliers",
                "vendor",
                "vendors",
            ],
        ):
            suppliers = (
                db.query(Supplier)
                .filter(Supplier.business_id == self.business_id)
                .all()
            )

            if not suppliers:
                return self._response(
                    "SUPPLIER_INFO",
                    "No suppliers are registered yet."
                )

            data = []

            for supplier in suppliers[:20]:
                data.append(
                    {
                        "name": getattr(supplier, "name", "N/A"),
                        "phone": getattr(supplier, "phone", "N/A"),
                        "email": getattr(supplier, "email", "N/A"),
                    }
                )

            return self._response(
                "SUPPLIER_INFO",
                f"You currently have **{len(suppliers)} suppliers** registered.",
                data=data,
                response_type="table",
            )

        # =====================================================
        # 15. BUSINESS OVERVIEW
        # =====================================================

        if self._contains_any(
            query,
            [
                "overview",
                "business summary",
                "business overview",
                "dashboard summary",
                "how is business",
                "business status",
                "summary",
            ],
        ):
            kpis = get_dashboard_kpis(
                db,
                self.business_id
            )

            product_count = (
                db.query(Product)
                .filter(Product.business_id == self.business_id)
                .count()
            )

            customer_count = (
                db.query(Customer)
                .filter(Customer.business_id == self.business_id)
                .count()
            )

            return self._response(
                "BUSINESS_OVERVIEW",
                (
                    f"Here's your current business snapshot:\n\n"
                    f"• Revenue: **{self._money(kpis['revenue'])}**\n"
                    f"• Gross Profit: **{self._money(kpis['gross_profit'])}**\n"
                    f"• Expenses: **{self._money(kpis['expenses'])}**\n"
                    f"• Net Profit: **{self._money(kpis['net_profit'])}**\n"
                    f"• Net Margin: **{kpis['net_margin_pct']}%**\n"
                    f"• Orders: **{kpis['total_sales']:,}**\n"
                    f"• Products: **{product_count:,}**\n"
                    f"• Customers: **{customer_count:,}**"
                ),
                response_type="text",
            )

        # =====================================================
        # 16. EMPTY DATABASE
        # =====================================================

        sales_count = (
            db.query(Sale)
            .filter(Sale.business_id == self.business_id)
            .count()
        )

        if sales_count == 0:
            return self._response(
                "EMPTY_DATABASE",
                (
                    "Your VyaparX business currently has no recorded sales. "
                    "Add products and record sales through POS to unlock "
                    "sales analytics, customer intelligence, demand prediction "
                    "and forecasting."
                )
            )

        # =====================================================
        # 17. FALLBACK
        # =====================================================

        return self._response(
            "GENERAL_HELP",
            (
                "I can analyze your VyaparX business. Try asking:\n\n"
                "• **Which product sold the most?**\n"
                "• **What is our revenue and profit?**\n"
                "• **Which products should I restock?**\n"
                "• **What is our sales forecast for the next 30 days?**\n"
                "• **Which customers are at churn risk?**\n"
                "• **Who is my best customer?**\n"
                "• **What are our highest expenses?**\n"
                "• **Show sales by category**\n"
                "• **Show low stock products**\n"
                "• **Show out of stock products**\n"
                "• **Give me a business overview**"
            )
        )