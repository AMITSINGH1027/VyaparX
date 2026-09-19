from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.customer import CustomerSegment, ChurnRiskLevel

class CustomerCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tax_id: Optional[str] = None

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tax_id: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    business_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tax_id: Optional[str] = None
    total_spent: float
    order_count: int
    outstanding_balance: float
    last_purchase_date: Optional[datetime] = None
    rfm_segment: CustomerSegment
    churn_risk: ChurnRiskLevel
    churn_risk_score: float
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerDetailResponse(CustomerResponse):
    average_order_value: float = 0.0
    days_since_last_purchase: Optional[int] = None
    top_purchased_products: List[dict] = []
    recent_sales: List[dict] = []
