"""Consultas de pedidos (partilhadas v1/v2)."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order


def list_orders_for_store(db: Session, store_id: UUID) -> list[Order]:
    q = (
        select(Order)
        .where(Order.store_id == store_id)
        .order_by(Order.created_at.desc())
    )
    return list(db.scalars(q))
