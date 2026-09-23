from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.product import Product, ProductStatus
from app.models.notification import NotificationType
from app.services.notification_service import (
    create_notification,
    resolve_notification,
)


def run_inventory_monitor(db: Session) -> int:
    """
    Automatically checks inventory for every business.

    Handles:
    - OUT_OF_STOCK notifications
    - LOW_STOCK notifications
    - Notification resolution
    - Duplicate prevention

    Only ACTIVE products are monitored.

    Returns:
        Number of newly created notifications.
    """

    created_count = 0

    businesses = db.query(Business).all()

    for business in businesses:

        products = (
            db.query(Product)
            .filter(
                Product.business_id == business.id,
                Product.status == ProductStatus.ACTIVE,
            )
            .all()
        )

        for product in products:

            business_id = str(business.id)
            product_id = str(product.id)

            # ==================================================
            # OUT OF STOCK
            # ==================================================

            if product.current_stock == 0:

                # A product cannot be simultaneously LOW_STOCK
                # and OUT_OF_STOCK.
                resolve_notification(
                    db=db,
                    business_id=business_id,
                    source_type="PRODUCT_LOW_STOCK",
                    source_id=product_id,
                )

                _, created = create_notification(
                    db=db,
                    business_id=business_id,
                    type=NotificationType.OUT_OF_STOCK,
                    title="Out of Stock Alert",
                    message=(
                        f"{product.name} is completely out of stock!"
                    ),
                    link="/inventory",
                    source_type="PRODUCT_OUT_OF_STOCK",
                    source_id=product_id,
                )

                if created:
                    created_count += 1

            # ==================================================
            # LOW STOCK
            # ==================================================

            elif product.current_stock <= product.min_stock_alert:

                # Product is no longer out of stock.
                resolve_notification(
                    db=db,
                    business_id=business_id,
                    source_type="PRODUCT_OUT_OF_STOCK",
                    source_id=product_id,
                )

                recommended = max(
                    10,
                    product.min_stock_alert * 2
                    - product.current_stock,
                )

                _, created = create_notification(
                    db=db,
                    business_id=business_id,
                    type=NotificationType.LOW_STOCK,
                    title="Low Stock Alert",
                    message=(
                        f"{product.name} is running low "
                        f"({product.current_stock} units left). "
                        f"Recommended purchase: "
                        f"{recommended} units."
                    ),
                    link="/inventory",
                    source_type="PRODUCT_LOW_STOCK",
                    source_id=product_id,
                )

                if created:
                    created_count += 1

            # ==================================================
            # STOCK NORMAL
            # ==================================================

            else:

                # Product has recovered from low stock.
                resolve_notification(
                    db=db,
                    business_id=business_id,
                    source_type="PRODUCT_LOW_STOCK",
                    source_id=product_id,
                )

                # Product has recovered from out of stock.
                resolve_notification(
                    db=db,
                    business_id=business_id,
                    source_type="PRODUCT_OUT_OF_STOCK",
                    source_id=product_id,
                )

    db.commit()

    return created_count