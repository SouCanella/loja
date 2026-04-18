"""Transições de pedido (DEC-14, RN-058) e integração com stock."""

from uuid import UUID

from sqlalchemy.orm import Session

from app.models.enums import ORDER_STATUS_SEQUENCE, OrderStatus, order_status_index
from app.models.order import Order, OrderStatusHistory
from app.services.stock import allocate_stock_for_order, release_stock_for_order

CONFIRMADO_INDEX = ORDER_STATUS_SEQUENCE.index(OrderStatus.confirmado)
TERMINAL_STATUSES = frozenset({OrderStatus.entregue, OrderStatus.cancelado})


def is_transition_allowed_mvp(old: OrderStatus, new: OrderStatus) -> bool:
    """MVP: estados terminais não regressam a operacionais (RN-058)."""
    if old == new:
        return True
    if old in TERMINAL_STATUSES:
        return False
    return True


def needs_stock_commit(old: OrderStatus, new: OrderStatus) -> bool:
    """Primeira entrada em confirmado ou estado posterior (RN-071)."""
    if new == OrderStatus.cancelado:
        return False
    ni = order_status_index(new)
    oi = order_status_index(old)
    if ni is None or ni < CONFIRMADO_INDEX:
        return False
    if oi is None:
        return False
    return oi < CONFIRMADO_INDEX


def apply_status_change(
    db: Session,
    order: Order,
    old: OrderStatus,
    new: OrderStatus,
    *,
    store_id: UUID,
    user_id: UUID | None,
) -> None:
    if not is_transition_allowed_mvp(old, new):
        raise ValueError("transição não permitida")

    if new == OrderStatus.cancelado and order.stock_committed:
        release_stock_for_order(db, order, store_id)

    if needs_stock_commit(old, new):
        allocate_stock_for_order(db, order, store_id)

    order.status = new
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=old.value,
            to_status=new.value,
            user_id=user_id,
        )
    )
