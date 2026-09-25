from typing import List, Optional
from datetime import datetime, timezone, date
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.core.database import get_db
from app.core.config import settings

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    create_password_reset_token,
    decode_password_reset_token,
)

from app.core.dependencies import (
    get_current_user,
    RoleChecker,
)

from app.models.user import User, UserRole
from app.models.business import Business, BusinessUser
from app.models.employee import Employee

from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    RefreshTokenRequest,
    UserResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    UserUpdate,
    UserCreateByAdmin,
    WorkerRegister,
    SocialLoginRequest,
)

from app.schemas.common import MessageResponse

from app.services.email_service import send_password_reset_email


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# HELPERS
# ============================================================

def get_user_business(user: User):
    """
    Return the business associated with the user.

    Owner:
        user.owned_business

    Worker / Employee:
        user.business_membership.business
    """

    if user.owned_business:
        return user.owned_business

    if user.business_membership:
        return user.business_membership.business

    return None


def build_business_response(user: User):
    """
    Return a small business object for authentication responses.
    """

    business = get_user_business(user)

    if not business:
        return None

    return {
        "id": business.id,
        "unique_code": business.unique_code,
        "name": business.name,
        "currency": business.currency,
        "currency_symbol": business.currency_symbol,
    }


def create_auth_response(user: User):
    """
    Create access/refresh tokens and attach current business.
    """

    business = get_user_business(user)

    business_id = business.id if business else None

    access_token = create_access_token(
        user.id,
        role=user.role.value,
        business_id=business_id,
    )

    refresh_token = create_refresh_token(
        user.id,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "business": build_business_response(user),
    }


# ============================================================
# OWNER REGISTRATION
# ============================================================

