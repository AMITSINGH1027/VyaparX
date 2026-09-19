from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_business_id
from app.models.user import User
from app.models.sale import Sale, SaleItem, PaymentStatus
from app.schemas.sale import SaleCreate, SaleResponse, SaleDetailResponse, SaleItemResponse
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.sale_service import create_sale_transaction

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("/", response_model=PaginatedResponse[SaleResponse])
def list_sales(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    customer_id: Optional[str] = None,
    payment_status: Optional[PaymentStatus] = None,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    query = db.query(Sale).filter(Sale.business_id == business_id)
    if customer_id:
        query = query.filter(Sale.customer_id == customer_id)
    if payment_status:
        query = query.filter(Sale.payment_status == payment_status)

    total = query.count()
    items = query.order_by(Sale.sale_date.desc()).offset((page - 1) * limit).limit(limit).all()

    enriched = []
    for s in items:
        resp = SaleResponse.model_validate(s)
        resp.customer_name = s.customer.name if s.customer else "Walk-in Customer"
        resp.items_count = len(s.items)
        enriched.append(resp)

    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=enriched, total=total, page=page, limit=limit, pages=pages)

@router.post("/", response_model=SaleDetailResponse)
def create_sale(
    sale_in: SaleCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sale = create_sale_transaction(
        db=db,
        business_id=business_id,
        sale_in=sale_in,
        user_id=current_user.id
    )
    
    resp = SaleDetailResponse.model_validate(sale)
    resp.customer_name = sale.customer.name if sale.customer else "Walk-in Customer"
    resp.items = [SaleItemResponse.model_validate(item) for item in sale.items]
    return resp

@router.get("/{id}", response_model=SaleDetailResponse)
def get_sale(
    id: str,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(Sale.id == id, Sale.business_id == business_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale record not found")

    biz = sale.business
    resp = SaleDetailResponse.model_validate(sale)
    resp.customer_name = sale.customer.name if sale.customer else "Walk-in Customer"
    resp.items = [SaleItemResponse.model_validate(item) for item in sale.items]
    resp.business_details = {
        "name": biz.name,
        "email": biz.email,
        "phone": biz.phone,
        "address": biz.address,
        "tax_id_gst": biz.tax_id_gst,
        "currency_symbol": biz.currency_symbol,
        "logo_url": biz.logo_url
    }
    if sale.customer:
        resp.customer_details = {
            "name": sale.customer.name,
            "email": sale.customer.email,
            "phone": sale.customer.phone,
            "address": sale.customer.address,
            "tax_id": sale.customer.tax_id
        }
    return resp
