"""Relatório financeiro mínimo (Fase 3)."""

from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.phase3 import FinancialReportOut
from app.services.financial_report import compute_financial_report
from fastapi import APIRouter, Depends, Query
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
    return compute_financial_report(db, current.store_id, d0, d1)
