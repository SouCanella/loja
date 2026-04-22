"""Exportação CSV de segmentos de clientes (IP-06)."""

import csv
from datetime import UTC, date, datetime, time, timedelta
from io import StringIO
from typing import Literal

from sqlalchemy import exists, func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.models.user import User
from app.services.customer_contact import contact_display_label

Segment = Literal["inactive", "buyers_all", "buyers_repeat", "buyers_single"]

ALLOWED_SEGMENTS: frozenset[str] = frozenset(
    {"inactive", "buyers_all", "buyers_repeat", "buyers_single"}
)


def _period_bounds(date_from: date, date_to: date) -> tuple[datetime, datetime]:
    start = datetime.combine(date_from, time.min, tzinfo=UTC)
    end_excl = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)
    return start, end_excl


def build_customer_segment_csv(
    db: Session,
    current: User,
    *,
    date_from: date,
    date_to: date,
    segment: str,
) -> str:
    if segment not in ALLOWED_SEGMENTS:
        raise ValueError(f"segmento inválido: {segment}")
    start, end_excl = _period_bounds(date_from, date_to)
    buf = StringIO()
    w = csv.writer(buf)
    w.writerow(["contacto", "customer_id", "segmento", "pedidos_no_periodo", "ultimo_pedido_em"])

    if segment == "inactive":
        has_order_in_period = exists(
            select(1).where(
                Order.customer_id == Customer.id,
                Order.store_id == current.store_id,
                Order.customer_id.isnot(None),
                Order.created_at >= start,
                Order.created_at < end_excl,
            )
        )
        q = (
            select(Customer.id, Customer.email, Customer.contact_name, Customer.phone)
            .where(Customer.store_id == current.store_id, ~has_order_in_period)
            .order_by(Customer.created_at.desc())
        )
        for cid, em, cn, ph in db.execute(q).all():
            label = contact_display_label(
                customer_id=cid, email=em, contact_name=cn, phone=ph
            )
            w.writerow([label, str(cid), "sem_pedidos_no_periodo", "0", ""])
        return buf.getvalue()

    base = (
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
    )
    if segment == "buyers_repeat":
        base = base.having(func.count(Order.id) >= 2)
    elif segment == "buyers_single":
        base = base.having(func.count(Order.id) == 1)
    # buyers_all: no having
    base = base.order_by(func.count(Order.id).desc(), Customer.id)
    rows = db.execute(base).all()
    for cid, em, cn, ph, cnt, last_at in rows:
        label = contact_display_label(
            customer_id=cid, email=em, contact_name=cn, phone=ph
        )
        seg_label = {
            "buyers_all": "com_pedidos",
            "buyers_repeat": "recompra",
            "buyers_single": "uma_compra",
        }[segment]
        last_s = last_at.isoformat() if last_at else ""
        w.writerow([label, str(cid), seg_label, str(int(cnt)), last_s])
    return buf.getvalue()
