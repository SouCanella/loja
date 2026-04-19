"""Agregados para o dashboard do painel (paridade relatório financeiro)."""

from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import OrderStatus
from app.models.inventory import InventoryBatch, InventoryItem
from app.models.order import Order, OrderItem
from app.schemas.dashboard import (
    DashboardKpisOut,
    DashboardRevenueDayOut,
    DashboardStatusCountOut,
    DashboardSummaryOut,
)
from app.services.financial_report import report_datetime_bounds

# Mesmos pedidos excluídos que o relatório financeiro
_EXCLUDED = (OrderStatus.rascunho, OrderStatus.cancelado)


def _coerce_date(d_raw: object) -> date:
    if isinstance(d_raw, datetime):
        return d_raw.date()
    if isinstance(d_raw, date):
        return d_raw
    if isinstance(d_raw, str):
        return date.fromisoformat(d_raw[:10])
    raise TypeError(f"Data inesperada: {type(d_raw)!r}")

_MAX_RANGE_DAYS = 366


def _moving_avg_7(values: list[Decimal]) -> list[Decimal]:
    out: list[Decimal] = []
    for i in range(len(values)):
        start = max(0, i - 6)
        window = values[start : i + 1]
        out.append(sum(window) / Decimal(len(window)))
    return out


def compute_dashboard_summary(
    db: Session,
    store_id: UUID,
    date_from: date,
    date_to: date,
) -> DashboardSummaryOut:
    if date_from > date_to:
        raise ValueError("date_from não pode ser posterior a date_to")
    if (date_to - date_from).days + 1 > _MAX_RANGE_DAYS:
        raise ValueError(f"Período máximo de {_MAX_RANGE_DAYS} dias")

    start, end = report_datetime_bounds(date_from, date_to)

    # — Pedidos no período (elegíveis) —
    base_order_filters = (
        Order.store_id == store_id,
        Order.status.notin_(_EXCLUDED),
        Order.created_at >= start,
        Order.created_at < end,
    )

    orders_in_period = int(
        db.scalar(select(func.count(Order.id)).select_from(Order).where(*base_order_filters)) or 0
    )

    revenue_raw = db.scalar(
        select(func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0))
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(*base_order_filters)
    )
    revenue_total = Decimal(str(revenue_raw or 0))
    ticket_avg: Decimal | None = None
    if orders_in_period > 0:
        ticket_avg = (revenue_total / Decimal(orders_in_period)).quantize(Decimal("0.01"))

    # — Pedidos hoje (UTC) —
    today_utc = datetime.now(UTC).date()
    today_start = datetime.combine(today_utc, time.min, tzinfo=UTC)
    today_end = today_start + timedelta(days=1)
    orders_today = int(
        db.scalar(
            select(func.count(Order.id))
            .select_from(Order)
            .where(
                Order.store_id == store_id,
                Order.status.notin_(_EXCLUDED),
                Order.created_at >= today_start,
                Order.created_at < today_end,
            )
        )
        or 0
    )

    # — Receita por dia (UTC) —
    day_rows = db.execute(
        select(
            func.date(Order.created_at).label("d"),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0),
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(*base_order_filters)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    ).all()

    # Preencher todos os dias do intervalo com 0 onde não há pedido
    day_map: dict[date, Decimal] = {}
    for row in day_rows:
        d = _coerce_date(row[0])
        day_map[d] = Decimal(str(row[1]))

    cursor = date_from
    revenue_by_day: list[DashboardRevenueDayOut] = []
    rev_series: list[Decimal] = []
    while cursor <= date_to:
        v = day_map.get(cursor, Decimal("0"))
        revenue_by_day.append(DashboardRevenueDayOut(date=cursor, revenue=v))
        rev_series.append(v)
        cursor += timedelta(days=1)

    ma_vals = _moving_avg_7(rev_series)
    revenue_moving_avg_7d = [
        DashboardRevenueDayOut(date=revenue_by_day[i].date, revenue=ma_vals[i])
        for i in range(len(revenue_by_day))
    ]

    # — Pedidos por status no período —
    status_rows = db.execute(
        select(Order.status, func.count(Order.id))
        .select_from(Order)
        .where(*base_order_filters)
        .group_by(Order.status)
    ).all()
    orders_by_status = [
        DashboardStatusCountOut(status=str(r[0].value), count=int(r[1])) for r in status_rows
    ]
    orders_by_status.sort(key=lambda x: x.status)

    # — Insumos em ruptura (soma lotes ≤ 0) —
    qty_rows = db.execute(
        select(
            InventoryItem.id,
            func.coalesce(func.sum(InventoryBatch.quantity_available), 0),
        )
        .select_from(InventoryItem)
        .outerjoin(InventoryBatch, InventoryBatch.item_id == InventoryItem.id)
        .where(InventoryItem.store_id == store_id)
        .group_by(InventoryItem.id)
    ).all()
    out_of_stock = sum(1 for _i, q in qty_rows if Decimal(str(q)) <= 0)

    kpis = DashboardKpisOut(
        orders_today=orders_today,
        orders_in_period=orders_in_period,
        ticket_avg=ticket_avg,
        out_of_stock_items_count=out_of_stock,
        new_customers_in_period=None,
    )

    return DashboardSummaryOut(
        date_from=date_from,
        date_to=date_to,
        kpis=kpis,
        revenue_by_day=revenue_by_day,
        revenue_moving_avg_7d=revenue_moving_avg_7d,
        orders_by_status=orders_by_status,
    )
