"""Pedidos — envelope DEC-06."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import order_print as order_print_handlers
from app.api.handlers import orders as orders_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import OrderDetailEnvelope, OrderListEnvelope, OrderPrintEnvelope
from app.schemas.orders import OrderCreate, OrderDetailOut, OrderOut, OrderStatusPatch

router = APIRouter(tags=["orders-v2"])


@router.get("/orders", response_model=OrderListEnvelope)
def list_orders_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> OrderListEnvelope:
    rows = orders_handlers.list_orders(db, current)
    data = [OrderOut.model_validate(r) for r in rows]
    return OrderListEnvelope(success=True, data=data, errors=None)


@router.post("/orders", response_model=OrderDetailEnvelope, status_code=status.HTTP_201_CREATED)
def create_order_v2(
    body: OrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> OrderDetailEnvelope:
    o = orders_handlers.create_order(db, current, body, idempotency_key=idempotency_key)
    return OrderDetailEnvelope(success=True, data=OrderDetailOut.model_validate(o), errors=None)


@router.get("/orders/{order_id}/print", response_model=OrderPrintEnvelope)
def get_order_print_v2(
    order_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> OrderPrintEnvelope:
    data = order_print_handlers.get_order_print_for_store(db, current, order_id)
    return OrderPrintEnvelope(success=True, data=data, errors=None)


@router.get("/orders/{order_id}", response_model=OrderDetailEnvelope)
def get_order_v2(
    order_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> OrderDetailEnvelope:
    o = orders_handlers.get_order(db, current, order_id)
    return OrderDetailEnvelope(success=True, data=OrderDetailOut.model_validate(o), errors=None)


@router.patch("/orders/{order_id}/status", response_model=OrderDetailEnvelope)
def patch_order_status_v2(
    order_id: UUID,
    body: OrderStatusPatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> OrderDetailEnvelope:
    o = orders_handlers.patch_order_status(db, current, order_id, body)
    return OrderDetailEnvelope(success=True, data=OrderDetailOut.model_validate(o), errors=None)
