from typing import Optional, List

from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


# ============================================================
# USER REGISTRATION
# ============================================================

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


# ============================================================
# LOGIN
# ============================================================

class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ============================================================
# TOKEN RESPONSE
# ============================================================

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

    user: "UserResponse"

    business: Optional[dict] = None


# ============================================================
# REFRESH TOKEN
# ============================================================

class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ============================================================
# PASSWORD RESET
# ============================================================

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


# ============================================================
# UPDATE USER
# ============================================================

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


# ============================================================
# ADMIN CREATE USER
# ============================================================

class UserCreateByAdmin(BaseModel):
    email: EmailStr
    password: str

    first_name: str
    last_name: str

    phone: Optional[str] = None

    role: UserRole

    department: Optional[str] = None


# ============================================================
# USER RESPONSE
# ============================================================

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

    # OAuth information
    auth_provider: str = "local"


    class Config:
        from_attributes = True


# ============================================================
# WORKER REGISTRATION
# ============================================================

class WorkerRegister(BaseModel):
    business_code: str

    first_name: str
    last_name: str

    email: EmailStr

    phone: Optional[str] = None

    password: str


# ============================================================
# SOCIAL LOGIN
# ============================================================

class SocialLoginRequest(BaseModel):
    """
    Request sent by frontend after receiving
    a verified Google/Microsoft identity token.
    """

    provider: str
    id_token: str


# ============================================================
# SOCIAL USER INFORMATION
# ============================================================

class SocialUserInfo(BaseModel):
    provider: str
    provider_user_id: str

    email: EmailStr

    first_name: str
    last_name: str

    avatar_url: Optional[str] = None


# ============================================================
# REBUILD FORWARD REFERENCES
# ============================================================

Token.model_rebuild()