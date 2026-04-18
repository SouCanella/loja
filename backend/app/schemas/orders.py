"""Pedidos."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import OrderStatus


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)
    customer_note: str | None = None


class OrderItemOut(BaseModel):
    id: UUID
    product_id: UUID
    quantity: Decimal
    unit_price: Decimal

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: UUID
    store_id: UUID
    status: OrderStatus
    customer_note: str | None
    stock_committed: bool

    model_config = {"from_attributes": True}


class OrderDetailOut(OrderOut):
    items: list[OrderItemOut]


class OrderStatusPatch(BaseModel):
    status: OrderStatus
