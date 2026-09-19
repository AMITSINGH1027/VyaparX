from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_business, RoleChecker
from app.models.user import User, UserRole
from app.models.business import Business, BusinessUser
from app.schemas.business import BusinessCreate, BusinessUpdate, BusinessResponse

router = APIRouter(prefix="/business", tags=["Business"])

@router.post("/", response_model=BusinessResponse)
def create_business(
    biz_in: BusinessCreate,
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    existing = db.query(Business).filter(Business.owner_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already owns a business")

    business = Business(
        name=biz_in.name,
        business_type=biz_in.business_type,
        industry=biz_in.industry,
        owner_id=current_user.id,
        email=biz_in.email,
        phone=biz_in.phone,
        address=biz_in.address,
        city=biz_in.city,
        state=biz_in.state,
        country=biz_in.country or "India",
        tax_id_gst=biz_in.tax_id_gst,
        pan=biz_in.pan,
        business_registration_number=biz_in.business_registration_number,
        tax_type=biz_in.tax_type,
        pincode=biz_in.pincode,
        logo_url=biz_in.logo_url,
        currency=biz_in.currency or "INR",
        currency_symbol=biz_in.currency_symbol or "₹",
        timezone=biz_in.timezone or "Asia/Kolkata"
    )
    db.add(business)
    db.flush()

    assoc = BusinessUser(
        business_id=business.id,
        user_id=current_user.id,
        department="Executive"
    )
    db.add(assoc)
    db.commit()
    db.refresh(business)
    return business

@router.get("/current", response_model=BusinessResponse)
def get_current_business_profile(
    business: Business = Depends(get_current_business)
):
    return business

@router.put("/current", response_model=BusinessResponse)
def update_current_business(
    biz_in: BusinessUpdate,
    business: Business = Depends(get_current_business),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN])),
    db: Session = Depends(get_db)
):
    for field, val in biz_in.model_dump(exclude_unset=True).items():
        setattr(business, field, val)
    db.add(business)
    db.commit()
    db.refresh(business)
    return business
