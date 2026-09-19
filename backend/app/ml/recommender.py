from collections import defaultdict
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.sale import Sale, SaleItem, PaymentStatus
from app.models.product import Product

class ProductRecommenderEngine:
    def __init__(self, business_id: str):
        self.business_id = business_id

    def get_frequently_bought_together(self, db: Session, product_id: str, limit: int = 4) -> List[Dict[str, Any]]:
        # Find all sales containing this product
        sale_ids = [
            item.sale_id for item in db.query(SaleItem).filter(
                SaleItem.product_id == product_id
            ).all()
        ]

        if not sale_ids:
            # Fallback to same category products
            prod = db.query(Product).filter(Product.id == product_id).first()
            if prod and prod.category_id:
                same_cat = db.query(Product).filter(
                    Product.business_id == self.business_id,
                    Product.category_id == prod.category_id,
                    Product.id != product_id
                ).limit(limit).all()
                return [{"id": p.id, "name": p.name, "selling_price": p.selling_price, "reason": "Similar Category"} for p in same_cat]
            return []

        # Find co-occurring items in these sales
        co_items = db.query(SaleItem).filter(
            SaleItem.sale_id.in_(sale_ids),
            SaleItem.product_id != product_id
        ).all()

        freq_map = defaultdict(int)
        for item in co_items:
            freq_map[item.product_id] += 1

        sorted_pids = sorted(freq_map.keys(), key=lambda x: freq_map[x], reverse=True)[:limit]
        rec_products = db.query(Product).filter(Product.id.in_(sorted_pids)).all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "selling_price": p.selling_price,
                "co_occurrence_count": freq_map[p.id],
                "reason": "Frequently bought together in same basket"
            }
            for p in rec_products
        ]

    def get_customer_recommendations(self, db: Session, customer_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        # Fetch customer's past purchases
        past_items = db.query(SaleItem).join(Sale).filter(
            Sale.customer_id == customer_id,
            Sale.payment_status != PaymentStatus.CANCELLED
        ).all()

        bought_pids = set(item.product_id for item in past_items)
        
        # Recommendations based on frequently bought together with their top items
        candidate_map = defaultdict(int)
        for pid in bought_pids:
            recs = self.get_frequently_bought_together(db, pid, limit=3)
            for r in recs:
                if r["id"] not in bought_pids:
                    candidate_map[r["id"]] += 1

        sorted_rec_ids = sorted(candidate_map.keys(), key=lambda x: candidate_map[x], reverse=True)[:limit]
        
        if not sorted_rec_ids:
            # Fallback to top-selling products
            top_prods = db.query(Product).filter(
                Product.business_id == self.business_id,
                ~Product.id.in_(bought_pids) if bought_pids else True
            ).limit(limit).all()
            return [{"id": p.id, "name": p.name, "selling_price": p.selling_price, "reason": "Trending Best-Seller"} for p in top_prods]

        prods = db.query(Product).filter(Product.id.in_(sorted_rec_ids)).all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "selling_price": p.selling_price,
                "category": p.category.name if p.category else "General",
                "reason": "Recommended based on your past purchasing preferences"
            }
            for p in prods
        ]
