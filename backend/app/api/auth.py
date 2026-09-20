from typing import List, Optional
from datetime import datetime, timezone, date
from app.models.employee import Employee
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
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
)

from app.schemas.common import MessageResponse


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# ============================================================
# OWNER REGISTRATION
# ============================================================

@router.post("/register", response_model=Token)
def register(
    user_in: UserRegister,
    db: Session = Depends(get_db)
):
    email_clean = user_in.email.lower().strip()

    # --------------------------------------------------------
    # Check existing user
    # --------------------------------------------------------

    existing = (
        db.query(User)
        .filter(User.email == email_clean)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # --------------------------------------------------------
    # Create Owner User
    # --------------------------------------------------------

    user = User(
        email=email_clean,
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name.strip(),
        last_name=user_in.last_name.strip(),
        phone=user_in.phone,
        role=UserRole.BUSINESS_OWNER,
        is_active=True,
        is_verified=True,
    )

    db.add(user)
    db.flush()

    # --------------------------------------------------------
    # Create Business
    # --------------------------------------------------------

    business = Business(
        name=user_in.business_name.strip(),
        business_type=user_in.business_type.strip(),
        industry=user_in.industry.strip(),
        owner_id=user.id,

        email=(
            str(user_in.business_email).lower().strip()
            if user_in.business_email
            else None
        ),

        phone=(
            user_in.business_phone.strip()
            if user_in.business_phone
            else None
        ),

        address=(
            user_in.address.strip()
            if user_in.address
            else None
        ),

        city=user_in.city.strip(),
        state=user_in.state.strip(),
        country=user_in.country.strip(),
        pincode=user_in.pincode.strip(),

        tax_type=user_in.tax_type,

        tax_id_gst=(
            user_in.tax_id_gst.strip().upper()
            if user_in.tax_id_gst
            else None
        ),

        pan=(
            user_in.pan.strip().upper()
            if user_in.pan
            else None
        ),

        business_registration_number=(
            user_in.business_registration_number.strip()
            if user_in.business_registration_number
            else None
        ),

        currency="INR",
        currency_symbol="₹",
        timezone="Asia/Kolkata",
    )

    db.add(business)
    db.flush()

    # --------------------------------------------------------
    # Link Owner with Business
    # -------------------m-------------------------------------

    business_user = BusinessUser(
        business_id=business.id,
        user_id=user.id,
    )

    db.add(business_user)

    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    db.commit()

    db.refresh(user)
    db.refresh(business)

    # --------------------------------------------------------
    # Create Tokens
    # --------------------------------------------------------

    access_token = create_access_token(
        user.id,
        role=user.role.value,
        business_id=business.id,
    )

    refresh_token = create_refresh_token(
        user.id
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

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

@router.post("/register-worker", response_model=Token)
def register_worker(
    worker_in: WorkerRegister,
    db: Session = Depends(get_db)
):
    """
    Register a worker using the Business Unique Code.

    Example:
        VYPR-0001
        VYPR-0002
    """

    business_code = (
        worker_in.business_code
        .strip()
        .upper()
    )

    email_clean = (
        worker_in.email
        .lower()
        .strip()
    )

    # --------------------------------------------------------
    # Find Business using simple unique code
    # --------------------------------------------------------

    business = (
        db.query(Business)
        .filter(
            Business.unique_code == business_code
        )
        .first()
    )

    if not business:
        raise HTTPException(
            status_code=404,
            detail=(
                "Invalid Business Unique Code. "
                "Please check the code shared by the owner."
            )
        )

    # --------------------------------------------------------
    # Check Existing Email
    # --------------------------------------------------------

    existing = (
        db.query(User)
        .filter(
            User.email == email_clean
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # --------------------------------------------------------
    # Create Worker User
    # --------------------------------------------------------

    worker = User(
        email=email_clean,

        hashed_password=get_password_hash(
            worker_in.password
        ),

        first_name=worker_in.first_name.strip(),

        last_name=worker_in.last_name.strip(),

        phone=(
            worker_in.phone.strip()
            if worker_in.phone
            else None
        ),

        role=UserRole.EMPLOYEE,

        is_active=True,

        is_verified=True,
    )

    db.add(worker)
    db.flush()

    # --------------------------------------------------------
    # Link Worker to Business
    # --------------------------------------------------------

    business_user = BusinessUser(
        business_id=business.id,
        user_id=worker.id,
        department="General",
    )

    db.add(business_user)

    # --------------------------------------------------------
    # Automatically Create Employee Roster Record
    # --------------------------------------------------------

    employee = Employee(
        business_id=business.id,
        user_id=worker.id,
        first_name=worker.first_name,
        last_name=worker.last_name,
        email=worker.email,
        phone=worker.phone,
        designation="Staff",
        department="Sales",
        joining_date=date.today(),
        base_salary=25000.0,
        is_active="true",
    )

    db.add(employee)

    # --------------------------------------------------------
    # Save Everything
    # --------------------------------------------------------

    db.commit()

    db.refresh(worker)
    db.refresh(business)
    db.refresh(employee)

    # --------------------------------------------------------
    # Create Tokens
    # --------------------------------------------------------

    access_token = create_access_token(
        worker.id,
        role=worker.role.value,
        business_id=business.id,
    )

    refresh_token = create_refresh_token(
        worker.id
    )

    return {
        "access_token": access_token,

        "refresh_token": refresh_token,

        "token_type": "bearer",

        "user": worker,

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

@router.post("/login", response_model=Token)
def login(
    user_in: UserLogin,
    db: Session = Depends(get_db)
):
    email_clean = user_in.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email_clean)
        .first()
    )

    # --------------------------------------------------------
    # Generic security error message
    # --------------------------------------------------------

    if (
        not user
        or not verify_password(
            user_in.password,
            user.hashed_password
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # --------------------------------------------------------
    # Check active account
    # --------------------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=400,
            detail="Account is deactivated"
        )

    biz_id = None
    biz_dict = None

    # --------------------------------------------------------
    # Owner Business
    # --------------------------------------------------------

    if user.owned_business:

        biz_id = user.owned_business.id

        biz_dict = {
            "id": user.owned_business.id,
            "unique_code": user.owned_business.unique_code,
            "name": user.owned_business.name,
            "currency": user.owned_business.currency,
            "currency_symbol": user.owned_business.currency_symbol,
        }

    # --------------------------------------------------------
    # Worker / Member Business
    # --------------------------------------------------------

    elif user.business_membership:

        b = user.business_membership.business

        if b:

            biz_id = b.id

            biz_dict = {
                "id": b.id,
                "name": b.name,
                "currency": b.currency,
                "currency_symbol": b.currency_symbol,
                "unique_code": b.unique_code,
            }

    # --------------------------------------------------------
    # Tokens
    # --------------------------------------------------------

    access_token = create_access_token(
        user.id,
        role=user.role.value,
        business_id=biz_id
    )

    refresh_token = create_refresh_token(
        user.id
    )

    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "access_token": access_token,

        "refresh_token": refresh_token,

        "token_type": "bearer",

        "user": user,

        "business": biz_dict
    }


# ============================================================
# REFRESH TOKEN
# ============================================================

@router.post("/refresh", response_model=dict)
def refresh_token_endpoint(
    req: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    payload = decode_token(
        req.refresh_token,
        is_refresh=True
    )

    if (
        not payload
        or payload.get("type") != "refresh"
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
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
            detail="User not found or inactive"
        )

    biz_id = None

    # --------------------------------------------------------
    # Owner
    # --------------------------------------------------------

    if user.owned_business:

        biz_id = user.owned_business.id

    # --------------------------------------------------------
    # Worker / Member
    # --------------------------------------------------------

    elif user.business_membership:

        biz_id = (
            user.business_membership.business_id
        )

    # --------------------------------------------------------
    # Create new access token
    # --------------------------------------------------------

    new_access_token = create_access_token(
        user.id,
        role=user.role.value,
        business_id=biz_id
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse
)
def get_me(
    current_user: User = Depends(
        get_current_user
    )
):
    return current_user


# ============================================================
# UPDATE CURRENT USER
# ============================================================

@router.put(
    "/me",
    response_model=UserResponse
)
def update_me(
    user_in: UserUpdate,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(get_db)
):

    if user_in.first_name:

        current_user.first_name = (
            user_in.first_name
        )

    if user_in.last_name:

        current_user.last_name = (
            user_in.last_name
        )

    if user_in.phone:

        current_user.phone = (
            user_in.phone
        )

    if user_in.avatar_url:

        current_user.avatar_url = (
            user_in.avatar_url
        )

    db.add(current_user)

    db.commit()

    db.refresh(current_user)

    return current_user


# ============================================================
# FORGOT PASSWORD
# ============================================================

@router.post(
    "/forgot-password",
    response_model=MessageResponse
)
def forgot_password(
    req: PasswordResetRequest,
    db: Session = Depends(get_db)
):

    user = (
        db.query(User)
        .filter(
            User.email == req.email.lower()
        )
        .first()
    )

    # --------------------------------------------------------
    # Do not reveal whether email exists
    # --------------------------------------------------------

    if not user:

        return MessageResponse(
            success=True,
            message=(
                "If that email is registered, "
                "password reset instructions "
                "have been generated."
            )
        )

    # --------------------------------------------------------
    # Create reset token
    # --------------------------------------------------------

    reset_token = create_access_token(
        user.id,
        role=user.role.value
    )

    return MessageResponse(
        success=True,

        message=(
            "Password reset token "
            "generated successfully"
        ),

        data={
            "reset_token": reset_token
        }
    )


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post(
    "/reset-password",
    response_model=MessageResponse
)
def reset_password(
    req: PasswordResetConfirm,
    db: Session = Depends(get_db)
):

    payload = decode_token(
        req.token
    )

    if not payload:

        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
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
            detail="User not found"
        )

    user.hashed_password = (
        get_password_hash(
            req.new_password
        )
    )

    db.add(user)

    db.commit()

    return MessageResponse(
        success=True,
        message=(
            "Password updated successfully. "
            "Please login."
        )
    )


# ============================================================
# LIST BUSINESS USERS
# ============================================================

@router.get(
    "/users",
    response_model=List[UserResponse]
)
def list_business_users(
    current_user: User = Depends(
        RoleChecker(
            [
                UserRole.BUSINESS_OWNER,
                UserRole.MANAGER
            ]
        )
    ),

    db: Session = Depends(get_db)
):

    biz_id = None

    # --------------------------------------------------------
    # Owner business
    # --------------------------------------------------------

    if current_user.owned_business:

        biz_id = current_user.owned_business.id

    # --------------------------------------------------------
    # Member business
    # --------------------------------------------------------

    elif current_user.business_membership:

        biz_id = (
            current_user
            .business_membership
            .business_id
        )

    # --------------------------------------------------------
    # No business
    # --------------------------------------------------------

    if not biz_id:

        return [current_user]

    # --------------------------------------------------------
    # Get all business members
    # --------------------------------------------------------

    biz_members = (
        db.query(User)
        .join(BusinessUser)
        .filter(
            BusinessUser.business_id == biz_id
        )
        .all()
    )

    # --------------------------------------------------------
    # Make sure owner is included
    # --------------------------------------------------------

    if (
        current_user.owned_business
        and current_user not in biz_members
    ):

        biz_members.insert(
            0,
            current_user
        )

    return biz_members


# ============================================================
# CREATE EMPLOYEE USER BY OWNER
# ============================================================

@router.post(
    "/users",
    response_model=UserResponse
)
def create_employee_user(
    user_in: UserCreateByAdmin,

    current_user: User = Depends(
        RoleChecker(
            [UserRole.BUSINESS_OWNER]
        )
    ),

    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # Check owner business
    # --------------------------------------------------------

    if not current_user.owned_business:

        raise HTTPException(
            status_code=400,
            detail=(
                "No active business registered "
                "for current user"
            )
        )

    # --------------------------------------------------------
    # Check email
    # --------------------------------------------------------

    existing = (
        db.query(User)
        .filter(
            User.email ==
            user_in.email.lower()
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # --------------------------------------------------------
    # Business ID
    # --------------------------------------------------------

    biz_id = (
        current_user
        .owned_business
        .id
    )

    # --------------------------------------------------------
    # Create User
    # --------------------------------------------------------

    new_user = User(
        email=user_in.email.lower(),

        hashed_password=get_password_hash(
            user_in.password
        ),

        first_name=user_in.first_name,

        last_name=user_in.last_name,

        phone=user_in.phone,

        role=user_in.role,

        is_active=True,

        is_verified=True
    )

    db.add(new_user)

    db.flush()

    # --------------------------------------------------------
    # Link User to Business
    # --------------------------------------------------------

    assoc = BusinessUser(
        business_id=biz_id,
        user_id=new_user.id,
        department=user_in.department
    )

    db.add(assoc)

    # --------------------------------------------------------
    # If employee role, create Employee record too
    # --------------------------------------------------------

    if user_in.role == UserRole.EMPLOYEE:

        employee = Employee(
            business_id=biz_id,
            user_id=new_user.id,

            first_name=new_user.first_name,
            last_name=new_user.last_name,

            email=new_user.email,
            phone=new_user.phone,

            designation="Staff",
            department=user_in.department or "Sales",

            joining_date=date.today(),

            base_salary=25000.0,

            is_active="true",
        )

        db.add(employee)

    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    try:

        db.commit()

    except Exception:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Failed to create employee user"
        )

    db.refresh(new_user)

    return new_user