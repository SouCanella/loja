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
    quantity_available: Decimal = Field(
        ...,
        description="Soma das quantidades em todos os lotes deste insumo.",
    )
    weighted_avg_unit_cost: Decimal | None = Field(
        default=None,
        description="Custo médio ponderado pelos lotes (q×custo / q total) quando q > 0.",
    )
    inventory_value: Decimal = Field(
        ...,
        description="Soma (quantidade × custo unitário do lote) — valor aproximado em stock.",
    )

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
