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
    image_url: str | None = None
    price: Decimal
    category_id: UUID | None = None
    category_slug: str | None = None
    category_name: str | None = None
    catalog_spotlight: str | None = None
    """featured | new | bestseller — RF-CA-11."""

    catalog_sale_mode: str = "in_stock"
    """in_stock | order_only | unavailable — RF-CA-05."""

    model_config = {"from_attributes": True}


class SocialNetworkLink(BaseModel):
    label: str = ""
    url: str
    icon: str = "link"


class DeliveryOptionPublic(BaseModel):
    id: str
    title: str
    hint: str


class PaymentMethodPublic(BaseModel):
    id: str
    label: str


class StorePublicOut(BaseModel):
    name: str
    slug: str
    tagline: str | None = None
    logo_emoji: str = "🍰"
    whatsapp: str | None = None
    social_networks: list[SocialNetworkLink] = Field(default_factory=list)
    catalog_layout_default: str = "grid"
    """grid | list — RF-CF-08."""

    order_greeting: str | None = None
    """Saudação opcional antes do corpo do pedido no WhatsApp — RF-CF-06."""

    hide_unavailable_products: bool = False
    """Se true, produtos `unavailable` não entram na listagem — RF-CA-04."""

    delivery_options: list[DeliveryOptionPublic] = Field(default_factory=list)
    """Opções habilitadas — RF-CF-09 / RF-PE-08."""

    payment_methods: list[PaymentMethodPublic] = Field(default_factory=list)
    """Formas de pagamento habilitadas na vitrine."""

    primary_color: str | None = None
    """Cor principal (hex), ex.: identidade em secções suaves."""

    accent_color: str | None = None
    """Cor de destaque (hex), ex.: links, realces, estados seleccionados."""

    hero_image_url: str | None = None
    """Imagem de fundo da vitrine (URL https)."""

    logo_image_url: str | None = None
    """Logótipo / ícone da loja na vitrine (URL https)."""

    background_overlay_percent: int = 88
    """Opacidade do véu sobre o fundo (15–97). Maior = imagem mais suave e texto mais legível."""
