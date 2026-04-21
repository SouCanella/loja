"""Pedidos — lógica partilhada v1/v2."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.user import User
from app.schemas.orders import OrderCreate, OrderStatusPatch
from app.services.order_flow import apply_status_change
from app.services.order_line_items import get_product_for_order_line
from app.services.order_queries import list_orders_for_store


def list_orders(db: Session, current: User) -> list[Order]:
    return list_orders_for_store(db, current.store_id)


def load_order_detail(db: Session, order_id: UUID, store_id: UUID) -> Order:
    o = db.scalars(
        select(Order)
        .where(Order.id == order_id, Order.store_id == store_id)
        .options(selectinload(Order.items))
    ).first()
    if o is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pedido não encontrado")
    return o


def create_order(
    db: Session,
    current: User,
    body: OrderCreate,
    *,
    idempotency_key: str | None,
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
            return load_order_detail(db, existing.id, current.store_id)
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
        p = get_product_for_order_line(
            db,
            product_id=line.product_id,
            store_id=current.store_id,
            reject_catalog_unavailable=False,
        )
        note = line.line_note.strip() if line.line_note else None
        order.items.append(
            OrderItem(
                product_id=p.id,
                quantity=line.quantity,
                unit_price=p.price,
                line_note=note,
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
    return load_order_detail(db, order.id, current.store_id)


def get_order(db: Session, current: User, order_id: UUID) -> Order:
    return load_order_detail(db, order_id, current.store_id)


def patch_order_status(db: Session, current: User, order_id: UUID, body: OrderStatusPatch) -> Order:
    order = load_order_detail(db, order_id, current.store_id)
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
    return load_order_detail(db, order.id, current.store_id)
