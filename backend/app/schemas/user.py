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
    created_at: datetime

    model_config = {"from_attributes": True}
