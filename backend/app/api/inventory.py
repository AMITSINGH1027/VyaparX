from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_business_id, RoleChecker
from app.models.user import User, UserRole
from app.models.product import Product
from app.models.inventory import InventoryMovement, MovementType
from app.schemas.inventory import InventoryAdjustmentCreate, InventoryMovementResponse, StockAlertItem
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.inventory_service import record_inventory_movement

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/movements", response_model=PaginatedResponse[InventoryMovementResponse])
def list_inventory_movements(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    product_id: Optional[str] = None,
    movement_type: Optional[MovementType] = None,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    query = db.query(InventoryMovement).filter(InventoryMovement.business_id == business_id)
    if product_id:
        query = query.filter(InventoryMovement.product_id == product_id)
    if movement_type:
        query = query.filter(InventoryMovement.movement_type == movement_type)

    total = query.count()
    items = query.order_by(InventoryMovement.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    enriched = []
    for item in items:
        resp = InventoryMovementResponse.model_validate(item)
        resp.product_name = item.product.name if item.product else None
        resp.product_sku = item.product.sku if item.product else None
        resp.created_by_name = item.created_by.full_name if item.created_by else None
        enriched.append(resp)

    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=enriched, total=total, page=page, limit=limit, pages=pages)

@router.post("/adjust", response_model=MessageResponse)
def adjust_inventory(
    adj_in: InventoryAdjustmentCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    record_inventory_movement(
        db=db,
        business_id=business_id,
        product_id=adj_in.product_id,
        movement_type=adj_in.movement_type,
        quantity_change=adj_in.quantity_change,
        notes=adj_in.notes or "Manual inventory adjustment",
        user_id=current_user.id
    )
    db.commit()
    return MessageResponse(success=True, message="Inventory successfully updated")

@router.get("/alerts", response_model=List[StockAlertItem])
def get_inventory_alerts(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.business_id == business_id).all()
    alerts = []
    for p in products:
        if p.current_stock == 0:
            rec = max(20, p.min_stock_alert * 2)
            alerts.append(StockAlertItem(
                product_id=p.id,
                product_name=p.name,
                sku=p.sku,
                category_name=p.category.name if p.category else None,
                current_stock=p.current_stock,
                min_stock_alert=p.min_stock_alert,
                recommended_reorder=rec,
                status="OUT_OF_STOCK"
            ))
        elif p.current_stock <= p.min_stock_alert:
            rec = max(10, p.min_stock_alert * 2 - p.current_stock)
            alerts.append(StockAlertItem(
                product_id=p.id,
                product_name=p.name,
                sku=p.sku,
                category_name=p.category.name if p.category else None,
                current_stock=p.current_stock,
                min_stock_alert=p.min_stock_alert,
                recommended_reorder=rec,
                status="LOW_STOCK"
            ))
    return alerts
