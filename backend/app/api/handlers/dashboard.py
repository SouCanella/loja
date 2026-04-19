"""Dashboard — lógica partilhada v2."""

from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.dashboard import DashboardSummaryOut
from app.services.dashboard_summary import compute_dashboard_summary


def get_dashboard_summary(
    db: Session,
    current: User,
    *,
    date_from: date | None,
    date_to: date | None,
) -> DashboardSummaryOut:
    if date_from is None or date_to is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Indique date_from e date_to (ISO date).",
        )
    try:
        return compute_dashboard_summary(db, current.store_id, date_from, date_to)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
