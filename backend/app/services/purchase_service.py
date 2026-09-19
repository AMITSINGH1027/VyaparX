from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.purchase import Purchase, PurchaseItem
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.sale import PaymentStatus
from app.models.inventory import MovementType
from app.models.business import Business
from app.schemas.purchase import PurchaseCreate
from app.services.inventory_service import record_inventory_movement
from app.services.audit_service import log_activity

def generate_purchase_number(db: Session, business_id: str) -> str:
    year = datetime.now().year
    count = db.query(Purchase).filter(Purchase.business_id == business_id).count() + 1
    return f"PO-{year}-{count:05d}"

def create_purchase_transaction(
    db: Session,
    business_id: str,
    purchase_in: PurchaseCreate,
    user_id: Optional[str] = None
) -> Purchase:
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    po_number = generate_purchase_number(db, business_id)
    purchase_date = purchase_in.purchase_date or datetime.now(timezone.utc)

    # 1. Fetch products
    product_ids = [item.product_id for item in purchase_in.items]
    products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.business_id == business_id
    ).all()
    product_map = {p.id: p for p in products}

    for item in purchase_in.items:
        if item.product_id not in product_map:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

    # 2. Compute purchase totals
    subtotal = 0.0
    tax_total = 0.0
    item_entities = []

    for item in purchase_in.items:
        prod = product_map[item.product_id]
        item_base = item.unit_cost * item.quantity
        item_tax = item_base * (item.tax_rate / 100.0)
        item_total = item_base + item_tax

        subtotal += item_base
        tax_total += item_tax

        # Update product cost price to latest purchase cost
        prod.cost_price = item.unit_cost
        db.add(prod)

        po_item = PurchaseItem(
            product_id=prod.id,
            product_name=prod.name,
            quantity=item.quantity,
            unit_cost=item.unit_cost,
            tax_rate=item.tax_rate,
            total_cost=round(item_total, 2)
        )
        item_entities.append(po_item)

    grand_total = round(subtotal + tax_total - purchase_in.discount_amount, 2)
    if grand_total < 0:
        grand_total = 0.0

    paid_amt = purchase_in.paid_amount if purchase_in.paid_amount is not None else (grand_total if purchase_in.payment_status == PaymentStatus.PAID else 0.0)

    # 3. Create Purchase record
    purchase = Purchase(
        business_id=business_id,
        supplier_id=purchase_in.supplier_id,
        purchase_number=po_number,
        purchase_date=purchase_date,
        subtotal=round(subtotal, 2),
        tax_amount=round(tax_total, 2),
        discount_amount=round(purchase_in.discount_amount, 2),
        grand_total=grand_total,
        paid_amount=round(paid_amt, 2),
        payment_status=purchase_in.payment_status,
        notes=purchase_in.notes,
        created_by_user_id=user_id,
        items=item_entities
    )
    db.add(purchase)
    db.flush()

    # 4. Increment inventory & record movements
    for item in purchase_in.items:
        record_inventory_movement(
            db=db,
            business_id=business_id,
            product_id=item.product_id,
            movement_type=MovementType.PURCHASE,
            quantity_change=item.quantity,
            reference_id=purchase.id,
            notes=f"Purchase Order: {po_number}",
            user_id=user_id,
            allow_negative=True
        )

    # 5. Update supplier balances
    if purchase_in.supplier_id:
        supplier = db.query(Supplier).filter(
            Supplier.id == purchase_in.supplier_id,
            Supplier.business_id == business_id
        ).first()
        if supplier:
            supplier.total_purchases_amount += grand_total
            unpaid = grand_total - paid_amt
            if unpaid > 0:
                supplier.outstanding_balance += unpaid
            db.add(supplier)

    log_activity(
        db=db,
        business_id=business_id,
        action="CREATE_PURCHASE",
        resource_type="Purchase",
        resource_id=purchase.id,
        user_id=user_id,
        details=f"Created PO {po_number} for amount {business.currency_symbol}{grand_total}"
    )

    db.commit()
    db.refresh(purchase)
    return purchase
