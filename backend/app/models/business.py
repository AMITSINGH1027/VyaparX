import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    unique_code = Column(
    String(20),
    unique=True,
    nullable=False,
    index=True)
    name = Column(String(255), nullable=False, index=True)
    business_type = Column(String(100), nullable=True)
    industry = Column(String(150), nullable=True)
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), default="India")
    tax_id_gst = Column(String(100), nullable=True)
    pan = Column(String(20), nullable=True)
    business_registration_number = Column(String(100), nullable=True)
    tax_type = Column(String(50), nullable=True)
    pincode = Column(String(10), nullable=True)
    logo_url = Column(String(500), nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    currency_symbol = Column(String(10), default="₹", nullable=False)
    timezone = Column(String(50), default="Asia/Kolkata", nullable=False)
    allow_negative_stock = Column(String(10), default="false", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    owner = relationship("User", back_populates="owned_business")
    members = relationship("BusinessUser", back_populates="business", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="business", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="business", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="business", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", back_populates="business", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="business", cascade="all, delete-orphan")
    purchases = relationship("Purchase", back_populates="business", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="business", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="business", cascade="all, delete-orphan")
    inventory_movements = relationship("InventoryMovement", back_populates="business", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="business", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="business", cascade="all, delete-orphan")
    ml_models = relationship("MLModelRecord", back_populates="business", cascade="all, delete-orphan")

class BusinessUser(Base):
    __tablename__ = "business_users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    department = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    business = relationship("Business", back_populates="members")
    user = relationship("User", back_populates="business_membership")
