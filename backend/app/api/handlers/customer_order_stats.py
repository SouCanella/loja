"""Contagens de pedidos por cliente registado (IP-06)."""

from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.models.user import User
from app.schemas.customer_insights import CustomerOrderStatOut, CustomerOrderStatsOut
from app.services.customer_contact import contact_display_label


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
            Customer.contact_name,
            Customer.phone,
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
        .group_by(Customer.id, Customer.email, Customer.contact_name, Customer.phone)
        .order_by(func.count(Order.id).desc())
        .limit(100)
    )
    rows = db.execute(q).all()
    stats = [
        CustomerOrderStatOut(
            customer_id=r[0],
            display_label=contact_display_label(
                customer_id=r[0], email=r[1], contact_name=r[2], phone=r[3]
            ),
            email=r[1],
            order_count=int(r[4]),
            last_order_at=r[5],
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

    total_orders_with_account = db.scalar(
        select(func.count(Order.id)).where(
            Order.store_id == current.store_id,
            Order.customer_id.isnot(None),
            Order.created_at >= start,
            Order.created_at < end_excl,
        )
    )
    total_orders_with_account = int(total_orders_with_account or 0)

    repeat_sq = (
        select(Order.customer_id)
        .where(
            Order.store_id == current.store_id,
            Order.customer_id.isnot(None),
            Order.created_at >= start,
            Order.created_at < end_excl,
        )
        .group_by(Order.customer_id)
        .having(func.count(Order.id) >= 2)
        .subquery()
    )
    repeat_buyers = db.scalar(select(func.count()).select_from(repeat_sq))
    repeat_buyers = int(repeat_buyers or 0)

    single_purchase_buyers = max(0, with_orders - repeat_buyers)

    avg_orders_per_buyer: float | None = None
    if with_orders > 0:
        avg_orders_per_buyer = round(total_orders_with_account / with_orders, 4)

    recompra_rate_pct: float | None = None
    if with_orders > 0:
        recompra_rate_pct = round(100.0 * repeat_buyers / with_orders, 4)

    gap_inner = (
        select(
            (
                func.extract("epoch", func.max(Order.created_at) - func.min(Order.created_at))
                / func.nullif(func.count(Order.id) - 1, 0)
                / 86400.0
            ).label("gap_days")
        )
        .where(
            Order.store_id == current.store_id,
            Order.customer_id.isnot(None),
            Order.created_at >= start,
            Order.created_at < end_excl,
        )
        .group_by(Order.customer_id)
        .having(func.count(Order.id) >= 2)
        .subquery()
    )
    avg_days_between_orders_repeat_buyers = db.scalar(select(func.avg(gap_inner.c.gap_days)))
    if avg_days_between_orders_repeat_buyers is not None:
        avg_days_between_orders_repeat_buyers = round(
            float(avg_days_between_orders_repeat_buyers), 4
        )
    else:
        avg_days_between_orders_repeat_buyers = None

    return CustomerOrderStatsOut(
        stats=stats,
        registered_accounts_count=registered_total,
        accounts_with_orders_in_period=with_orders,
        accounts_without_orders_in_period=without_orders,
        total_orders_with_account_in_period=total_orders_with_account,
        repeat_buyers_count=repeat_buyers,
        single_purchase_buyers_count=single_purchase_buyers,
        avg_orders_per_buyer=avg_orders_per_buyer,
        recompra_rate_pct=recompra_rate_pct,
        avg_days_between_orders_repeat_buyers=avg_days_between_orders_repeat_buyers,
    )
