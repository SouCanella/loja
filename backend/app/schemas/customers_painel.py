"""Contas de cliente na vitrine — gestão pelo painel (lojista)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class StaffCustomerCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class StaffCustomerOut(BaseModel):
    id: UUID
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}
