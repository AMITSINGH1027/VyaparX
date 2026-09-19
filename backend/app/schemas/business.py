from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr

class BusinessCreate(BaseModel):
    name: str
    business_type: Optional[str] = "Retail"
    industry: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    tax_id_gst: Optional[str] = None
    pan: Optional[str] = None
    business_registration_number: Optional[str] = None
    tax_type: Optional[str] = "Not Applicable"
    pincode: Optional[str] = None
    logo_url: Optional[str] = None
    currency: Optional[str] = "INR"
    currency_symbol: Optional[str] = "₹"
    timezone: Optional[str] = "Asia/Kolkata"

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    business_type: Optional[str] = None
    industry: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    tax_id_gst: Optional[str] = None
    pan: Optional[str] = None
    business_registration_number: Optional[str] = None
    tax_type: Optional[str] = None
    pincode: Optional[str] = None
    logo_url: Optional[str] = None
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None
    timezone: Optional[str] = None
    allow_negative_stock: Optional[str] = None

class BusinessResponse(BaseModel):
    id: str
    name: str
    business_type: Optional[str] = None
    industry: Optional[str] = None
    owner_id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    tax_id_gst: Optional[str] = None
    pan: Optional[str] = None
    business_registration_number: Optional[str] = None
    tax_type: Optional[str] = None
    pincode: Optional[str] = None
    logo_url: Optional[str] = None
    currency: str
    currency_symbol: str
    timezone: str
    allow_negative_stock: str
    created_at: datetime

    class Config:
        from_attributes = True
