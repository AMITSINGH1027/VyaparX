from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_business_id, RoleChecker
from app.models.user import User, UserRole
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.schemas.common import PaginatedResponse, MessageResponse

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/", response_model=PaginatedResponse[SupplierResponse])
def list_suppliers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    query = db.query(Supplier).filter(Supplier.business_id == business_id)
    if search:
        s = f"%{search}%"
        query = query.filter((Supplier.name.ilike(s)) | (Supplier.contact_person.ilike(s)) | (Supplier.email.ilike(s)))

    total = query.count()
    items = query.order_by(Supplier.name.asc()).offset((page - 1) * limit).limit(limit).all()
    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=items, total=total, page=page, limit=limit, pages=pages)

@router.post("/", response_model=SupplierResponse)
def create_supplier(
    supp_in: SupplierCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    supplier = Supplier(
        business_id=business_id,
        name=supp_in.name,
        contact_person=supp_in.contact_person,
        email=supp_in.email,
        phone=supp_in.phone,
        address=supp_in.address,
        city=supp_in.city,
        tax_id=supp_in.tax_id
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.get("/{id}", response_model=SupplierResponse)
def get_supplier(
    id: str,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(Supplier.id == id, Supplier.business_id == business_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/{id}", response_model=SupplierResponse)
def update_supplier(
    id: str,
    supp_in: SupplierUpdate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(Supplier.id == id, Supplier.business_id == business_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for field, val in supp_in.model_dump(exclude_unset=True).items():
        setattr(supplier, field, val)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{id}", response_model=MessageResponse)
def delete_supplier(
    id: str,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(Supplier.id == id, Supplier.business_id == business_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    return MessageResponse(success=True, message="Supplier deleted")
