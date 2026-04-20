"""Catálogo público — lógica partilhada v1/v2."""

from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.category import Category
from app.models.product import Product
from app.models.store import Store
from app.schemas.public_catalog import (
    DeliveryOptionPublic,
    PaymentMethodPublic,
    ProductPublicOut,
    SocialNetworkLink,
    StorePublicOut,
)

_DELIVERY_PRESETS: list[tuple[str, str, str]] = [
    (
        "retirada",
        "Retirar na loja",
        "Sem taxa de entrega; combinamos horário pelo WhatsApp.",
    ),
    (
        "loja_entrega",
        "Entrega pela loja",
        "Taxa e região combinadas no WhatsApp.",
    ),
    (
        "uber",
        "Uber Entregas",
        "O pedido no app Uber é combinado por aqui (link, endereço e horário).",
    ),
    (
        "nove",
        "99 Entregas",
        "O pedido no app 99 é combinado por aqui (link, endereço e horário).",
    ),
]

_PAYMENT_PRESETS: list[tuple[str, str]] = [
    ("pix", "PIX (chave ou QR enviados após confirmação)"),
    ("entrega_dinheiro", "Dinheiro na entrega ou na retirada"),
    ("entrega_cartao", "Cartão de crédito/débito na entrega"),
    ("entrega_pix", "PIX na entrega (na hora)"),
]

_DELIVERY_MAP = {x[0]: x for x in _DELIVERY_PRESETS}
_PAYMENT_LABEL = {x[0]: x[1] for x in _PAYMENT_PRESETS}


def _safe_https_url(raw: object) -> str | None:
    if not isinstance(raw, str):
        return None
    u = raw.strip()
    if not u.lower().startswith("https://"):
        return None
    return u


def _overlay_percent(raw: object) -> int:
    default = 88
    if isinstance(raw, bool):
        return default
    if isinstance(raw, int):
        return max(15, min(97, raw))
    if isinstance(raw, float):
        return max(15, min(97, int(round(raw))))
    if isinstance(raw, str):
        try:
            v = int(round(float(raw.replace(",", ".").strip())))
            return max(15, min(97, v))
        except ValueError:
            return default
    return default


def get_store_by_slug(db: Session, store_slug: str) -> Store | None:
    return db.scalars(select(Store).where(Store.slug == store_slug)).first()


def vitrine_from_theme(store: Store) -> dict[str, Any]:
    raw = store.theme
    if not isinstance(raw, dict):
        return {}
    inner = raw.get("vitrine")
    if isinstance(inner, dict):
        return inner
    return raw


def _delivery_options_from_theme(v: dict[str, Any]) -> list[DeliveryOptionPublic]:
    raw_ids = v.get("delivery_option_ids")
    if isinstance(raw_ids, list) and len(raw_ids) > 0:
        ids = [str(x) for x in raw_ids if isinstance(x, str)]
    else:
        ids = [x[0] for x in _DELIVERY_PRESETS]
    out: list[DeliveryOptionPublic] = []
    for i in ids:
        row = _DELIVERY_MAP.get(i)
        if row:
            out.append(DeliveryOptionPublic(id=row[0], title=row[1], hint=row[2]))
    return out if out else [
        DeliveryOptionPublic(id=row[0], title=row[1], hint=row[2]) for row in _DELIVERY_PRESETS
    ]


def _payment_methods_from_theme(v: dict[str, Any]) -> list[PaymentMethodPublic]:
    raw = v.get("payment_methods")
    if isinstance(raw, list) and len(raw) > 0:
        out: list[PaymentMethodPublic] = []
        for item in raw:
            if not isinstance(item, dict):
                continue
            pid = item.get("id")
            if not isinstance(pid, str) or pid not in _PAYMENT_LABEL:
                continue
            if item.get("enabled") is False:
                continue
            lab = item.get("label")
            label = (
                lab.strip()
                if isinstance(lab, str) and lab.strip()
                else _PAYMENT_LABEL[pid]
            )
            out.append(PaymentMethodPublic(id=pid, label=label))
        if out:
            return out
    return [PaymentMethodPublic(id=k, label=v) for k, v in _PAYMENT_PRESETS]


