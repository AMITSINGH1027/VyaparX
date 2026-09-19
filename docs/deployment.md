# VyaparX Production Deployment

## Recommended architecture

Use a managed PostgreSQL database plus a hosted FastAPI backend and React frontend. The database must not live on the user's laptop. Every business, user, product, sale, purchase, expense and audit record is stored in the managed PostgreSQL instance.

For a straightforward deployment, Render is a practical option because it provides managed Postgres and private internal connections between services in the same region. Use the database's internal connection URL from the hosted backend.

## 1. Create PostgreSQL

Create a PostgreSQL database and record its connection URL. Do not commit the URL, password, JWT secrets or admin password to Git.

For Render, create **New > Postgres**, choose a region, and use the internal URL from the backend service when both resources are in the same region. Render documents the internal URL as the preferred path for Render-hosted services.

## 2. Backend environment variables

Set these in the hosting provider's secret/environment-variable UI:

```text
ENVIRONMENT=production
DATABASE_URL=<managed PostgreSQL connection URL>
JWT_SECRET=<long random secret>
JWT_REFRESH_SECRET=<different long random secret>
ACCESS_TOKEN_EXPIRE_MINUTES=1440
REFRESH_TOKEN_EXPIRE_DAYS=30
BOOTSTRAP_ADMIN=true
ADMIN_EMAIL=<your platform admin email>
ADMIN_PASSWORD=<strong random password>
ADMIN_FIRST_NAME=Platform
ADMIN_LAST_NAME=Administrator
CORS_ORIGINS=https://<your-frontend-domain>
ML_MODELS_DIR=/app/ml_models
```

The application now rejects production startup when PostgreSQL is not configured, JWT secrets are too short, wildcard CORS is used, or the admin bootstrap password is missing while bootstrap is enabled.

## 3. Database migrations

Do not rely on SQLAlchemy `create_all()` in production. Schema changes are managed with Alembic.

```bash
cd backend
alembic upgrade head
```

The first migration creates the complete application schema. Future model changes should be introduced as new Alembic revisions.

## 4. Create the platform admin

The container bootstrap command runs the migration and then creates the single `SUPER_ADMIN` only when `BOOTSTRAP_ADMIN=true`.

After verifying the admin account works, set `BOOTSTRAP_ADMIN=false` and redeploy. Existing admin records are preserved.

## 5. Frontend

For the Docker stack, the React application uses `/api` and Nginx reverse-proxies it to FastAPI, so the browser does not need a localhost API URL.

For a separately hosted frontend, set:

```text
VITE_API_BASE_URL=https://<your-backend-domain>/api
```

## 6. Local Docker verification

Create a local `.env` from `.env.example` with test secrets, then run:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8000/health`
- Backend readiness: `http://localhost:8000/ready`
- API docs: `http://localhost:8000/api/docs`

## 7. Data migration from the current SQLite database

The repository contains the existing local SQLite database only as development data. Production should start with a fresh managed PostgreSQL database unless the existing data must be preserved.

If existing data must be preserved, perform a deliberate SQLite-to-PostgreSQL migration and verify row counts, foreign-key relationships, enum values, dates, money totals, inventory quantities and audit history before switching the live application over.

## 8. Backups

Enable managed PostgreSQL backups and point-in-time recovery according to the database provider and plan. Render documents daily snapshots and point-in-time recovery on paid Postgres plans.

## 9. Production checklist

- Managed PostgreSQL configured
- Unique production JWT secrets
- Strong admin credentials
- Exact frontend origin in CORS
- Alembic migrations applied
- `BOOTSTRAP_ADMIN` disabled after first admin creation
- HTTPS enabled for frontend/backend domains
- Database backups enabled
- ML model files deployed separately or mounted as persistent assets
- Logs and health/readiness checks monitored
- Demo credentials removed from public documentation
