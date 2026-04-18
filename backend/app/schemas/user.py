"""Schemas de utilizador."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class UserMeResponse(BaseModel):
    id: UUID
    email: EmailStr
    role: UserRole
    store_id: UUID
    store_slug: str
    store_name: str
    created_at: datetime
    # `stores.theme.vitrine.whatsapp` — usado no painel (atalho para cliente)
    vitrine_whatsapp: str | None = None

    model_config = {"from_attributes": True}
