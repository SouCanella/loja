"""Resumo do dashboard (Fase 3.1)."""

from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class DashboardKpisOut(BaseModel):
    orders_today: int = Field(..., description="Pedidos com data UTC = hoje.")
    orders_in_period: int
    ticket_avg: Decimal | None = Field(None, description="Receita ÷ pedidos no período.")
    out_of_stock_items_count: int = Field(
        ...,
        description="Insumos com quantidade total em lotes = 0.",
    )
    new_customers_in_period: int | None = Field(
        default=None,
        description="Reservado (3.1-b); null na 3.1-a.",
    )


class DashboardRevenueDayOut(BaseModel):
    date: date
    revenue: Decimal


class DashboardStatusCountOut(BaseModel):
    status: str
    count: int


class DashboardSummaryOut(BaseModel):
    date_from: date
    date_to: date
    aggregation_note: str = Field(
        default="Dias e «hoje» em calendário UTC (alinhado ao relatório financeiro).",
    )
    kpis: DashboardKpisOut
    revenue_by_day: list[DashboardRevenueDayOut]
    revenue_moving_avg_7d: list[DashboardRevenueDayOut]
    orders_by_status: list[DashboardStatusCountOut]
