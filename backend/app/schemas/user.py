"""Schemas de utilizador."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

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
    # Margem alvo % (stores.config.pricing.target_margin_percent; default 30)
    store_target_margin_percent: Decimal

    model_config = {"from_attributes": True}


class StorePricingPatch(BaseModel):
    target_margin_percent: Decimal = Field(..., ge=0, le=100)
