# VyaparX — AI-Powered Business Management & Intelligence Platform

**VyaparX** is a modern, full-stack commercial SaaS business operating system designed for small and medium-sized enterprises (SMEs). It seamlessly integrates transactional operations (Products, Inventory, Sales & POS, Invoicing, Purchases, Expenses, Customers, Suppliers, Team Management) with native Python Data Science and Machine Learning capabilities (RFM Customer Segmentation, Sales Forecasting, Safety-Stock Demand Optimization, Customer Churn Risk Prediction, Product Recommendations, and a Safe Controlled Natural Language Business Assistant).

---

## Key Features

### 1. Core Business Operations
- **Role-Based Access Control (RBAC)**: Multi-tenant permission management (`SUPER_ADMIN`, `BUSINESS_OWNER`, `MANAGER`, `EMPLOYEE`).
- **POS & Sales Management**: Real-time sales checkout with automatic subtotal, discount, GST tax computation, and instant inventory decrement.
- **Tax Invoice Generator**: Professional printable and downloadable PDF invoices with business logo, customer details, line items table, and tax breakdown.
- **Inventory Synchronization & Movements**: Real-time stock sync on sales, purchases, returns, adjustments, with negative stock prevention and low-stock alerts.
- **Procurement & Purchases**: Supplier directory, purchase orders, automatic inventory increment, and balance ledgers.
- **Expense Tracking**: Category-wise operational expense logging and spending visualization.

### 2. Machine Learning & Data Science (Python / Scikit-Learn)
- **Customer Segmentation (K-Means Clustering)**: Automated clustering on Recency, Frequency, and Monetary (RFM) metrics into `VIP`, `Loyal`, `Regular`, `Potential`, and `At-Risk` cohorts.
- **Sales Forecasting Engine**: Time-series autoregressive regression model generating **7-Day**, **30-Day**, and **90-Day** revenue forecasts with confidence bounds and evaluation metrics (MAE, RMSE, MAPE).
- **Demand Prediction & Reorder Optimizer**: Product sales velocity tracking with automated safety stock and recommended purchase quantity formula.
- **Customer Churn Risk Prediction**: Classification model scoring inactivity probability (`LOW`, `MEDIUM`, `HIGH`) with human-readable risk factors.
- **Product Recommendation Engine**: Basket co-occurrence matrix recommending "Frequently Bought Together" items.

### 3. AI Insights & Natural Language Assistant
- **AI Insights Feed**: Proactive operational discovery cards (Sales velocity anomalies, stockout warnings, Pareto 80/20 customer concentration, high-margin category discovery).
- **Conversational Business Assistant**: Controlled natural language query engine routing user questions (*"Which product sold the most?"*, *"Who is my best customer?"*, *"Which products should I restock?"*) into parameter-validated queries with structured data cards and zero raw SQL execution risk.

---

## Technology Stack

- **Backend**: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Bcrypt, PyJWT, Pandas, NumPy, Scikit-learn, Joblib.
- **Database**: PostgreSQL / SQLite (automatic zero-config local fallback), indexes, relationships, cascade rules.
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React icons, Recharts, Axios, React Router 7.
- **DevOps**: Docker, Docker Compose, Nginx.

---

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Seed realistic demo database
python -m database.seed

# Run backend API server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Business Owner** | `owner@vyaparx.com` | `password123` | Full Business Access & Analytics |
| **Manager** | `manager@vyaparx.com` | `password123` | Inventory, Sales, Products & Reports |
| **Employee** | `employee@vyaparx.com` | `password123` | POS Sales & Customer Management |
| **Super Admin** | `admin@vyaparx.com` | `password123` | Platform Level Administration |

---

## Docker Deployment

To launch the complete production stack (PostgreSQL + FastAPI Backend + React Nginx Frontend):

```bash
docker compose up --build
```

- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/api/docs`

---

## Testing

Run backend unit and integration test suite:

```bash
cd backend
pytest tests -v
```

## Production / Cloud Database

VyaparX is intended to use **managed PostgreSQL in production**, not a laptop-local SQLite file. Configure `DATABASE_URL` with the cloud PostgreSQL connection string and run `alembic upgrade head` before starting the API.

The included Docker stack provides PostgreSQL for local development only. The application uses `/api` behind Nginx in the bundled frontend container, so the frontend does not depend on `localhost:8000` in a deployed Docker environment.

## Google OAuth + Onboarding

The authentication flow supports:
- Email/password login and registration (existing flow preserved)
- Google Sign-In using `@react-oauth/google`
- Server-side Google ID-token verification using `GOOGLE_CLIENT_ID`
- Automatic first-time Google account creation
- Automatic redirect to `/onboarding` when a Google user has no business
- Two-step business setup, followed by the normal dashboard flow

### Environment

Backend (`.env` at the project root):
- `GOOGLE_CLIENT_ID=your-google-web-client-id`
- Configure PostgreSQL, JWT, SMTP, and CORS values as required.

Frontend (`frontend/.env`):
- `VITE_API_BASE_URL=http://127.0.0.1:8000/api`
- `VITE_GOOGLE_CLIENT_ID=your-google-web-client-id`

Do not commit real `.env` files or credentials. Use the included `.env.example` files as templates.
