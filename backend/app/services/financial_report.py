"""Agregações do relatório financeiro (pedidos + produção por período)."""

from datetime import UTC, date, datetime, time, timedelta
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.enums import ORDER_STATUS_SEQUENCE, OrderStatus
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.production_run import ProductionRun
from app.models.recipe import Recipe
from app.schemas.phase3 import (
    FinancialReportCategoryRow,
    FinancialReportOut,
    FinancialReportProductRow,
    FinancialReportStatusRow,
)

_PCT_Q = Decimal("0.01")


def _qpct(value: Decimal | None) -> Decimal | None:
    if value is None:
        return None
    return value.quantize(_PCT_Q, rounding=ROUND_HALF_UP)


def report_datetime_bounds(date_from: date, date_to: date) -> tuple[datetime, datetime]:
    start = datetime.combine(date_from, time.min, tzinfo=UTC)
    end = datetime.combine(date_to + timedelta(days=1), time.min, tzinfo=UTC)
    return start, end


def compute_financial_report(
    db: Session,
    store_id: UUID,
    date_from: date,
    date_to: date,
) -> FinancialReportOut:
    start, end = report_datetime_bounds(date_from, date_to)
    excluded = (OrderStatus.rascunho, OrderStatus.cancelado)

    revenue_raw = db.scalar(
        select(func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0))
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.store_id == store_id,
            Order.status.notin_(excluded),
            Order.created_at >= start,
            Order.created_at < end,
        )
    )
    orders_count = db.scalar(
        select(func.count(Order.id))
        .select_from(Order)
        .where(
            Order.store_id == store_id,
            Order.status.notin_(excluded),
            Order.created_at >= start,
            Order.created_at < end,
        )
    )
    prod_count = db.scalar(
        select(func.count(ProductionRun.id)).where(
            ProductionRun.store_id == store_id,
            ProductionRun.created_at >= start,
            ProductionRun.created_at < end,
        )
    )
    prod_cost = db.scalar(
        select(func.coalesce(func.sum(ProductionRun.total_input_cost), 0)).where(
            ProductionRun.store_id == store_id,
            ProductionRun.created_at >= start,
            ProductionRun.created_at < end,
        )
    )

    orders_revenue = Decimal(str(revenue_raw or 0))
    production_input_cost = Decimal(str(prod_cost or 0))

    sales_rows = db.execute(
        select(
            OrderItem.product_id,
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0),
            func.coalesce(func.sum(OrderItem.quantity), 0),
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.store_id == store_id,
            Order.status.notin_(excluded),
            Order.created_at >= start,
            Order.created_at < end,
        )
        .group_by(OrderItem.product_id)
    ).all()

    prod_cost_rows = db.execute(
        select(
            Recipe.product_id,
            func.coalesce(func.sum(ProductionRun.total_input_cost), 0),
        )
        .select_from(ProductionRun)
        .join(Recipe, ProductionRun.recipe_id == Recipe.id)
        .where(
            ProductionRun.store_id == store_id,
            ProductionRun.created_at >= start,
            ProductionRun.created_at < end,
        )
        .group_by(Recipe.product_id)
    ).all()

    sales_map: dict[UUID, tuple[Decimal, Decimal]] = {
        r[0]: (Decimal(str(r[1])), Decimal(str(r[2]))) for r in sales_rows
    }
    cost_map: dict[UUID, Decimal] = {r[0]: Decimal(str(r[1])) for r in prod_cost_rows}
    all_ids = set(sales_map.keys()) | set(cost_map.keys())

    by_product: list[FinancialReportProductRow] = []
    if all_ids:
        name_rows = db.execute(
            select(Product.id, Product.name).where(
                Product.store_id == store_id,
                Product.id.in_(all_ids),
            )
        ).all()
        names = {row[0]: row[1] for row in name_rows}

        for pid in all_ids:
            rev, qty_sold = sales_map.get(pid, (Decimal("0"), Decimal("0")))
            run_cost = cost_map.get(pid, Decimal("0"))
            margin = rev - run_cost
            margin_pct: Decimal | None = None
            if rev > 0:
                margin_pct = _qpct((margin / rev) * Decimal("100"))
            by_product.append(
                FinancialReportProductRow(
                    product_id=pid,
                    product_name=names.get(pid, pid.hex[:8]),
                    orders_revenue=rev,
                    quantity_sold=qty_sold,
                    production_input_cost=run_cost,
                    margin_amount=margin,
                    margin_percent=margin_pct,
                )
            )
        by_product.sort(key=lambda r: r.orders_revenue, reverse=True)

    period_margin_estimate = orders_revenue - production_input_cost
    period_margin_pct: Decimal | None = None
    if orders_revenue > 0:
        period_margin_pct = _qpct((period_margin_estimate / orders_revenue) * Decimal("100"))

    sales_cat_rows = db.execute(
        select(
            Product.category_id,
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0),
            func.coalesce(func.sum(OrderItem.quantity), 0),
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .where(
            Order.store_id == store_id,
            Order.status.notin_(excluded),
            Order.created_at >= start,
            Order.created_at < end,
        )
        .group_by(Product.category_id)
    ).all()

    prod_cost_cat_rows = db.execute(
        select(
            Product.category_id,
            func.coalesce(func.sum(ProductionRun.total_input_cost), 0),
        )
        .select_from(ProductionRun)
        .join(Recipe, ProductionRun.recipe_id == Recipe.id)
        .join(Product, Recipe.product_id == Product.id)
        .where(
            ProductionRun.store_id == store_id,
            ProductionRun.created_at >= start,
            ProductionRun.created_at < end,
        )
        .group_by(Product.category_id)
    ).all()

    sales_cat_map: dict[UUID | None, tuple[Decimal, Decimal]] = {
        r[0]: (Decimal(str(r[1])), Decimal(str(r[2]))) for r in sales_cat_rows
    }
    cost_cat_map: dict[UUID | None, Decimal] = {
        r[0]: Decimal(str(r[1])) for r in prod_cost_cat_rows
    }
    cat_ids = set(sales_cat_map.keys()) | set(cost_cat_map.keys())

    by_category: list[FinancialReportCategoryRow] = []
    if cat_ids:
        named: dict[UUID, str] = {}
        non_null = {c for c in cat_ids if c is not None}
        if non_null:
            cr = db.execute(
                select(Category.id, Category.name).where(
                    Category.store_id == store_id,
                    Category.id.in_(non_null),
                )
            ).all()
            named = {row[0]: row[1] for row in cr}

        for cid in cat_ids:
            rev, qty_sold = sales_cat_map.get(cid, (Decimal("0"), Decimal("0")))
            run_cost = cost_cat_map.get(cid, Decimal("0"))
            margin = rev - run_cost
            margin_pct: Decimal | None = None
            if rev > 0:
                margin_pct = _qpct((margin / rev) * Decimal("100"))
            label = named[cid] if cid is not None else "Sem categoria"
            by_category.append(
                FinancialReportCategoryRow(
                    category_id=cid,
                    category_name=label,
                    orders_revenue=rev,
                    quantity_sold=qty_sold,
                    production_input_cost=run_cost,
                    margin_amount=margin,
                    margin_percent=margin_pct,
                )
            )
        by_category.sort(key=lambda r: r.orders_revenue, reverse=True)

    status_rows = db.execute(
        select(
            Order.status,
            func.count(func.distinct(Order.id)),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0),
        )
        .select_from(OrderItem)
        .join(Order, OrderItem.order_id == Order.id)
        .where(
            Order.store_id == store_id,
            Order.status.notin_(excluded),
            Order.created_at >= start,
            Order.created_at < end,
        )
        .group_by(Order.status)
    ).all()

    def _status_order(st: OrderStatus) -> int:
        try:
            return ORDER_STATUS_SEQUENCE.index(st)
        except ValueError:
            return 999

    by_order_status: list[FinancialReportStatusRow] = []
    for st, cnt, rev in status_rows:
        by_order_status.append(
            FinancialReportStatusRow(
                status=st.value,
                orders_count=int(cnt or 0),
                orders_revenue=Decimal(str(rev or 0)),
            )
        )
    by_order_status.sort(key=lambda r: _status_order(OrderStatus(r.status)))

    return FinancialReportOut(
        date_from=date_from,
        date_to=date_to,
        orders_revenue=orders_revenue,
        orders_count=int(orders_count or 0),
        production_runs_count=int(prod_count or 0),
        production_input_cost=production_input_cost,
        period_margin_estimate=period_margin_estimate,
        period_margin_percent=period_margin_pct,
        by_product=by_product,
        by_category=by_category,
        by_order_status=by_order_status,
    )
