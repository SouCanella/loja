"""Catálogo (categorias, produtos)."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=120)


class CategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class InventorySeed(BaseModel):
    unit: str = Field(default="un", max_length=32)
    initial_quantity: Decimal = Field(..., gt=0)
    unit_cost: Decimal = Field(..., ge=0)
    expiration_date: date | None = None


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(..., ge=0)
    category_id: UUID | None = None
    inventory: InventorySeed


class ProductOut(BaseModel):
    id: UUID
    store_id: UUID
    category_id: UUID | None
    name: str
    description: str | None
    price: Decimal
    active: bool

    model_config = {"from_attributes": True}
