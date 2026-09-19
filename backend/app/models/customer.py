import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class CustomerSegment(str, enum.Enum):
    VIP = "VIP Customers"
    LOYAL = "Loyal Customers"
    REGULAR = "Regular Customers"
    POTENTIAL = "Potential Customers"
    AT_RISK = "At-Risk Customers"
    INACTIVE = "Inactive Customers"

class ChurnRiskLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True, index=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    tax_id = Column(String(100), nullable=True)
    total_spent = Column(Float, nullable=False, default=0.0)
    order_count = Column(Integer, nullable=False, default=0)
    outstanding_balance = Column(Float, nullable=False, default=0.0)
    last_purchase_date = Column(DateTime, nullable=True)
    rfm_segment = Column(SAEnum(CustomerSegment), default=CustomerSegment.REGULAR, nullable=False)
    churn_risk = Column(SAEnum(ChurnRiskLevel), default=ChurnRiskLevel.LOW, nullable=False)
    churn_risk_score = Column(Float, default=0.1, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    business = relationship("Business", back_populates="customers")
    sales = relationship("Sale", back_populates="customer")
