"""Receitas, produção e relatórios (Fase 3)."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class RecipeItemCreate(BaseModel):
    inventory_item_id: UUID
    quantity: Decimal = Field(..., gt=0)


class RecipeCreate(BaseModel):
    product_id: UUID
    yield_quantity: Decimal = Field(..., gt=0)
    time_minutes: int | None = Field(default=None, ge=0)
    items: list[RecipeItemCreate] = Field(..., min_length=1)


class RecipeItemOut(BaseModel):
    id: UUID
    inventory_item_id: UUID
    quantity: Decimal

    model_config = {"from_attributes": True}


class RecipeOut(BaseModel):
    id: UUID
    product_id: UUID
    yield_quantity: Decimal
    time_minutes: int | None
    items: list[RecipeItemOut]
    estimated_unit_cost: Decimal | None = None

    model_config = {"from_attributes": True}


class RecipePatch(BaseModel):
    yield_quantity: Decimal | None = Field(default=None, gt=0)
    time_minutes: int | None = None
    items: list[RecipeItemCreate] | None = None


class ProductionRequest(BaseModel):
    recipe_id: UUID


class ProductionRunOut(BaseModel):
    id: UUID
    recipe_id: UUID
    output_quantity: Decimal
    total_input_cost: Decimal
    unit_output_cost: Decimal
    created_at: str

    model_config = {"from_attributes": True}


class FinancialReportOut(BaseModel):
    date_from: date
    date_to: date
    orders_revenue: Decimal
    orders_count: int
    production_runs_count: int
    production_input_cost: Decimal
