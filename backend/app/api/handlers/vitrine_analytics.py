"""Ingestão e agregação de eventos da vitrine."""

from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.handlers import public_catalog as public_handlers
from app.core.config import get_settings
from app.core.public_order_rate_limit import register_public_order_attempt
from app.models.product import Product
from app.models.user import User
from app.models.vitrine_analytics_event import VitrineAnalyticsEvent
from app.schemas.vitrine_analytics import (
    TopProductViewRow,
    VitrineAnalyticsBatchIn,
    VitrineAnalyticsSummaryOut,
)


def _range_utc(d0: date, d1: date) -> tuple[datetime, datetime]:
    start = datetime.combine(d0, time.min, tzinfo=UTC)
    end_excl = datetime.combine(d1 + timedelta(days=1), time.min, tzinfo=UTC)
    return start, end_excl


def ingest_public_events(
    db: Session,
    store_slug: str,
    body: VitrineAnalyticsBatchIn,
    *,
    client_ip: str,
    country_code: str | None,
) -> int:
    store = public_handlers.get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")

    settings = get_settings()
    rate_key = f"analytics|{client_ip}|{store.id}"
    register_public_order_attempt(
        rate_key,
        max_attempts=settings.public_analytics_rate_limit_max_attempts,
        window_seconds=settings.public_analytics_rate_limit_window_seconds,
    )

    now = datetime.now(UTC)
    accepted = 0
    for ev in body.events:
        if ev.product_id is not None:
            row = db.scalars(
                select(Product).where(Product.id == ev.product_id, Product.store_id == store.id)
            ).first()
            if row is None:
                continue
        oc = ev.occurred_at if ev.occurred_at is not None else now
        if oc.tzinfo is None:
            oc = oc.replace(tzinfo=UTC)
        e = VitrineAnalyticsEvent(
            store_id=store.id,
            event_type=ev.event_type,
            path=ev.path,
            product_id=ev.product_id,
            session_id=ev.session_id,
            country_code=country_code,
            meta=None,
            occurred_at=oc,
        )
        db.add(e)
        accepted += 1
    db.commit()
    return accepted


def get_vitrine_summary_for_store(
    db: Session,
    current: User,
    *,
    date_from: date,
    date_to: date,
) -> VitrineAnalyticsSummaryOut:
    if date_to < date_from:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_to deve ser >= date_from",
        )
    span = (date_to - date_from).days
    if span > 366:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Intervalo máximo 366 dias.",
        )

    start, end_excl = _range_utc(date_from, date_to)
    sid = current.store_id

    distinct_sessions = db.scalar(
        select(func.count(func.distinct(VitrineAnalyticsEvent.session_id))).where(
            VitrineAnalyticsEvent.store_id == sid,
            VitrineAnalyticsEvent.occurred_at >= start,
            VitrineAnalyticsEvent.occurred_at < end_excl,
        )
    )
    distinct_sessions = int(distinct_sessions or 0)

    by_type_rows = db.execute(
        select(VitrineAnalyticsEvent.event_type, func.count())
        .where(
            VitrineAnalyticsEvent.store_id == sid,
            VitrineAnalyticsEvent.occurred_at >= start,
            VitrineAnalyticsEvent.occurred_at < end_excl,
        )
        .group_by(VitrineAnalyticsEvent.event_type)
    ).all()
    events_by_type = {str(r[0]): int(r[1]) for r in by_type_rows}

    top_q = (
        select(
            VitrineAnalyticsEvent.product_id,
            Product.name,
            func.count().label("c"),
        )
        .join(Product, Product.id == VitrineAnalyticsEvent.product_id)
        .where(
            VitrineAnalyticsEvent.store_id == sid,
            VitrineAnalyticsEvent.event_type == "product_view",
            VitrineAnalyticsEvent.occurred_at >= start,
            VitrineAnalyticsEvent.occurred_at < end_excl,
        )
        .group_by(VitrineAnalyticsEvent.product_id, Product.name)
        .order_by(func.count().desc())
        .limit(15)
    )
    top_rows = db.execute(top_q).all()
    top_products: list[TopProductViewRow] = []
    for r in top_rows:
        top_products.append(
            TopProductViewRow(product_id=UUID(str(r[0])), name=str(r[1]), views=int(r[2])),
        )

    return VitrineAnalyticsSummaryOut(
        date_from=date_from,
        date_to=date_to,
        distinct_sessions=distinct_sessions,
        events_by_type=events_by_type,
        top_products_by_view=top_products,
    )
