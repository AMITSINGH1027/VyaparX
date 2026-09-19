from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    # Business profile collected during registration
    business_name: str
    business_type: str
    industry: str
    business_email: Optional[EmailStr] = None
    business_phone: Optional[str] = None
    address: Optional[str] = None
    city: str
    state: str
    country: str = "India"
    pincode: str
    tax_type: Optional[str] = "Not Applicable"
    tax_id_gst: Optional[str] = None
    pan: Optional[str] = None
    business_registration_number: Optional[str] = None
    role: Optional[UserRole] = UserRole.BUSINESS_OWNER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"
    business: Optional[dict] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreateByAdmin(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    role: UserRole
    department: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

Token.model_rebuild()

class WorkerRegister(BaseModel):
    business_code: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str