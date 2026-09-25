from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_business_id, RoleChecker
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.sale import Sale
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerDetailResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.ml.recommender import ProductRecommenderEngine

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("/", response_model=PaginatedResponse[CustomerResponse])
def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    query = db.query(Customer).filter(Customer.business_id == business_id)
    if search:
        s = f"%{search}%"
        query = query.filter((Customer.name.ilike(s)) | (Customer.email.ilike(s)) | (Customer.phone.ilike(s)))

    total = query.count()
    items = query.order_by(Customer.total_spent.desc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("/", response_model=CustomerResponse)
def create_customer(
    cust_in: CustomerCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cust = Customer(
        business_id=business_id,
        name=cust_in.name,
        email=cust_in.email,
        phone=cust_in.phone,
        address=cust_in.address,
        city=cust_in.city,
        tax_id=cust_in.tax_id
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust

@router.get("/{id}", response_model=CustomerDetailResponse)
def get_customer(
    id: str,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    cust = db.query(Customer).filter(Customer.id == id, Customer.business_id == business_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    aov = (cust.total_spent / cust.order_count) if cust.order_count > 0 else 0.0
    now = datetime.now(timezone.utc)
    days_inactive = (now - cust.last_purchase_date.replace(tzinfo=timezone.utc)).days if cust.last_purchase_date else None

    # Past sales
    sales = db.query(Sale).filter(Sale.customer_id == cust.id).order_by(Sale.sale_date.desc()).limit(5).all()
    recent_sales = [
        {
            "invoice_number": s.invoice_number,
            "sale_date": s.sale_date.strftime("%Y-%m-%d"),
            "grand_total": s.grand_total,
            "payment_status": s.payment_status.value
        }
        for s in sales
    ]

    resp = CustomerDetailResponse(
        id=cust.id,
        business_id=cust.business_id,
        name=cust.name,
        email=cust.email,
        phone=cust.phone,
        address=cust.address,
        city=cust.city,
        tax_id=cust.tax_id,
        total_spent=cust.total_spent,
        order_count=cust.order_count,
        outstanding_balance=cust.outstanding_balance,
        last_purchase_date=cust.last_purchase_date,
        rfm_segment=cust.rfm_segment,
        churn_risk=cust.churn_risk,
        churn_risk_score=cust.churn_risk_score,
        created_at=cust.created_at,
        average_order_value=round(aov, 2),
        days_since_last_purchase=days_inactive,
        recent_sales=recent_sales
    )
    return resp

@router.put("/{id}", response_model=CustomerResponse)
def update_customer(
    id: str,
    cust_in: CustomerUpdate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cust = db.query(Customer).filter(Customer.id == id, Customer.business_id == business_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, val in cust_in.model_dump(exclude_unset=True).items():
        setattr(cust, field, val)
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust

@router.delete("/{id}", response_model=MessageResponse)
def delete_customer(
    id: str,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    cust = db.query(Customer).filter(Customer.id == id, Customer.business_id == business_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(cust)
    db.commit()
    return MessageResponse(success=True, message="Customer deleted")

@router.get("/{id}/recommendations")
def get_customer_product_recommendations(
    id: str,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    rec_engine = ProductRecommenderEngine(business_id)
    return rec_engine.get_customer_recommendations(db, id, limit=4)
