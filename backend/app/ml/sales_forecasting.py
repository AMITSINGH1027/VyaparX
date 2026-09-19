import os
import joblib
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, mean_absolute_percentage_error
from sqlalchemy.orm import Session
from app.models.sale import Sale, PaymentStatus
from app.core.config import settings

class SalesForecastingEngine:
    def __init__(self, business_id: str):
        self.business_id = business_id
        self.model_path = os.path.join(settings.ML_MODELS_DIR, f"sales_forecast_{business_id}.joblib")
        os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)

    def prepare_daily_data(self, db: Session) -> pd.DataFrame:
        sales = db.query(Sale).filter(
            Sale.business_id == self.business_id,
            Sale.payment_status != PaymentStatus.CANCELLED
        ).all()

        if not sales:
            return pd.DataFrame()

        records = []
        for s in sales:
            records.append({
                "date": s.sale_date.date() if s.sale_date else datetime.now().date(),
                "revenue": s.grand_total
            })

        df = pd.DataFrame(records)
        df["date"] = pd.to_datetime(df["date"])
        daily = df.groupby("date")["revenue"].sum().reset_index()
        daily = daily.sort_values("date").set_index("date")

        # Fill date gaps with 0
        if not daily.empty:
            full_idx = pd.date_range(start=daily.index.min(), end=daily.index.max())
            daily = daily.reindex(full_idx, fill_value=0.0).rename_axis("date").reset_index()

        return daily

    def generate_forecast(self, db: Session) -> Dict[str, Any]:
        df = self.prepare_daily_data(db)

        if len(df) < 14:
            # Baseline estimation if insufficient history
            avg_daily = df["revenue"].mean() if not df.empty and df["revenue"].mean() > 0 else 5000.0
            return {
                "model": "Baseline Moving Average",
                "metrics": {"mae": 0.0, "rmse": 0.0, "mape": 0.0},
                "forecast_7d": round(avg_daily * 7, 2),
                "forecast_30d": round(avg_daily * 30, 2),
                "forecast_90d": round(avg_daily * 90, 2),
                "daily_forecast": [
                    {
                        "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
                        "predicted_revenue": round(avg_daily * (1 + np.sin(i / 7) * 0.1), 2),
                        "lower_bound": round(avg_daily * 0.8, 2),
                        "upper_bound": round(avg_daily * 1.2, 2)
                    }
                    for i in range(1, 31)
                ]
            }

        # Feature Engineering
        df["day_of_week"] = df["date"].dt.dayofweek
        df["day_of_month"] = df["date"].dt.day
        df["month"] = df["date"].dt.month
        df["lag_1"] = df["revenue"].shift(1).bfill()
        df["lag_7"] = df["revenue"].shift(7).bfill()
        df["rolling_mean_7"] = df["revenue"].rolling(7, min_periods=1).mean()
        df["rolling_mean_14"] = df["revenue"].rolling(14, min_periods=1).mean()

        features = ["day_of_week", "day_of_month", "month", "lag_1", "lag_7", "rolling_mean_7", "rolling_mean_14"]
        X = df[features]
        y = df["revenue"]

        # Train/Test Split
        split_idx = max(int(len(df) * 0.8), len(df) - 14)
        X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

        model = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=6)
        model.fit(X_train, y_train)

        preds_test = model.predict(X_test)
        mae = float(mean_absolute_error(y_test, preds_test))
        rmse = float(root_mean_squared_error(y_test, preds_test))
        mape = float(mean_absolute_percentage_error(y_test + 1, preds_test + 1)) * 100

        # Save model
        joblib.dump(model, self.model_path)

        # Multi-step autoregressive future forecasting for 90 days
        last_known = df.iloc[-1].copy()
        future_forecasts = []
        cur_date = df["date"].max()

        running_revs = list(df["revenue"].tail(14).values)

        for i in range(1, 91):
            next_date = cur_date + timedelta(days=i)
            feat = {
                "day_of_week": next_date.dayofweek,
                "day_of_month": next_date.day,
                "month": next_date.month,
                "lag_1": running_revs[-1],
                "lag_7": running_revs[-7] if len(running_revs) >= 7 else running_revs[-1],
                "rolling_mean_7": np.mean(running_revs[-7:]),
                "rolling_mean_14": np.mean(running_revs[-14:])
            }
            feat_df = pd.DataFrame([feat])[features]
            pred = max(0.0, float(model.predict(feat_df)[0]))
            running_revs.append(pred)

            std_err = rmse if rmse > 0 else pred * 0.15
            future_forecasts.append({
                "date": next_date.strftime("%Y-%m-%d"),
                "predicted_revenue": round(pred, 2),
                "lower_bound": max(0.0, round(pred - 1.645 * std_err, 2)),
                "upper_bound": round(pred + 1.645 * std_err, 2)
            })

        forecast_7d = sum(f["predicted_revenue"] for f in future_forecasts[:7])
        forecast_30d = sum(f["predicted_revenue"] for f in future_forecasts[:30])
        forecast_90d = sum(f["predicted_revenue"] for f in future_forecasts[:90])

        return {
            "model": "Random Forest Regressor (Autoregressive)",
            "metrics": {
                "mae": round(mae, 2),
                "rmse": round(rmse, 2),
                "mape": round(mape, 2)
            },
            "forecast_7d": round(forecast_7d, 2),
            "forecast_30d": round(forecast_30d, 2),
            "forecast_90d": round(forecast_90d, 2),
            "daily_forecast": future_forecasts[:30] # 30 days for graph
        }
