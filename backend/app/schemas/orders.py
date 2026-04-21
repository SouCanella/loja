"""Pedidos."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0)
    line_note: str | None = Field(None, max_length=2000)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)
    customer_note: str | None = None


class OrderItemOut(BaseModel):
    id: UUID
    product_id: UUID
    quantity: Decimal
    unit_price: Decimal
    line_note: str | None = None

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: UUID
    store_id: UUID
    status: OrderStatus
    customer_note: str | None
    source: str | None = None
    customer_id: UUID | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    delivery_option_id: str | None = None
    payment_method_id: str | None = None
    delivery_address: str | None = None
    stock_committed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class OrderDetailOut(OrderOut):
    items: list[OrderItemOut]


class OrderStatusPatch(BaseModel):
    status: OrderStatus
