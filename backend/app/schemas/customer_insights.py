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
    #: Total de contas de cliente (vitrine) da loja.
    registered_accounts_count: int = Field(..., ge=0)
    #: Distintos com pelo menos um pedido no intervalo (alinhado ao critério da tabela).
    accounts_with_orders_in_period: int = Field(..., ge=0)
    #: Contas sem nenhum pedido no intervalo (inactivas no período).
    accounts_without_orders_in_period: int = Field(..., ge=0)
