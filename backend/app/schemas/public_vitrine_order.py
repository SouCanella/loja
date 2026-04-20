"""Pedido público (vitrine → IP-11)."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class PublicOrderItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0)


class PublicOrderCreate(BaseModel):
    items: list[PublicOrderItemCreate] = Field(..., min_length=1)
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: str = Field(..., min_length=3, max_length=64)
    customer_note: str | None = Field(None, max_length=4000)
    delivery_option_id: str = Field(..., min_length=1, max_length=64)
    payment_method_id: str = Field(..., min_length=1, max_length=64)
    delivery_address: str | None = Field(None, max_length=2000)
    """Honeypot anti-bot — deve vir vazio."""
    website: str | None = Field(None, max_length=200)


class PublicOrderCreatedOut(BaseModel):
    order_id: UUID
    short_code: str
