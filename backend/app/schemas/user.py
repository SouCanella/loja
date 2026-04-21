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
    # Cópia de `stores.theme["vitrine"]` (cores, textos, imagens) para o painel editar a vitrine
    vitrine_theme: dict | None = None
    # Margem alvo % (stores.config.pricing.target_margin_percent; default 30)
    store_target_margin_percent: Decimal
    # Custo de mão de obra R$/h (stores.config.pricing.labor_rate_per_hour; default 0)
    store_labor_rate_per_hour: Decimal
    # `stores.config.print` — impressão de pedidos (Fase 3.2)
    print_config: dict = Field(default_factory=dict)

    model_config = {"from_attributes": True}


class StorePricingPatch(BaseModel):
    target_margin_percent: Decimal | None = Field(
        default=None,
        ge=0,
        le=100,
        description="Omitir para não alterar a margem da loja",
    )
    labor_rate_per_hour: Decimal | None = Field(
        default=None,
        ge=0,
        le=Decimal("100000"),
        description="R$/h; 0 ou omitir remove a taxa; omitir só o campo não altera o valor guardado",
    )


class UserPasswordPatch(BaseModel):
    """Alteração da palavra-passe do utilizador autenticado (painel)."""

    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class StoreSettingsPatch(BaseModel):
    """Actualização parcial da loja (nome, tema, config JSON). O slug da URL é definido no registo e não é alterável aqui."""

    store_name: str | None = Field(None, min_length=1, max_length=255)
    theme: dict | None = None
    config: dict | None = None
