"""Resumo de analytics da vitrine (painel autenticado)."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import vitrine_analytics as analytics_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import VitrineAnalyticsSummaryEnvelope

router = APIRouter(tags=["analytics-v2"])


@router.get("/analytics/vitrine/summary", response_model=VitrineAnalyticsSummaryEnvelope)
def get_vitrine_analytics_summary_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    date_from: Annotated[date, Query(description="Início (UTC, inclusivo)")],
    date_to: Annotated[date, Query(description="Fim (UTC, inclusivo)")],
) -> VitrineAnalyticsSummaryEnvelope:
    data = analytics_handlers.get_vitrine_summary_for_store(
        db, current, date_from=date_from, date_to=date_to
    )
    return VitrineAnalyticsSummaryEnvelope(success=True, data=data, errors=None)
