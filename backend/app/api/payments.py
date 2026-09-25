from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_business_id, RoleChecker, get_current_user
from app.models.user import User, UserRole
from app.models.payment import Payment
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.common import PaginatedResponse
from app.services.audit_service import log_activity

router = APIRouter(prefix="/payments", tags=["Payments & Dues"])

@router.get("/", response_model=PaginatedResponse[PaymentResponse])
def list_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    customer_id: Optional[str] = None,
    supplier_id: Optional[str] = None,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER, UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)
):
    query = db.query(Payment).filter(Payment.business_id == business_id)
    if customer_id:
        query = query.filter(Payment.customer_id == customer_id)
    if supplier_id:
        query = query.filter(Payment.supplier_id == supplier_id)

    total = query.count()
    items = query.order_by(Payment.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    enriched = []
    for p in items:
        resp = PaymentResponse.model_validate(p)
        if p.customer:
            resp.party_name = p.customer.name
        elif p.supplier:
            resp.party_name = p.supplier.name
        else:
            resp.party_name = "Direct Counter Sale"
        enriched.append(resp)

    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=enriched, total=total, page=page, limit=limit, pages=pages)

@router.post("/record", response_model=PaymentResponse)
def record_payment(
    pay_in: PaymentCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER, UserRole.EMPLOYEE])),
    db: Session = Depends(get_db)
):
    payment = Payment(
        business_id=business_id,
        reference_type=pay_in.reference_type,
        reference_id=pay_in.reference_id,
        customer_id=pay_in.customer_id,
        supplier_id=pay_in.supplier_id,
        amount=pay_in.amount,
        payment_method=pay_in.payment_method,
        transaction_reference=pay_in.transaction_reference,
        notes=pay_in.notes,
        created_by_user_id=current_user.id
    )
    db.add(payment)

    if pay_in.customer_id:
        cust = db.query(Customer).filter(Customer.id == pay_in.customer_id, Customer.business_id == business_id).first()
        if cust:
            cust.outstanding_balance = max(0.0, cust.outstanding_balance - pay_in.amount)
            db.add(cust)

    if pay_in.supplier_id:
        supp = db.query(Supplier).filter(Supplier.id == pay_in.supplier_id, Supplier.business_id == business_id).first()
        if supp:
            supp.outstanding_balance = max(0.0, supp.outstanding_balance - pay_in.amount)
            db.add(supp)

    db.commit()
    db.refresh(payment)

    log_activity(
        db=db,
        business_id=business_id,
        action="RECORD_PAYMENT",
        resource_type="Payment",
        resource_id=payment.id,
        user_id=current_user.id,
        details=f"Recorded payment of ₹{payment.amount:,} via {payment.payment_method}"
    )

    resp = PaymentResponse.model_validate(payment)
    if payment.customer:
        resp.party_name = payment.customer.name
    elif payment.supplier:
        resp.party_name = payment.supplier.name
    return resp
