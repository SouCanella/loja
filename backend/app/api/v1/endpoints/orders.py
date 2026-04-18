"""Pedidos (DEC-14, stock DEC-17)."""

from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.product import Product
from app.models.user import User
from app.schemas.orders import OrderCreate, OrderDetailOut, OrderOut, OrderStatusPatch
from app.services.order_flow import apply_status_change
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

router = APIRouter(tags=["orders"])


@router.get("", response_model=list[OrderOut])
def list_orders(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> list[Order]:
    q = (
        select(Order)
        .where(Order.store_id == current.store_id)
        .order_by(Order.created_at.desc())
    )
    return list(db.scalars(q))


@router.post("", response_model=OrderDetailOut, status_code=status.HTTP_201_CREATED)
def create_order(
    body: OrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> Order:
    if idempotency_key:
        key = idempotency_key.strip()
        existing = db.scalars(
            select(Order).where(
                Order.store_id == current.store_id,
                Order.idempotency_key == key,
            )
        ).first()
        if existing:
            return _load_order_detail(db, existing.id, current.store_id)
    else:
        key = None

    order = Order(
        store_id=current.store_id,
        status=OrderStatus.rascunho,
        customer_note=body.customer_note,
        idempotency_key=key,
        stock_committed=False,
    )
    for line in body.items:
        p = db.get(Product, line.product_id)
        if p is None or p.store_id != current.store_id or not p.active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Produto inválido")
        order.items.append(
            OrderItem(
                product_id=p.id,
                quantity=line.quantity,
                unit_price=p.price,
            )
        )
    db.add(order)
    db.flush()
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=None,
            to_status=OrderStatus.rascunho.value,
            user_id=current.id,
        )
    )
    db.commit()
    db.refresh(order)
    return _load_order_detail(db, order.id, current.store_id)


def _load_order_detail(db: Session, order_id: UUID, store_id: UUID) -> Order:
    o = db.scalars(
        select(Order)
        .where(Order.id == order_id, Order.store_id == store_id)
        .options(selectinload(Order.items))
    ).first()
    if o is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido não encontrado")
    return o


@router.get("/{order_id}", response_model=OrderDetailOut)
def get_order(
    order_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Order:
    return _load_order_detail(db, order_id, current.store_id)


@router.patch("/{order_id}/status", response_model=OrderDetailOut)
def patch_order_status(
    order_id: UUID,
    body: OrderStatusPatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Order:
    order = _load_order_detail(db, order_id, current.store_id)
    old = order.status
    new = body.status
    try:
        apply_status_change(
            db,
            order,
            old,
            new,
            store_id=current.store_id,
            user_id=current.id,
        )
        db.commit()
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    db.refresh(order)
    return _load_order_detail(db, order.id, current.store_id)
