from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_business_id, RoleChecker
from app.models.user import User, UserRole
from app.models.purchase import Purchase
from app.schemas.purchase import PurchaseCreate, PurchaseResponse, PurchaseItemResponse
from app.schemas.common import PaginatedResponse
from app.services.purchase_service import create_purchase_transaction

router = APIRouter(prefix="/purchases", tags=["Purchases"])

@router.get("/", response_model=PaginatedResponse[PurchaseResponse])
def list_purchases(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    supplier_id: Optional[str] = None,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    query = db.query(Purchase).filter(Purchase.business_id == business_id)
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)

    total = query.count()
    items = query.order_by(Purchase.purchase_date.desc()).offset((page - 1) * limit).limit(limit).all()

    enriched = []
    for p in items:
        resp = PurchaseResponse.model_validate(p)
        resp.supplier_name = p.supplier.name if p.supplier else "Direct Purchase"
        resp.items = [PurchaseItemResponse.model_validate(it) for it in p.items]
        enriched.append(resp)

    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=enriched, total=total, page=page, limit=limit, pages=pages)

@router.post("/", response_model=PurchaseResponse)
def create_purchase(
    purchase_in: PurchaseCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    purchase = create_purchase_transaction(
        db=db,
        business_id=business_id,
        purchase_in=purchase_in,
        user_id=current_user.id
    )
    resp = PurchaseResponse.model_validate(purchase)
    resp.supplier_name = purchase.supplier.name if purchase.supplier else "Direct Purchase"
    resp.items = [PurchaseItemResponse.model_validate(it) for it in purchase.items]
    return resp
