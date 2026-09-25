from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.product import ProductStatus

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryResponse(BaseModel):
    id: str
    business_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    sku: str
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    cost_price: float = Field(ge=0, default=0.0)
    selling_price: float = Field(gt=0)
    tax_rate: float = Field(ge=0, le=100, default=0.0)
    current_stock: int = Field(ge=0, default=0)
    min_stock_alert: int = Field(ge=0, default=10)
    max_stock_capacity: int = Field(ge=0, default=1000)
    unit: str = "units"
    image_url: Optional[str] = None
    status: Optional[ProductStatus] = ProductStatus.ACTIVE

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[float] = Field(ge=0, default=None)
    selling_price: Optional[float] = Field(gt=0, default=None)
    tax_rate: Optional[float] = Field(ge=0, le=100, default=None)
    current_stock: Optional[int] = None
    min_stock_alert: Optional[int] = None
    max_stock_capacity: Optional[int] = None
    unit: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[ProductStatus] = None

class ProductResponse(BaseModel):
    id: str
    business_id: str
    category_id: Optional[str] = None
    supplier_id: Optional[str] = None
    name: str
    sku: str
    brand: Optional[str] = None
    description: Optional[str] = None
    cost_price: float
    selling_price: float
    tax_rate: float
    current_stock: int
    min_stock_alert: int
    max_stock_capacity: int
    unit: str
    image_url: Optional[str] = None
    status: ProductStatus
    category_name: Optional[str] = None
    supplier_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BulkImportResult(BaseModel):
    total_records: int
    imported_count: int
    errors: List[str]
