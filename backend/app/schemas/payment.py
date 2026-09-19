from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class PaymentCreate(BaseModel):
    reference_type: str
    reference_id: Optional[str] = None
    customer_id: Optional[str] = None
    supplier_id: Optional[str] = None
    amount: float
    payment_method: str = "UPI"
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    business_id: str
    reference_type: str
    reference_id: Optional[str] = None
    customer_id: Optional[str] = None
    supplier_id: Optional[str] = None
    amount: float
    payment_method: str
    payment_date: datetime
    transaction_reference: Optional[str] = None
    notes: Optional[str] = None
    party_name: Optional[str] = None
