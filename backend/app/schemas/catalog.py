"""Catálogo (categorias, produtos)."""

from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

CatalogSpotlight = Literal["featured", "new", "bestseller"]
CatalogSaleMode = Literal["in_stock", "order_only", "unavailable"]


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class CategoryOut(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class CategoryPatch(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)


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
    catalog_spotlight: CatalogSpotlight | None = None
    catalog_sale_mode: CatalogSaleMode = "in_stock"
    track_inventory: bool = True
    inventory: InventorySeed | None = None

    @model_validator(mode="after")
    def inventory_matches_track(self) -> "ProductCreate":
        if self.track_inventory and self.inventory is None:
            raise ValueError("inventory é obrigatório quando track_inventory é verdadeiro")
        if not self.track_inventory and self.inventory is not None:
            raise ValueError("omitir inventory quando track_inventory é falso")
        return self


class ProductOut(BaseModel):
    id: UUID
    store_id: UUID
    inventory_item_id: UUID | None
    track_inventory: bool = True
    category_id: UUID | None
    name: str
    description: str | None
    image_url: str | None = None
    price: Decimal
    active: bool
    catalog_spotlight: str | None = None
    catalog_sale_mode: str = "in_stock"

    model_config = {"from_attributes": True}


class ProductPatch(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    image_url: str | None = Field(None, max_length=512)
    price: Decimal | None = Field(None, ge=0)
    active: bool | None = None
    category_id: UUID | None = None
    catalog_spotlight: CatalogSpotlight | None = None
    catalog_sale_mode: CatalogSaleMode | None = None
