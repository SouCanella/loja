"""Modelos da vitrine pública (catálogo sem JWT)."""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CategoryPublicOut(BaseModel):
    id: UUID
    name: str
    slug: str

    model_config = {"from_attributes": True}


class ProductPublicOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    price: Decimal
    category_id: UUID | None = None
    category_slug: str | None = None
    category_name: str | None = None

    model_config = {"from_attributes": True}


class SocialNetworkLink(BaseModel):
    label: str = ""
    url: str
    icon: str = "link"


class StorePublicOut(BaseModel):
    name: str
    slug: str
    tagline: str | None = None
    logo_emoji: str = "🍰"
    whatsapp: str | None = None
    social_networks: list[SocialNetworkLink] = Field(default_factory=list)
