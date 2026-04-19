"""Relatório financeiro com envelope DEC-06."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import reports_financial as reports_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import FinancialReportEnvelope

router = APIRouter(tags=["reports-v2"])


@router.get("/reports/financial", response_model=FinancialReportEnvelope)
def get_financial_report_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> FinancialReportEnvelope:
    report = reports_handlers.get_financial_report(
        db, current, date_from=date_from, date_to=date_to
    )
    return FinancialReportEnvelope(success=True, data=report, errors=None)
