"""Dados para impressão de pedido (Fase 3.2)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class OrderPrintLineOut(BaseModel):
    product_name: str
    quantity: str = Field(..., description="Quantidade como decimal string")
    unit_price: str
    line_total: str
    line_note: str | None = None


class OrderPrintOut(BaseModel):
    store_name: str
    store_slug: str
    order_id: UUID
    status: str
    created_at: datetime
    customer_note: str | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    delivery_address: str | None = None
    delivery_option_id: str | None = None
    payment_method_id: str | None = None
    lines: list[OrderPrintLineOut]
    total: str
    """Configuração efectiva de impressão (eco para o cliente)."""
    print_config: dict = Field(default_factory=dict)
