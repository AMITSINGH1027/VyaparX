# Architecture & Technical Design

## System Architecture

```text
[ React 19 + Vite Frontend ] 
        │ (JWT / REST API)
        ▼
[ FastAPI Application Layer ] ──> [ Auth & RBAC Security ]
        │
        ├── [ Transactional Services ] ──> [ SQLAlchemy 2.0 ORM ] ──> [ PostgreSQL / SQLite DB ]
        │
        ├── [ Pandas Analytics Engine ] ──> [ Financial & Inventory Valuation Engine ]
        │
        ├── [ Scikit-Learn ML Pipelines ] ──> [ Joblib Model Registry ]
        │
        └── [ Controlled AI Query Intent Layer ] ──> [ Natural Language Assistant ]
```

## Layered Design
1. **API Layer (`app/api/`)**: Validates Pydantic payloads, injects dependencies, handles HTTP status codes.
2. **Service Layer (`app/services/`)**: Enforces atomic transactions, stock movement triggers, audit logs, and in-app notifications.
3. **Analytics Layer (`app/analytics/`)**: Vectorized Pandas calculations for P&L statements, Gross/Net margins, and category velocity.
4. **ML Layer (`app/ml/`)**: Handles RFM clustering, time-series autoregressive regressors, safety-stock calculations, and churn classifiers.
5. **AI Assistant (`app/ai/`)**: Controlled query routing preventing arbitrary SQL injection.
