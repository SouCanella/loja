"""Contagens de pedidos por cliente registado (IP-06)."""

from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.models.user import User
from app.schemas.customer_insights import CustomerOrderStatOut, CustomerOrderStatsOut


def customer_order_stats_for_store(
    db: Session,
    current: User,
    *,
    date_from: date,
    date_to: date,
) -> CustomerOrderStatsOut:
    start = datetime.combine(date_from, time.min, tzinfo=UTC)
    end_excl = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)

    q = (
        select(
            Customer.id,
            Customer.email,
            func.count(Order.id),
            func.max(Order.created_at),
        )
        .select_from(Order)
        .join(Customer, Order.customer_id == Customer.id)
        .where(
            Order.store_id == current.store_id,
            Order.customer_id.isnot(None),
            Order.created_at >= start,
            Order.created_at < end_excl,
        )
        .group_by(Customer.id, Customer.email)
        .order_by(func.count(Order.id).desc())
        .limit(100)
    )
    rows = db.execute(q).all()
    stats = [
        CustomerOrderStatOut(
            customer_id=r[0],
            email=r[1],
            order_count=int(r[2]),
            last_order_at=r[3],
        )
        for r in rows
    ]
    return CustomerOrderStatsOut(stats=stats)