def product_to_public(p: Product) -> ProductPublicOut:
    cat = p.category
    return ProductPublicOut(
        id=p.id,
        name=p.name,
        description=p.description,
        image_url=p.image_url,
        price=p.price,
        category_id=p.category_id,
        category_slug=cat.slug if cat else None,
        category_name=cat.name if cat else None,
        catalog_spotlight=p.catalog_spotlight,
        catalog_sale_mode=p.catalog_sale_mode or "in_stock",
    )


def public_get_store(db: Session, store_slug: str) -> StorePublicOut:
    store = get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    v = vitrine_from_theme(store)
    social_raw = v.get("social_networks")
    social_list: list[SocialNetworkLink] = []
    if isinstance(social_raw, list):
        for item in social_raw:
            if not isinstance(item, dict):
                continue
            url = item.get("url")
            if not url:
                continue
            social_list.append(
                SocialNetworkLink(
                    label=str(item.get("label") or ""),
                    url=str(url),
                    icon=str(item.get("icon") or "link"),
                )
            )
    logo = v.get("logo_emoji")
    layout = v.get("catalog_layout_default")
    catalog_layout_default = (
        "list" if layout == "list" else "grid"
    )
    greeting = v.get("order_greeting")
    order_greeting = greeting.strip() if isinstance(greeting, str) and greeting.strip() else None
    hide_raw = v.get("hide_unavailable_products")
    hide_unavailable = bool(hide_raw) if isinstance(hide_raw, bool) else False

    pc = v.get("primary_color")
    primary_color = pc.strip() if isinstance(pc, str) and pc.strip() else None
    ac = v.get("accent_color")
    accent_color = ac.strip() if isinstance(ac, str) and ac.strip() else None

    hero_image_url = _safe_https_url(v.get("hero_image_url"))
    logo_image_url = _safe_https_url(v.get("logo_image_url"))
    background_overlay_percent = _overlay_percent(v.get("background_overlay_percent"))

    return StorePublicOut(
        name=store.name,
        slug=store.slug,
        tagline=v.get("tagline") if isinstance(v.get("tagline"), str) else None,
        logo_emoji=logo if isinstance(logo, str) and logo else "🍰",
        whatsapp=v.get("whatsapp") if isinstance(v.get("whatsapp"), str) else None,
        social_networks=social_list,
        catalog_layout_default=catalog_layout_default,
        order_greeting=order_greeting,
        hide_unavailable_products=hide_unavailable,
        delivery_options=_delivery_options_from_theme(v),
        payment_methods=_payment_methods_from_theme(v),
        primary_color=primary_color,
        accent_color=accent_color,
        hero_image_url=hero_image_url,
        logo_image_url=logo_image_url,
        background_overlay_percent=background_overlay_percent,
    )


def public_list_categories(db: Session, store_slug: str) -> list[Category]:
    store = get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    q = select(Category).where(Category.store_id == store.id).order_by(Category.name)
    return list(db.scalars(q))


def public_get_product(db: Session, store_slug: str, product_id: UUID) -> ProductPublicOut:
    store = get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    p = db.scalars(
        select(Product)
        .where(
            Product.id == product_id,
            Product.store_id == store.id,
            Product.active.is_(True),
        )
        .options(joinedload(Product.category))
    ).first()
    if p is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return product_to_public(p)


def public_list_products(
    db: Session, store_slug: str, *, category_slug: str | None = None
) -> list[ProductPublicOut]:
    store = get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    v = vitrine_from_theme(store)
    hide_raw = v.get("hide_unavailable_products")
    hide_unavailable = bool(hide_raw) if isinstance(hide_raw, bool) else False

    q = (
        select(Product)
        .where(Product.store_id == store.id, Product.active.is_(True))
        .options(joinedload(Product.category))
    )
    if hide_unavailable:
        q = q.where(Product.catalog_sale_mode != "unavailable")
    if category_slug:
        cat = db.scalars(
            select(Category).where(Category.store_id == store.id, Category.slug == category_slug)
        ).first()
        if cat is None:
            return []
        q = q.where(Product.category_id == cat.id)
    q = q.order_by(Product.name)
    rows = list(db.scalars(q))
    return [product_to_public(p) for p in rows]
