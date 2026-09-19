from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.core.logging import logger
from app.core.security import get_password_hash

import app.models
from app.models.user import User, UserRole

from app.api import (
    auth, business, products, inventory, customers,
    suppliers, sales, purchases, expenses, reports,
    analytics, ml, ai, notifications, search, audit,
    employees, payments, admin
)

def bootstrap_single_admin():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.SUPER_ADMIN).first()
        if not admin:
            logger.info("No Super Admin found. Bootstrapping single platform administrator...")
            admin_user = User(
                email=settings.ADMIN_EMAIL.lower().strip(),
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                first_name=settings.ADMIN_FIRST_NAME,
                last_name=settings.ADMIN_LAST_NAME,
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            logger.info(f"Super Admin initialized successfully: {settings.ADMIN_EMAIL}")
    except Exception as e:
        logger.error(f"Error bootstrapping admin: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_runtime_config()
    if settings.BOOTSTRAP_ADMIN:
        bootstrap_single_admin()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="VyaparX — AI-Powered Business Management & Intelligence Platform API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "message": "An internal server error occurred", "error_code": "INTERNAL_ERROR"}
    )

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(business.router, prefix=settings.API_V1_STR)
app.include_router(products.router, prefix=settings.API_V1_STR)
app.include_router(inventory.router, prefix=settings.API_V1_STR)
app.include_router(customers.router, prefix=settings.API_V1_STR)
app.include_router(suppliers.router, prefix=settings.API_V1_STR)
app.include_router(sales.router, prefix=settings.API_V1_STR)
app.include_router(purchases.router, prefix=settings.API_V1_STR)
app.include_router(expenses.router, prefix=settings.API_V1_STR)
app.include_router(employees.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(ml.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(search.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}

@app.get("/ready")
def readiness_check():
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")
        return {"status": "ready", "database": "ok"}
    except Exception as exc:
        logger.error(f"Readiness check failed: {exc}")
        return JSONResponse(status_code=503, content={"status": "not_ready", "database": "unavailable"})
