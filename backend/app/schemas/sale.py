from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.sale import PaymentMethod, PaymentStatus

class SaleItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)
    unit_price: Optional[float] = Field(ge=0, default=None)
    discount_rate: float = Field(ge=0, le=100, default=0.0) # Percentage

class SaleCreate(BaseModel):
    customer_id: Optional[str] = None
    items: List[SaleItemCreate] = Field(min_length=1)
    payment_method: PaymentMethod = PaymentMethod.CASH
    payment_status: PaymentStatus = PaymentStatus.PAID
    paid_amount: Optional[float] = None
    discount_amount: float = Field(ge=0, default=0.0)
    notes: Optional[str] = None
    sale_date: Optional[datetime] = None

class SaleItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    unit_cost: float
    discount_rate: float
    tax_rate: float
    total_price: float

    class Config:
        from_attributes = True

class SaleResponse(BaseModel):
    id: str
    business_id: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    invoice_number: str
    sale_date: datetime
    subtotal: float
    discount_amount: float
    tax_amount: float
    grand_total: float
    paid_amount: float
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    notes: Optional[str] = None
    items_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class SaleDetailResponse(SaleResponse):
    items: List[SaleItemResponse] = []
    business_details: Optional[dict] = None
    customer_details: Optional[dict] = None
