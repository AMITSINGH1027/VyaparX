from typing import Dict, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_business_id

from app.models.product import Product
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.sale import Sale
from app.models.employee import Employee


router = APIRouter(
    prefix="/search",
    tags=["Global Search"]
)


@router.get("/")
def global_search(
    q: str = Query(..., min_length=1),
    business_id: str = Depends(get_current_business_id),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:

    search_text = q.strip()

    if not search_text:
        return {
            "products": [],
            "customers": [],
            "suppliers": [],
            "sales": [],
            "employees": []
        }

    term = f"%{search_text}%"

    # =========================================================
    # PRODUCTS
    # =========================================================

    products = (
        db.query(Product)
        .filter(
            Product.business_id == business_id,
            (
                Product.name.ilike(term)
                | Product.sku.ilike(term)
            )
        )
        .limit(8)
        .all()
    )

    # =========================================================
    # CUSTOMERS
    # =========================================================

    customers = (
        db.query(Customer)
        .filter(
            Customer.business_id == business_id,
            (
                Customer.name.ilike(term)
                | Customer.email.ilike(term)
                | Customer.phone.ilike(term)
            )
        )
        .limit(8)
        .all()
    )

    # =========================================================
    # SUPPLIERS
    # =========================================================

    suppliers = (
        db.query(Supplier)
        .filter(
            Supplier.business_id == business_id,
            (
                Supplier.name.ilike(term)
                | Supplier.email.ilike(term)
                | Supplier.contact_person.ilike(term)
            )
        )
        .limit(8)
        .all()
    )

    # =========================================================
    # SALES / INVOICES
    # =========================================================

    sales = (
        db.query(Sale)
        .filter(
            Sale.business_id == business_id,
            Sale.invoice_number.ilike(term)
        )
        .limit(8)
        .all()
    )

    # =========================================================
    # EMPLOYEES / WORKERS
    # =========================================================

    employees = (
        db.query(Employee)
        .filter(
            Employee.business_id == business_id,
            (
                Employee.first_name.ilike(term)
                | Employee.last_name.ilike(term)
                | Employee.email.ilike(term)
                | Employee.phone.ilike(term)
                | Employee.designation.ilike(term)
                | Employee.department.ilike(term)
            )
        )
        .limit(8)
        .all()
    )

    # =========================================================
    # RESPONSE
    # =========================================================

    return {
        "products": [
            {
                "id": p.id,
                "title": p.name,
                "subtitle": (
                    f"SKU: {p.sku or 'N/A'} | "
                    f"Stock: {p.current_stock or 0}"
                ),
                "link": "/products"
            }
            for p in products
        ],

        "customers": [
            {
                "id": c.id,
                "title": c.name,
                "subtitle": (
                    f"Phone: {c.phone or 'N/A'} | "
                    f"Spent: ₹{c.total_spent or 0:,}"
                ),
                "link": f"/customers/{c.id}"
            }
            for c in customers
        ],

        "suppliers": [
            {
                "id": s.id,
                "title": s.name,
                "subtitle": (
                    f"Contact: {s.contact_person or 'N/A'}"
                ),
                "link": "/suppliers"
            }
            for s in suppliers
        ],

        "sales": [
            {
                "id": sl.id,
                "title": sl.invoice_number,
                "subtitle": (
                    f"Total: ₹{sl.grand_total or 0:,} | "
                    f"{sl.payment_status.value if sl.payment_status else 'N/A'}"
                ),
                "link": f"/invoices/{sl.id}"
            }
            for sl in sales
        ],

        "employees": [
            {
                "id": e.id,
                "title": f"{e.first_name} {e.last_name or ''}".strip(),
                "subtitle": (
                    f"{e.designation or 'Employee'}"
                    f" | {e.department or 'No Department'}"
                ),
                "link": "/employees"
            }
            for e in employees
        ]
    }