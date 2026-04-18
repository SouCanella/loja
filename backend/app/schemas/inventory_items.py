"""Insumos (inventory_items)."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class InventoryItemListOut(BaseModel):
    id: UUID
    name: str
    unit: str
    has_sale_product: bool = False

    model_config = {"from_attributes": True}


class InventoryBatchSeed(BaseModel):
    quantity: Decimal = Field(..., gt=0)
    unit_cost: Decimal = Field(..., ge=0)
    expiration_date: date | None = None


class InventoryItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    unit: str = Field(default="un", max_length=32)
    initial_batch: InventoryBatchSeed | None = None


class InventoryItemPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    unit: str | None = Field(default=None, min_length=1, max_length=32)


class InventoryItemDetailOut(BaseModel):
    id: UUID
    name: str
    unit: str
    has_sale_product: bool

    model_config = {"from_attributes": True}
