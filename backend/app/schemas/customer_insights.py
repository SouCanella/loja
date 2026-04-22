"""IP-06 — métricas simples de actividade por cliente (pedidos com conta)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CustomerOrderStatOut(BaseModel):
    customer_id: UUID
    #: Texto para listagem (e-mail ou nome · telefone).
    display_label: str
    email: str | None = None
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
    #: Pedidos no período com `customer_id` (conta vitrine).
    total_orders_with_account_in_period: int = Field(..., ge=0)
    #: Compradores com ≥2 pedidos no período (recompra).
    repeat_buyers_count: int = Field(..., ge=0)
    #: Compradores com exatamente 1 pedido no período.
    single_purchase_buyers_count: int = Field(..., ge=0)
    #: Média de pedidos por comprador distinto no período; `null` se não houver compradores.
    avg_orders_per_buyer: float | None = None
    #: % de compradores (≥1 pedido) com recompra (≥2 pedidos); `null` sem compradores.
    recompra_rate_pct: float | None = None
    #: Dias médios entre pedidos (aprox. (último−primeiro)/(n−1)) para quem tem ≥2 pedidos.
    avg_days_between_orders_repeat_buyers: float | None = None
