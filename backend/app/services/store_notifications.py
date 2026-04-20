"""Notificações por loja (painel)."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.store_notification import StoreNotification
from app.models.user import User


def _order_ref_code(order_id: UUID) -> str:
    return str(order_id).replace("-", "")[:8].upper()


def add_new_vitrine_order_notification(db: Session, order: Order) -> None:
    ref = _order_ref_code(order.id)
    n = StoreNotification(
        store_id=order.store_id,
        kind="new_order_vitrine",
        order_id=order.id,
        title=f"Novo pedido na vitrine (#{ref})",
        body=None,
    )
    db.add(n)


def list_inbox(
    db: Session,
    store_id: UUID,
    *,
    limit: int = 50,
) -> tuple[list[StoreNotification], int]:
    limit = min(max(limit, 1), 100)
    rows = list(
        db.scalars(
            select(StoreNotification)
            .where(StoreNotification.store_id == store_id)
            .order_by(StoreNotification.created_at.desc())
            .limit(limit)
        ).all()
    )
    unread = db.scalar(
        select(func.count())
        .select_from(StoreNotification)
        .where(StoreNotification.store_id == store_id, StoreNotification.read_at.is_(None))
    )
    return rows, int(unread or 0)


def mark_read(db: Session, current: User, notification_ids: list[UUID]) -> int:
    now = datetime.now(UTC)
    count = 0
    for nid in notification_ids:
        n = db.get(StoreNotification, nid)
        if n is None or n.store_id != current.store_id:
            continue
        if n.read_at is None:
            n.read_at = now
            count += 1
    db.commit()
    return count


def mark_all_read(db: Session, current: User) -> int:
    now = datetime.now(UTC)
    rows = db.scalars(
        select(StoreNotification).where(
            StoreNotification.store_id == current.store_id,
            StoreNotification.read_at.is_(None),
        )
    ).all()
    for n in rows:
        n.read_at = now
    db.commit()
    return len(rows)
