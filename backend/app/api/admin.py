from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import RoleChecker
from app.models.user import User, UserRole
from app.models.business import Business
from app.models.sale import Sale
from app.models.product import Product
from app.models.customer import Customer
from app.schemas.auth import UserResponse
from app.schemas.business import BusinessResponse

router = APIRouter(prefix="/admin", tags=["Super Admin Platform Management"])

@router.get("/businesses", response_model=List[BusinessResponse])
def get_all_platform_businesses(
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    return db.query(Business).all()

@router.get("/users", response_model=List[UserResponse])
def get_all_platform_users(
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    return db.query(User).all()

@router.get("/platform-stats")
def get_platform_stats(
    current_user: User = Depends(RoleChecker([UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    total_businesses = db.query(Business).count()
    total_users = db.query(User).count()
    total_products = db.query(Product).count()
    total_sales = db.query(Sale).count()
    total_customers = db.query(Customer).count()

    return {
        "total_businesses": total_businesses,
        "total_users": total_users,
        "total_products": total_products,
        "total_sales": total_sales,
        "total_customers": total_customers,
        "system_status": "All Systems Fully Operational"
    }
