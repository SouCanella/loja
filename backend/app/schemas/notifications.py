"""Notificações in-app (lojista)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class StoreNotificationOut(BaseModel):
    id: UUID
    kind: str
    order_id: UUID | None
    title: str
    body: str | None
    read_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationsInboxOut(BaseModel):
    items: list[StoreNotificationOut]
    unread_count: int


class NotificationMarkReadBody(BaseModel):
    notification_ids: list[UUID] = Field(..., min_length=1)
