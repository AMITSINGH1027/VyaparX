from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.models.business import Business, BusinessUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_exception
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive or non-existent user")
    return user

def get_current_business_id(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> str:
    # 1. Direct ownership
    if current_user.owned_business:
        return current_user.owned_business.id
    owned = db.query(Business).filter(Business.owner_id == current_user.id).first()
    if owned:
        return owned.id
    # 2. Associated membership
    assoc = db.query(BusinessUser).filter(BusinessUser.user_id == current_user.id).first()
    if assoc:
        return assoc.business_id
    # 3. Super Admin fallback to first business if any
    if current_user.role == UserRole.SUPER_ADMIN:
        biz = db.query(Business).first()
        if biz:
            return biz.id
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No active business profile associated with this account. Please complete onboarding."
    )

def get_current_business(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
) -> Business:
    biz = db.query(Business).filter(Business.id == business_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role == UserRole.SUPER_ADMIN:
            return current_user
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
