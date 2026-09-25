import uuid
import enum

from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    Enum as SAEnum,
)

from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    BUSINESS_OWNER = "BUSINESS_OWNER"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class User(Base):
    __tablename__ = "users"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    email = Column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # ========================================================
    # Authentication Provider
    # ========================================================

    # local  -> normal email/password login
    # google -> Google OAuth login
    # microsoft -> Microsoft OAuth login
    auth_provider = Column(
        String(30),
        nullable=False,
        default="local",
        index=True,
    )

    # User ID supplied by Google/Microsoft
    provider_user_id = Column(
        String(255),
        nullable=True,
        index=True,
    )

    hashed_password = Column(
        String(255),
        nullable=False,
    )

    first_name = Column(
        String(100),
        nullable=False,
    )

    last_name = Column(
        String(100),
        nullable=False,
    )

    phone = Column(
        String(30),
        nullable=True,
    )

    role = Column(
        SAEnum(UserRole),
        default=UserRole.BUSINESS_OWNER,
        nullable=False,
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    avatar_url = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # ========================================================
    # Relationships
    # ========================================================

    owned_business = relationship(
        "Business",
        back_populates="owner",
        uselist=False,
    )

    business_membership = relationship(
        "BusinessUser",
        back_populates="user",
        uselist=False,
    )

    sales = relationship(
        "Sale",
        back_populates="created_by_user",
    )

    purchases = relationship(
        "Purchase",
        back_populates="created_by_user",
    )

    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
    )

    notifications = relationship(
        "Notification",
        back_populates="user",
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"