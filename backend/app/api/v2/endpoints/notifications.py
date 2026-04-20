"""Notificações in-app do lojista."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import (
    NotificationMarkReadEnvelope,
    NotificationMarkReadResult,
    NotificationsInboxEnvelope,
)
from app.schemas.notifications import (
    NotificationMarkReadBody,
    NotificationsInboxOut,
    StoreNotificationOut,
)
from app.services import store_notifications as notif_svc

router = APIRouter(prefix="/notifications", tags=["notifications-v2"])


@router.get("", response_model=NotificationsInboxEnvelope)
def list_notifications_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
) -> NotificationsInboxEnvelope:
    rows, unread = notif_svc.list_inbox(db, current.store_id, limit=limit)
    data = NotificationsInboxOut(
        items=[StoreNotificationOut.model_validate(r) for r in rows],
        unread_count=unread,
    )
    return NotificationsInboxEnvelope(success=True, data=data, errors=None)


@router.post("/mark-read", response_model=NotificationMarkReadEnvelope)
def mark_notifications_read_v2(
    body: NotificationMarkReadBody,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> NotificationMarkReadEnvelope:
    n = notif_svc.mark_read(db, current, body.notification_ids)
    return NotificationMarkReadEnvelope(
        success=True,
        data=NotificationMarkReadResult(marked_count=n),
        errors=None,
    )


@router.post("/read-all", response_model=NotificationMarkReadEnvelope)
def mark_all_notifications_read_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> NotificationMarkReadEnvelope:
    n = notif_svc.mark_all_read(db, current)
    return NotificationMarkReadEnvelope(
        success=True,
        data=NotificationMarkReadResult(marked_count=n),
        errors=None,
    )
