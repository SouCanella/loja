"""Pedidos (DEC-14, stock DEC-17)."""

from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.api.handlers import orders as orders_handlers
from app.db.session import get_db
from app.models.order import Order
from app.models.user import User
from app.schemas.orders import OrderCreate, OrderDetailOut, OrderOut, OrderStatusPatch
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["orders"])


@router.get("", response_model=list[OrderOut])
def list_orders(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> list[Order]:
    return orders_handlers.list_orders(db, current)


@router.post("", response_model=OrderDetailOut, status_code=status.HTTP_201_CREATED)
def create_order(
    body: OrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> Order:
    return orders_handlers.create_order(db, current, body, idempotency_key=idempotency_key)


@router.get("/{order_id}", response_model=OrderDetailOut)
def get_order(
    order_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Order:
    return orders_handlers.get_order(db, current, order_id)


@router.patch("/{order_id}/status", response_model=OrderDetailOut)
def patch_order_status(
    order_id: UUID,
    body: OrderStatusPatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Order:
    return orders_handlers.patch_order_status(db, current, order_id, body)
