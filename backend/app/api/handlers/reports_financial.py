"""Relatório financeiro — lógica partilhada v1/v2."""

from datetime import UTC, date, datetime, timedelta

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.phase3 import FinancialReportOut
from app.services.financial_report import compute_financial_report


def get_financial_report(
    db: Session,
    current: User,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> FinancialReportOut:
    today = datetime.now(UTC).date()
    d0 = date_from or (today - timedelta(days=30))
    d1 = date_to or today
    return compute_financial_report(db, current.store_id, d0, d1)
