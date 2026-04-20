"""Ingestão pública de eventos de analytics da vitrine."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.handlers import vitrine_analytics as analytics_handlers
from app.db.session import get_db
from app.schemas.envelope import VitrineAnalyticsIngestEnvelope
from app.schemas.vitrine_analytics import VitrineAnalyticsBatchIn, VitrineAnalyticsIngestOut

router = APIRouter(prefix="/public/stores", tags=["public-analytics-v2"])


def _country_from_request(request: Request) -> str | None:
    raw = request.headers.get("cf-ipcountry") or request.headers.get("x-country-code")
    if raw and len(raw.strip()) == 2:
        return raw.strip().upper()
    return None


@router.post(
    "/{store_slug}/analytics/events",
    response_model=VitrineAnalyticsIngestEnvelope,
    status_code=status.HTTP_200_OK,
)
def post_vitrine_analytics_events_v2(
    store_slug: str,
    body: VitrineAnalyticsBatchIn,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
) -> VitrineAnalyticsIngestEnvelope:
    ip = request.client.host if request.client else "unknown"
    cc = _country_from_request(request)
    n = analytics_handlers.ingest_public_events(db, store_slug, body, client_ip=ip, country_code=cc)
    return VitrineAnalyticsIngestEnvelope(
        success=True,
        data=VitrineAnalyticsIngestOut(accepted=n),
        errors=None,
    )
