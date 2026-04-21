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

    registered_total = db.scalar(
        select(func.count()).select_from(Customer).where(Customer.store_id == current.store_id)
    )
    registered_total = int(registered_total or 0)

    with_orders = db.scalar(
        select(func.count(func.distinct(Order.customer_id))).where(
            Order.store_id == current.store_id,
            Order.customer_id.isnot(None),
            Order.created_at >= start,
            Order.created_at < end_excl,
        )
    )
    with_orders = int(with_orders or 0)

    without_orders = max(0, registered_total - with_orders)

    return CustomerOrderStatsOut(
        stats=stats,
        registered_accounts_count=registered_total,
        accounts_with_orders_in_period=with_orders,
        accounts_without_orders_in_period=without_orders,
    )
