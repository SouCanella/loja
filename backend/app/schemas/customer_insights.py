"""IP-06 — métricas simples de actividade por cliente (pedidos com conta)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CustomerOrderStatOut(BaseModel):
    customer_id: UUID
    email: str
    order_count: int = Field(..., ge=0)
    last_order_at: datetime


class CustomerOrderStatsOut(BaseModel):
    stats: list[CustomerOrderStatOut]
