"""Schemas de utilizador."""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

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
    # Cópia de `stores.theme["vitrine"]` (cores, textos, imagens) para o painel editar a vitrine
    vitrine_theme: dict | None = None
    # Margem alvo % (stores.config.pricing.target_margin_percent; default 30)
    store_target_margin_percent: Decimal

    model_config = {"from_attributes": True}


class StorePricingPatch(BaseModel):
    target_margin_percent: Decimal = Field(..., ge=0, le=100)


class StoreSettingsPatch(BaseModel):
    """Actualização parcial da loja (nome, slug, tema, config JSON)."""

    store_name: str | None = Field(None, min_length=1, max_length=255)
    store_slug: str | None = Field(None, min_length=2, max_length=80)
    theme: dict | None = None
    config: dict | None = None

    @field_validator("store_slug")
    @classmethod
    def slug_normalize(cls, v: str | None) -> str | None:
        if v is None:
            return None
        s = v.strip().lower().replace(" ", "-")
        return s or None
