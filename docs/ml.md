# Machine Learning Engine & Data Science Reference

## 1. RFM Customer Segmentation (K-Means)
- Features: Recency, Frequency, Monetary.
- Scaling: Log-transform + StandardScaler.
- Model: KMeans(n_clusters=5).
- Output: VIP, Loyal, Regular, Potential, At-Risk segments.

## 2. Sales Forecasting Engine
- Features: Day of week, day of month, month, 1-day & 7-day lags, rolling 7 & 14-day averages.
- Horizon: 7, 30, 90-day autoregressive predictions.

## 3. Demand & Safety Stock Optimization
- Formula: Recommended = max(0, Predicted Demand + Safety Stock - Current Stock).
