"""Relatório financeiro com envelope DEC-06."""

from datetime import UTC, date, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import FinancialReportEnvelope
from app.services.financial_report import compute_financial_report

router = APIRouter(tags=["reports-v2"])


@router.get("/reports/financial", response_model=FinancialReportEnvelope)
def get_financial_report_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
) -> FinancialReportEnvelope:
    today = datetime.now(UTC).date()
    d0 = date_from or (today - timedelta(days=30))
    d1 = date_to or today
    report = compute_financial_report(db, current.store_id, d0, d1)
    return FinancialReportEnvelope(success=True, data=report, errors=None)
