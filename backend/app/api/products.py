import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_business_id, RoleChecker
from app.models.user import User, UserRole
from app.models.product import Product, Category, ProductStatus
from app.models.inventory import MovementType
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, 
    CategoryCreate, CategoryResponse, BulkImportResult
)
from app.schemas.common import PaginatedResponse, MessageResponse
from app.services.inventory_service import record_inventory_movement
from app.services.audit_service import log_activity

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    return db.query(Category).filter(Category.business_id == business_id).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(
    cat_in: CategoryCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    category = Category(
        business_id=business_id,
        name=cat_in.name,
        description=cat_in.description
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@router.delete("/categories/{id}", response_model=MessageResponse)
def delete_category(
    id: str,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == id, Category.business_id == business_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return MessageResponse(success=True, message="Category deleted")

@router.get("/", response_model=PaginatedResponse[ProductResponse])
def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[ProductStatus] = None,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(Product.business_id == business_id)
    if search:
        s = f"%{search}%"
        query = query.filter((Product.name.ilike(s)) | (Product.sku.ilike(s)) | (Product.brand.ilike(s)))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if status:
        query = query.filter(Product.status == status)

    total = query.count()
    items = query.order_by(Product.name.asc()).offset((page - 1) * limit).limit(limit).all()

    enriched = []
    for item in items:
        resp = ProductResponse.model_validate(item)
        resp.category_name = item.category.name if item.category else None
        resp.supplier_name = item.supplier.name if item.supplier else None
        enriched.append(resp)

    pages = (total + limit - 1) // limit
    return PaginatedResponse(items=enriched, total=total, page=page, limit=limit, pages=pages)

@router.post("/", response_model=ProductResponse)
def create_product(
    prod_in: ProductCreate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    existing = db.query(Product).filter(Product.business_id == business_id, Product.sku == prod_in.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with SKU '{prod_in.sku}' already exists")

    product = Product(
        business_id=business_id,
        category_id=prod_in.category_id,
        supplier_id=prod_in.supplier_id,
        name=prod_in.name,
        sku=prod_in.sku,
        brand=prod_in.brand,
        description=prod_in.description,
        cost_price=prod_in.cost_price,
        selling_price=prod_in.selling_price,
        tax_rate=prod_in.tax_rate,
        current_stock=0,
        min_stock_alert=prod_in.min_stock_alert,
        max_stock_capacity=prod_in.max_stock_capacity,
        unit=prod_in.unit,
        image_url=prod_in.image_url,
        status=prod_in.status or ProductStatus.ACTIVE
    )
    db.add(product)
    db.flush()

    if prod_in.current_stock > 0:
        record_inventory_movement(
            db=db,
            business_id=business_id,
            product_id=product.id,
            movement_type=MovementType.ADJUSTMENT,
            quantity_change=prod_in.current_stock,
            notes="Initial stock upon product creation",
            user_id=current_user.id,
            allow_negative=True
        )

    log_activity(
        db=db,
        business_id=business_id,
        action="CREATE_PRODUCT",
        resource_type="Product",
        resource_id=product.id,
        user_id=current_user.id,
        details=f"Created product {product.name} (SKU: {product.sku})"
    )

    db.commit()
    db.refresh(product)
    resp = ProductResponse.model_validate(product)
    resp.category_name = product.category.name if product.category else None
    return resp

@router.get("/{id}", response_model=ProductResponse)
def get_product(
    id: str,
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id, Product.business_id == business_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    resp = ProductResponse.model_validate(product)
    resp.category_name = product.category.name if product.category else None
    resp.supplier_name = product.supplier.name if product.supplier else None
    return resp

@router.put("/{id}", response_model=ProductResponse)
def update_product(
    id: str,
    prod_in: ProductUpdate,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id, Product.business_id == business_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, val in prod_in.model_dump(exclude_unset=True).items():
        if field == "current_stock":
            continue
        setattr(product, field, val)

    log_activity(
        db=db,
        business_id=business_id,
        action="UPDATE_PRODUCT",
        resource_type="Product",
        resource_id=product.id,
        user_id=current_user.id,
        details=f"Updated product {product.name}"
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    resp = ProductResponse.model_validate(product)
    resp.category_name = product.category.name if product.category else None
    return resp

@router.delete("/{id}", response_model=MessageResponse)
def delete_product(
    id: str,
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == id, Product.business_id == business_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    log_activity(
        db=db,
        business_id=business_id,
        action="DELETE_PRODUCT",
        resource_type="Product",
        resource_id=product.id,
        user_id=current_user.id,
        details=f"Deleted product {product.name}"
    )

    db.delete(product)
    db.commit()
    return MessageResponse(success=True, message=f"Product '{product.name}' deleted successfully")

@router.get("/export/csv")
def export_products_csv(
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(Product.business_id == business_id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "SKU", "Category", "Brand", "Cost Price", "Selling Price", "Tax Rate", "Current Stock", "Min Stock Alert", "Unit", "Status"])

    for p in products:
        cat = p.category.name if p.category else ""
        writer.writerow([p.name, p.sku, cat, p.brand or "", p.cost_price, p.selling_price, p.tax_rate, p.current_stock, p.min_stock_alert, p.unit, p.status.value])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vyaparx_products.csv"}
    )

@router.post("/import/csv", response_model=BulkImportResult)
async def import_products_csv(
    file: UploadFile = File(...),
    business_id: str = Depends(get_current_business_id),
    current_user: User = Depends(RoleChecker([UserRole.BUSINESS_OWNER, UserRole.MANAGER])),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    decoded = contents.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(decoded))

    imported = 0
    errors = []
    row_num = 1

    # Cache categories for quick lookup
    existing_cats = {c.name.lower(): c.id for c in db.query(Category).filter(Category.business_id == business_id).all()}

    for row in reader:
        row_num += 1
        name = row.get("Name", "").strip()
        sku = row.get("SKU", "").strip()
        if not name or not sku:
            errors.append(f"Row {row_num}: Missing required Name or SKU")
            continue

        existing = db.query(Product).filter(Product.business_id == business_id, Product.sku == sku).first()
        if existing:
            errors.append(f"Row {row_num}: SKU '{sku}' already exists")
            continue

        # Category resolution
        cat_name = row.get("Category", "").strip()
        cat_id = None
        if cat_name:
            if cat_name.lower() in existing_cats:
                cat_id = existing_cats[cat_name.lower()]
            else:
                new_c = Category(business_id=business_id, name=cat_name)
                db.add(new_c)
                db.flush()
                existing_cats[cat_name.lower()] = new_c.id
                cat_id = new_c.id

        try:
            cost = float(row.get("Cost Price", 0) or 0)
            sell = float(row.get("Selling Price", 0) or 0)
            tax = float(row.get("Tax Rate", 18.0) or 18.0)
            stock = int(float(row.get("Current Stock", 0) or 0))
            min_stock = int(float(row.get("Min Stock Alert", 10) or 10))
            unit = row.get("Unit", "units").strip() or "units"
            brand = row.get("Brand", "").strip()

            prod = Product(
                business_id=business_id,
                category_id=cat_id,
                name=name,
                sku=sku,
                brand=brand,
                cost_price=cost,
                selling_price=sell if sell > 0 else cost * 1.3,
                tax_rate=tax,
                current_stock=stock,
                min_stock_alert=min_stock,
                unit=unit,
                status=ProductStatus.ACTIVE
            )
            db.add(prod)
            db.flush()

            if stock > 0:
                record_inventory_movement(
                    db=db,
                    business_id=business_id,
                    product_id=prod.id,
                    movement_type=MovementType.ADJUSTMENT,
                    quantity_change=stock,
                    notes="Opening stock from CSV import",
                    user_id=current_user.id,
                    allow_negative=True
                )
            imported += 1
        except Exception as e:
            errors.append(f"Row {row_num} ({name}): {str(e)}")

    db.commit()
    return BulkImportResult(
        total_records=row_num - 1,
        imported_count=imported,
        errors=errors[:15]
    )
