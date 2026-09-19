from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr

class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tax_id: Optional[str] = None

class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tax_id: Optional[str] = None

class SupplierResponse(BaseModel):
    id: str
    business_id: str
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    tax_id: Optional[str] = None
    total_purchases_amount: float
    outstanding_balance: float
    created_at: datetime

    class Config:
        from_attributes = True