@router.post(
    "/register",
    response_model=Token,
)
def register(
    user_in: UserRegister,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(User)
        .filter(User.email == user_in.email.lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name.strip(),
        last_name=user_in.last_name.strip(),
        phone=user_in.phone,
        role=UserRole.BUSINESS_OWNER,
        is_active=True,
        is_verified=True,
        auth_provider="local",
        provider_user_id=None,
    )

    db.add(user)
    db.flush()

    # unique_code PostgreSQL server default se generate hoga.
    business = Business(
        owner_id=user.id,
        name=user_in.business_name.strip(),
        business_type=user_in.business_type,
        industry=user_in.industry,
        email=(
            user_in.business_email.lower()
            if user_in.business_email
            else None
        ),
        phone=user_in.business_phone,
        address=user_in.address,
        city=user_in.city,
        state=user_in.state,
        country=user_in.country,
        pincode=user_in.pincode,
        tax_type=user_in.tax_type,
        tax_id_gst=user_in.tax_id_gst,
        pan=user_in.pan,
        business_registration_number=(
            user_in.business_registration_number
        ),
    )

    db.add(business)
    db.flush()

    db.commit()

    db.refresh(user)
    db.refresh(business)

    access_token = create_access_token(
        user.id,
        role=user.role.value,
        business_id=business.id,
    )

    refresh_token = create_refresh_token(
        user.id,
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user,
        "business": {
            "id": business.id,
            "unique_code": business.unique_code,
            "name": business.name,
            "currency": business.currency,
            "currency_symbol": business.currency_symbol,
        },
    }


# ============================================================
# WORKER REGISTRATION
# ============================================================

@router.post(
    "/register-worker",
    response_model=Token,
)
def register_worker(
    worker_in: WorkerRegister,
    db: Session = Depends(get_db),
):
    business_code = (
        worker_in.business_code
        .strip()
        .upper()
    )

    business = (
        db.query(Business)
        .filter(Business.unique_code == business_code)
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail="Invalid business unique code",
        )

    existing_user = (
        db.query(User)
        .filter(User.email == worker_in.email.lower())
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        email=worker_in.email.lower(),
        hashed_password=get_password_hash(worker_in.password),
        first_name=worker_in.first_name.strip(),
        last_name=worker_in.last_name.strip(),
        phone=worker_in.phone,
        role=UserRole.EMPLOYEE,
        is_active=True,
        is_verified=True,
        auth_provider="local",
        provider_user_id=None,
    )

    db.add(user)
    db.flush()

    membership = BusinessUser(
        business_id=business.id,
        user_id=user.id,
    )

    db.add(membership)

    db.commit()

    db.refresh(user)
    db.refresh(business)

    return {
        "access_token": create_access_token(
            user.id,
            role=user.role.value,
            business_id=business.id,
        ),
        "refresh_token": create_refresh_token(user.id),
        "token_type": "bearer",
        "user": user,
        "business": {
            "id": business.id,
            "unique_code": business.unique_code,
            "name": business.name,
            "currency": business.currency,
            "currency_symbol": business.currency_symbol,
        },
    }


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=Token,
)
def login(
    user_in: UserLogin,
    db: Session = Depends(get_db),
):
    email_clean = user_in.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email_clean)
        .first()
    )

    if (
        not user
        or not verify_password(
            user_in.password,
            user.hashed_password,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Account is deactivated",
        )

    return create_auth_response(user)


# ============================================================
# GOOGLE / SOCIAL LOGIN
# ============================================================

@router.post(
    "/social-login",
    response_model=Token,
)
def social_login(
    request: SocialLoginRequest,
    db: Session = Depends(get_db),
):
    provider = request.provider.strip().lower()

    if provider != "google":
        raise HTTPException(
            status_code=400,
            detail="Only Google login is currently supported",
        )

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth is not configured on the server",
        )

    if not request.id_token.strip():
        raise HTTPException(
            status_code=400,
            detail="Google ID token is required",
        )

    # --------------------------------------------------------
    # Verify Google ID token
    # --------------------------------------------------------

    try:
        google_user = id_token.verify_oauth2_token(
            request.id_token.strip(),
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID.strip(),
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Google ID token",
        )

    # --------------------------------------------------------
    # Validate issuer
    # --------------------------------------------------------

    issuer = google_user.get("iss")

    if issuer not in (
        "accounts.google.com",
        "https://accounts.google.com",
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token issuer",
        )

    # --------------------------------------------------------
    # Validate audience
    # --------------------------------------------------------

    if google_user.get("aud") != settings.GOOGLE_CLIENT_ID.strip():
        raise HTTPException(
            status_code=401,
            detail="Invalid Google token audience",
        )

    # --------------------------------------------------------
    # Validate email
    # --------------------------------------------------------

    email = google_user.get("email")

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Google account email not available",
        )

    if not google_user.get("email_verified", False):
        raise HTTPException(
            status_code=400,
            detail="Google email is not verified",
        )

    email = email.lower().strip()

    provider_user_id = google_user.get("sub")

    if not provider_user_id:
        raise HTTPException(
            status_code=400,
            detail="Google account ID not available",
        )

    first_name = (
        google_user.get("given_name")
        or google_user.get("name")
        or "Google"
    )

    last_name = google_user.get("family_name") or ""

    avatar_url = google_user.get("picture")

    # --------------------------------------------------------
    # Find existing user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # --------------------------------------------------------
    # Existing user
    # --------------------------------------------------------

    if user:

        if not user.is_active:
            raise HTTPException(
                status_code=400,
                detail="Account is deactivated",
            )

        # Local account cannot silently be converted
        # into Google account.
        if user.auth_provider == "local":
            raise HTTPException(
                status_code=409,
                detail=(
                    "An account already exists with this email. "
                    "Please login using your password."
                ),
            )

        if user.auth_provider != "google":
            raise HTTPException(
                status_code=409,
                detail=(
                    "This email is already linked to another "
                    "authentication provider."
                ),
            )

        if (
            user.provider_user_id
            and user.provider_user_id != provider_user_id
        ):
            raise HTTPException(
                status_code=401,
                detail="Google account verification failed",
            )

        user.provider_user_id = provider_user_id
        user.first_name = first_name.strip()
        user.last_name = last_name.strip()

        if avatar_url:
            user.avatar_url = avatar_url

        user.is_verified = True

        db.commit()
        db.refresh(user)

        return create_auth_response(user)

    # --------------------------------------------------------
    # First-time Google user
    # --------------------------------------------------------

    random_password = uuid.uuid4().hex

    user = User(
        email=email,
        hashed_password=get_password_hash(random_password),
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        phone=None,
        role=UserRole.BUSINESS_OWNER,
        is_active=True,
        is_verified=True,
        auth_provider="google",
        provider_user_id=provider_user_id,
        avatar_url=avatar_url,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # IMPORTANT:
    # New Google user has NO business yet.
    # Frontend will redirect to /onboarding.
    return create_auth_response(user)


# ============================================================
# REFRESH TOKEN
# ============================================================

@router.post(
    "/refresh",
    response_model=dict,
)
def refresh_token_endpoint(
    req: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    payload = decode_token(
        req.refresh_token,
        is_refresh=True,
    )

    if (
        not payload
        or payload.get("type") != "refresh"
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )

    user_id = payload.get("sub")

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="User not found or inactive",
        )

    business = get_user_business(user)

    business_id = business.id if business else None

    new_access_token = create_access_token(
        user.id,
        role=user.role.value,
        business_id=business_id,
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ============================================================
# UPDATE CURRENT USER
# ============================================================

@router.put(
    "/me",
    response_model=UserResponse,
)
def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user_in.first_name is not None:
        current_user.first_name = user_in.first_name.strip()

    if user_in.last_name is not None:
        current_user.last_name = user_in.last_name.strip()

    if user_in.phone is not None:
        current_user.phone = user_in.phone

    if user_in.avatar_url is not None:
        current_user.avatar_url = user_in.avatar_url

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return current_user


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    req: PasswordResetRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == req.email.lower())
        .first()
    )

    # Do not reveal whether an email exists.
    if not user:
        return MessageResponse(
            success=True,
            message=(
                "If that email is registered, "
                "password reset instructions "
                "have been generated."
            ),
        )

    reset_token = create_password_reset_token(user.id)

    reset_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}"
        f"/reset-password?token={reset_token}"
    )

    try:
        send_password_reset_email(
            recipient_email=user.email,
            reset_url=reset_url,
        )
    except Exception:
        # Do not expose SMTP details to client.
        raise HTTPException(
            status_code=500,
            detail="Unable to send password reset email",
        )

    return MessageResponse(
        success=True,
        message=(
            "If that email is registered, "
            "password reset instructions "
            "have been sent."
        ),
    )


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
def reset_password(
    req: PasswordResetConfirm,
    db: Session = Depends(get_db),
):
    payload = decode_password_reset_token(req.token)

    if not payload:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset token",
        )

    user_id = payload.get("sub")

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters",
        )

    user.hashed_password = get_password_hash(
        req.new_password
    )

    # Password login is now enabled.
    user.auth_provider = "local"

    db.add(user)
    db.commit()

    return MessageResponse(
        success=True,
        message="Password reset successfully",
    )