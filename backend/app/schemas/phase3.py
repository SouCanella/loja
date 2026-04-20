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
    target_margin_percent: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
        description="Margem % sobre custo; None herda da loja",
    )


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
    is_active: bool = True
    items: list[RecipeItemOut]
    estimated_unit_cost: Decimal | None = None
    target_margin_percent: Decimal | None = None
    effective_margin_percent: Decimal
    suggested_unit_price: Decimal | None = None

    model_config = {"from_attributes": True}


class RecipePatch(BaseModel):
    yield_quantity: Decimal | None = Field(default=None, gt=0)
    time_minutes: int | None = None
    is_active: bool | None = None
    items: list[RecipeItemCreate] | None = None
    target_margin_percent: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
        description="Enviar null para voltar à margem da loja",
    )


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


class FinancialReportProductRow(BaseModel):
    """Receita de pedidos vs custo de produção no período, por produto acabado."""

    product_id: UUID
    product_name: str
    orders_revenue: Decimal
    quantity_sold: Decimal
    production_input_cost: Decimal
    margin_amount: Decimal
    margin_percent: Decimal | None = Field(
        default=None,
        description="(receita − custo produção) / receita × 100 quando receita > 0",
    )


class FinancialReportCategoryRow(BaseModel):
    """Agregação por categoria de produto (mesma lógica de aproximação que por produto)."""

    category_id: UUID | None
    category_name: str
    orders_revenue: Decimal
    quantity_sold: Decimal
    production_input_cost: Decimal
    margin_amount: Decimal
    margin_percent: Decimal | None = Field(
        default=None,
        description="(receita − custo produção) / receita × 100 quando receita > 0",
    )


class FinancialReportStatusRow(BaseModel):
    """Pedidos por estado no período (exclui rascunho/cancelado; alinhado à receita)."""

    status: str
    orders_count: int
    orders_revenue: Decimal


class FinancialReportOut(BaseModel):
    date_from: date
    date_to: date
    orders_revenue: Decimal
    orders_count: int
    production_runs_count: int
    production_input_cost: Decimal
    period_margin_estimate: Decimal = Field(
        ...,
        description="Receita pedidos − custo insumos produção no período (aproximação)",
    )
    period_margin_percent: Decimal | None = Field(
        default=None,
        description="period_margin_estimate / orders_revenue × 100 quando receita > 0",
    )
    by_product: list[FinancialReportProductRow] = Field(default_factory=list)
    by_category: list[FinancialReportCategoryRow] = Field(default_factory=list)
    by_order_status: list[FinancialReportStatusRow] = Field(default_factory=list)
