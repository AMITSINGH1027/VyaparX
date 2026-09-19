import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    reference_type = Column(String(50), nullable=False)
    reference_id = Column(String(36), nullable=True)
    customer_id = Column(String(36), ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    supplier_id = Column(String(36), ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), nullable=False, default="UPI")
    payment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    transaction_reference = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    business = relationship("Business")
    customer = relationship("Customer")
    supplier = relationship("Supplier")
    user = relationship("User")
