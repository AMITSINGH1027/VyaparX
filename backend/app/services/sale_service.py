import random
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.sale import Sale, SaleItem, PaymentMethod, PaymentStatus
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory import MovementType
from app.models.business import Business
from app.schemas.sale import SaleCreate
from app.services.inventory_service import record_inventory_movement
from app.services.audit_service import log_activity

def generate_invoice_number(db: Session, business_id: str) -> str:
    year = datetime.now().year
    count = db.query(Sale).filter(Sale.business_id == business_id).count() + 1
    return f"INV-{year}-{count:05d}"

def create_sale_transaction(
    db: Session,
    business_id: str,
    sale_in: SaleCreate,
    user_id: Optional[str] = None
) -> Sale:
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    allow_neg = business.allow_negative_stock.lower() == "true"
    invoice_num = generate_invoice_number(db, business_id)
    sale_date = sale_in.sale_date or datetime.now(timezone.utc)

    # 1. Fetch products & validate stock
    product_ids = [item.product_id for item in sale_in.items]
    products = db.query(Product).filter(
        Product.id.in_(product_ids),
        Product.business_id == business_id
    ).all()
    product_map = {p.id: p for p in products}

    for item in sale_in.items:
        if item.product_id not in product_map:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        prod = product_map[item.product_id]
        if prod.current_stock < item.quantity and not allow_neg:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot complete sale: '{prod.name}' has only {prod.current_stock} in stock (requested: {item.quantity})"
            )

    # 2. Compute financial totals
    subtotal = 0.0
    tax_total = 0.0
    item_entities = []

    for item in sale_in.items:
        prod = product_map[item.product_id]
        unit_price = item.unit_price if item.unit_price is not None else prod.selling_price
        item_base = unit_price * item.quantity
        item_discount = item_base * (item.discount_rate / 100.0)
        taxable = item_base - item_discount
        item_tax = taxable * (prod.tax_rate / 100.0)
        item_total = taxable + item_tax

        subtotal += taxable
        tax_total += item_tax

        sale_item = SaleItem(
            product_id=prod.id,
            product_name=prod.name,
            quantity=item.quantity,
            unit_price=unit_price,
            unit_cost=prod.cost_price,
            discount_rate=item.discount_rate,
            tax_rate=prod.tax_rate,
            total_price=round(item_total, 2)
        )
        item_entities.append(sale_item)

    grand_total = round(subtotal + tax_total - sale_in.discount_amount, 2)
    if grand_total < 0:
        grand_total = 0.0

    paid_amt = sale_in.paid_amount if sale_in.paid_amount is not None else (grand_total if sale_in.payment_status == PaymentStatus.PAID else 0.0)

    # 3. Create Sale record
    sale = Sale(
        business_id=business_id,
        customer_id=sale_in.customer_id,
        invoice_number=invoice_num,
        sale_date=sale_date,
        subtotal=round(subtotal, 2),
        discount_amount=round(sale_in.discount_amount, 2),
        tax_amount=round(tax_total, 2),
        grand_total=grand_total,
        paid_amount=round(paid_amt, 2),
        payment_method=sale_in.payment_method,
        payment_status=sale_in.payment_status,
        notes=sale_in.notes,
        created_by_user_id=user_id,
        items=item_entities
    )
    db.add(sale)
    db.flush()

    # 4. Decrement inventory & create movement logs
    for item in sale_in.items:
        record_inventory_movement(
            db=db,
            business_id=business_id,
            product_id=item.product_id,
            movement_type=MovementType.SALE,
            quantity_change=-item.quantity,
            reference_id=sale.id,
            notes=f"Sale Invoice: {invoice_num}",
            user_id=user_id,
            allow_negative=allow_neg
        )

    # 5. Update customer balance & statistics if customer selected
    if sale_in.customer_id:
        cust = db.query(Customer).filter(
            Customer.id == sale_in.customer_id,
            Customer.business_id == business_id
        ).first()
        if cust:
            cust.total_spent += grand_total
            cust.order_count += 1
            cust.last_purchase_date = sale_date
            outstanding = grand_total - paid_amt
            if outstanding > 0:
                cust.outstanding_balance += outstanding
            db.add(cust)

    log_activity(
        db=db,
        business_id=business_id,
        action="CREATE_SALE",
        resource_type="Sale",
        resource_id=sale.id,
        user_id=user_id,
        details=f"Created Sale {invoice_num} for amount {business.currency_symbol}{grand_total}"
    )

    db.commit()
    db.refresh(sale)
    return sale
