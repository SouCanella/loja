"""Relatório financeiro mínimo (Fase 3)."""

from datetime import date
from typing import Annotated

from app.api.deps import get_current_user
from app.api.handlers import reports_financial as reports_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.phase3 import FinancialReportOut
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
    return reports_handlers.get_financial_report(db, current, date_from=date_from, date_to=date_to)
