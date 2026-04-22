"""Pedidos."""

from datetime import datetime
from decimal import Decimal
from typing import Self
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.enums import OrderStatus
from app.schemas.customers_painel import StaffCustomerCreate


class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(..., gt=0)
    line_note: str | None = Field(None, max_length=2000)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)
    customer_note: str | None = None
    #: Cliente já existente na loja (não combinar com `new_customer`).
    customer_id: UUID | None = None
    #: Criar contacto (`painel_manual`) e associar; não combinar com `customer_id`.
    new_customer: StaffCustomerCreate | None = None

    @model_validator(mode="after")
    def customer_payload_exclusive(self) -> Self:
        if self.customer_id is not None and self.new_customer is not None:
            raise ValueError("Use apenas customer_id ou new_customer, não ambos.")
        return self


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
