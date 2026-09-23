from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, SessionLocal
from app.core.logging import logger
from app.core.security import get_password_hash

import app.models
from app.models.user import User, UserRole
from app.services.automation_service import run_inventory_monitor

from app.api import (
    auth,
    business,
    products,
    inventory,
    customers,
    suppliers,
    sales,
    purchases,
    expenses,
    reports,
    analytics,
    ml,
    ai,
    notifications,
    search,
    audit,
    employees,
    payments,
    admin,
)


# ============================================================
# Scheduler
# ============================================================

scheduler = AsyncIOScheduler()


# ============================================================
# Super Admin Bootstrap
# ============================================================

def bootstrap_single_admin():
    db = SessionLocal()

    try:
        admin = (
            db.query(User)
            .filter(User.role == UserRole.SUPER_ADMIN)
            .first()
        )

        if not admin:
            logger.info(
                "No Super Admin found. "
                "Bootstrapping single platform administrator..."
            )

            admin_user = User(
                email=settings.ADMIN_EMAIL.lower().strip(),
                hashed_password=get_password_hash(
                    settings.ADMIN_PASSWORD
                ),
                first_name=settings.ADMIN_FIRST_NAME,
                last_name=settings.ADMIN_LAST_NAME,
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
            )

            db.add(admin_user)
            db.commit()

            logger.info(
                f"Super Admin initialized successfully: "
                f"{settings.ADMIN_EMAIL}"
            )

    except Exception as e:
        db.rollback()
        logger.error(
            f"Error bootstrapping admin: {e}",
            exc_info=True,
        )

    finally:
        db.close()


# ============================================================
# Automatic Inventory Monitor
# ============================================================

def run_automatic_inventory_monitor():
    """
    Creates a fresh database session for the scheduled
    inventory monitoring job.
    """

    db = SessionLocal()

    try:
        created_count = run_inventory_monitor(db)

        if created_count > 0:
            logger.info(
                "Automatic inventory monitor created "
                f"{created_count} new notification(s)."
            )
        else:
            logger.info(
                "Automatic inventory monitor completed. "
                "No new notifications."
            )

    except Exception as exc:
        db.rollback()

        logger.error(
            f"Automatic inventory monitor failed: {exc}",
            exc_info=True,
        )

    finally:
        db.close()


# ============================================================
# FastAPI Lifespan
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings.validate_runtime_config()

    # Bootstrap platform administrator
    if settings.BOOTSTRAP_ADMIN:
        bootstrap_single_admin()

    # --------------------------------------------------------
    # Start automatic inventory monitoring
    # --------------------------------------------------------

    scheduler.add_job(
        run_automatic_inventory_monitor,
        "interval",
        minutes=15,
        id="automatic_inventory_monitor",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()

    logger.info(
        "Automatic inventory monitor started. "
        "Interval: 15 minutes."
    )

    try:
        yield

    finally:
        # ----------------------------------------------------
        # Shutdown scheduler cleanly
        # ----------------------------------------------------

        if scheduler.running:
            scheduler.shutdown(wait=False)

        logger.info(
            "Automatic inventory monitor stopped."
        )


# ============================================================
# FastAPI Application
# ============================================================

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "VyaparX — AI-Powered Business Management "
        "& Intelligence Platform API"
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Global Exception Handler
# ============================================================

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    logger.error(
        f"Unhandled error on {request.url}: {exc}",
        exc_info=True,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An internal server error occurred",
            "error_code": "INTERNAL_ERROR",
        },
    )


# ============================================================
# API Routers
# ============================================================

app.include_router(
    auth.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    business.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    products.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    inventory.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    customers.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    suppliers.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    sales.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    purchases.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    expenses.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    employees.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    payments.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    reports.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    analytics.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    ml.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    ai.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    notifications.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    search.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    audit.router,
    prefix=settings.API_V1_STR,
)

app.include_router(
    admin.router,
    prefix=settings.API_V1_STR,
)


# ============================================================
# Root
# ============================================================

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs",
    }


# ============================================================
# Health Check
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }


# ============================================================
# Readiness Check
# ============================================================

@app.get("/ready")
def readiness_check():
    try:
        with engine.connect() as connection:
            connection.exec_driver_sql("SELECT 1")

        return {
            "status": "ready",
            "database": "ok",
        }

    except Exception as exc:
        logger.error(
            f"Readiness check failed: {exc}",
            exc_info=True,
        )

        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "database": "unavailable",
            },
        )