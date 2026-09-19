from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.inventory import MovementType

class InventoryAdjustmentCreate(BaseModel):
    product_id: str
    quantity_change: int # e.g. +5 or -3
    movement_type: MovementType = MovementType.ADJUSTMENT
    notes: Optional[str] = None

class InventoryMovementResponse(BaseModel):
    id: str
    business_id: str
    product_id: str
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    movement_type: MovementType
    quantity_change: int
    previous_stock: int
    new_stock: int
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StockAlertItem(BaseModel):
    product_id: str
    product_name: str
    sku: str
    category_name: Optional[str] = None
    current_stock: int
    min_stock_alert: int
    recommended_reorder: int
    status: str # "OUT_OF_STOCK", "LOW_STOCK", "OVERSTOCK"
