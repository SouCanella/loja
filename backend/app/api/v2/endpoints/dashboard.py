"""Dashboard — envelope DEC-06."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import customer_order_stats as customer_order_stats_handlers
from app.api.handlers import dashboard as dashboard_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import CustomerOrderStatsEnvelope, DashboardSummaryEnvelope

router = APIRouter(tags=["dashboard-v2"])


@router.get("/dashboard/summary", response_model=DashboardSummaryEnvelope)
def get_dashboard_summary_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    date_from: Annotated[date, Query()],
    date_to: Annotated[date, Query()],
) -> DashboardSummaryEnvelope:
    data = dashboard_handlers.get_dashboard_summary(
        db, current, date_from=date_from, date_to=date_to
    )
    return DashboardSummaryEnvelope(success=True, data=data, errors=None)


@router.get("/dashboard/customer-order-stats", response_model=CustomerOrderStatsEnvelope)
def get_customer_order_stats_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    date_from: Annotated[date, Query()],
    date_to: Annotated[date, Query()],
) -> CustomerOrderStatsEnvelope:
    data = customer_order_stats_handlers.customer_order_stats_for_store(
        db, current, date_from=date_from, date_to=date_to
    )
    return CustomerOrderStatsEnvelope(success=True, data=data, errors=None)
