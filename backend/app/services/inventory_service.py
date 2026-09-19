from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.product import Product
from app.models.inventory import InventoryMovement, MovementType
from app.models.notification import NotificationType
from app.services.notification_service import create_notification
from app.services.audit_service import log_activity

def record_inventory_movement(
    db: Session,
    business_id: str,
    product_id: str,
    movement_type: MovementType,
    quantity_change: int,
    reference_id: Optional[str] = None,
    notes: Optional[str] = None,
    user_id: Optional[str] = None,
    allow_negative: bool = False
) -> InventoryMovement:
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.business_id == business_id
    ).with_for_update().first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    prev_stock = product.current_stock
    new_stock = prev_stock + quantity_change

    if new_stock < 0 and not allow_negative:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient inventory for {product.name}. Available: {prev_stock}, Requested: {-quantity_change}"
        )

    product.current_stock = new_stock
    db.add(product)

    movement = InventoryMovement(
        business_id=business_id,
        product_id=product_id,
        movement_type=movement_type,
        quantity_change=quantity_change,
        previous_stock=prev_stock,
        new_stock=new_stock,
        reference_id=reference_id,
        notes=notes,
        created_by_user_id=user_id
    )
    db.add(movement)
    db.flush()

    # Check for Low Stock / Out of Stock alerts
    if new_stock == 0:
        create_notification(
            db=db,
            business_id=business_id,
            type=NotificationType.OUT_OF_STOCK,
            title="Out of Stock Alert",
            message=f"{product.name} is completely out of stock!",
            link="/inventory",
            user_id=user_id
        )
    elif new_stock <= product.min_stock_alert:
        recommended = max(10, product.min_stock_alert * 2 - new_stock)
        create_notification(
            db=db,
            business_id=business_id,
            type=NotificationType.LOW_STOCK,
            title="Low Stock Alert",
            message=f"{product.name} is running low ({new_stock} units left). Recommended purchase: {recommended} units.",
            link="/inventory",
            user_id=user_id
        )

    log_activity(
        db=db,
        business_id=business_id,
        action=f"INVENTORY_{movement_type.value}",
        resource_type="Product",
        resource_id=product_id,
        user_id=user_id,
        details=f"Stock changed from {prev_stock} to {new_stock} ({quantity_change:+d})"
    )

    return movement
