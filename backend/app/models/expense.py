import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.sale import PaymentMethod

class ExpenseCategory(str, enum.Enum):
    RENT = "Rent"
    SALARY = "Salary"
    ELECTRICITY = "Electricity"
    INTERNET = "Internet"
    TRANSPORT = "Transport"
    MARKETING = "Marketing"
    MAINTENANCE = "Maintenance"
    OFFICE_SUPPLIES = "Office Supplies"
    OTHER = "Other"

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(SAEnum(ExpenseCategory), default=ExpenseCategory.OFFICE_SUPPLIES, nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(SAEnum(PaymentMethod), default=PaymentMethod.CASH, nullable=False)
    expense_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    receipt_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_by_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    business = relationship("Business", back_populates="expenses")
    created_by = relationship("User")
