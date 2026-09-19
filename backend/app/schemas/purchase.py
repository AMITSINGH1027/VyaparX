from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.sale import PaymentStatus

class PurchaseItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)
    unit_cost: float = Field(ge=0)
    tax_rate: float = Field(ge=0, default=0.0)

class PurchaseCreate(BaseModel):
    supplier_id: Optional[str] = None
    items: List[PurchaseItemCreate] = Field(min_length=1)
    discount_amount: float = Field(ge=0, default=0.0)
    paid_amount: Optional[float] = None
    payment_status: PaymentStatus = PaymentStatus.PAID
    notes: Optional[str] = None
    purchase_date: Optional[datetime] = None

class PurchaseItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity: int
    unit_cost: float
    tax_rate: float
    total_cost: float

    class Config:
        from_attributes = True

class PurchaseResponse(BaseModel):
    id: str
    business_id: str
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    purchase_number: str
    purchase_date: datetime
    subtotal: float
    tax_amount: float
    discount_amount: float
    grand_total: float
    paid_amount: float
    payment_status: PaymentStatus
    notes: Optional[str] = None
    items: List[PurchaseItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
