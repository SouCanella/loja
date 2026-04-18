"""Relatório financeiro mínimo (Fase 3)."""

from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal
from typing import Annotated

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.enums import OrderStatus
from app.models.order import Order, OrderItem
from app.models.production_run import ProductionRun
from app.models.user import User
from app.schemas.phase3 import FinancialReportOut
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

router = APIRouter(tags=["reports"])


@router.get("/financial", response_model=FinancialReportOut)
def get_financial_report(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> FinancialReportOut:
    today = datetime.now(UTC).date()
    d0 = date_from or (today - timedelta(days=30))
    d1 = date_to or today
    start = datetime.combine(d0, time.min, tzinfo=UTC)
    end = datetime.combine(d1 + timedelta(days=1), time.min, tzinfo=UTC)

    excluded = (OrderStatus.rascunho, OrderStatus.cancelado)

    revenue_raw = db.scalar(
        select(func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0))
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.store_id == current.store_id,
            Order.status.notin_(excluded),
            Order.created_at >= start,
            Order.created_at < end,
        )
    )
    orders_count = db.scalar(
        select(func.count(Order.id))
        .select_from(Order)
        .where(
            Order.store_id == current.store_id,
            Order.status.notin_(excluded),
            Order.created_at >= start,
            Order.created_at < end,
        )
    )
    prod_count = db.scalar(
        select(func.count(ProductionRun.id)).where(
            ProductionRun.store_id == current.store_id,
            ProductionRun.created_at >= start,
            ProductionRun.created_at < end,
        )
    )
    prod_cost = db.scalar(
        select(func.coalesce(func.sum(ProductionRun.total_input_cost), 0)).where(
            ProductionRun.store_id == current.store_id,
            ProductionRun.created_at >= start,
            ProductionRun.created_at < end,
        )
    )

    return FinancialReportOut(
        date_from=d0,
        date_to=d1,
        orders_revenue=Decimal(str(revenue_raw or 0)),
        orders_count=int(orders_count or 0),
        production_runs_count=int(prod_count or 0),
        production_input_cost=Decimal(str(prod_cost or 0)),
    )
