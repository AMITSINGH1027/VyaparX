import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.core.database import Base

class ModelType(str, enum.Enum):
    CUSTOMER_SEGMENTATION = "CUSTOMER_SEGMENTATION"
    SALES_FORECASTING = "SALES_FORECASTING"
    DEMAND_PREDICTION = "DEMAND_PREDICTION"
    CHURN_PREDICTION = "CHURN_PREDICTION"
    RECOMMENDER = "RECOMMENDER"

class ModelStatus(str, enum.Enum):
    TRAINED = "TRAINED"
    TRAINING = "TRAINING"
    FAILED = "FAILED"

class MLModelRecord(Base):
    __tablename__ = "ml_models"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    model_type = Column(SAEnum(ModelType), nullable=False)
    version = Column(String(50), default="1.0.0", nullable=False)
    metrics_json = Column(Text, nullable=True)
    status = Column(SAEnum(ModelStatus), default=ModelStatus.TRAINED, nullable=False)
    last_trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    business = relationship("Business", back_populates="ml_models")
