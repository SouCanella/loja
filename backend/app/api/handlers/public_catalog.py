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
    ProductPublicOut,
    SocialNetworkLink,
    StorePublicOut,
)


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


def product_to_public(p: Product) -> ProductPublicOut:
    cat = p.category
    return ProductPublicOut(
        id=p.id,
        name=p.name,
        description=p.description,
        price=p.price,
        category_id=p.category_id,
        category_slug=cat.slug if cat else None,
        category_name=cat.name if cat else None,
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
    return StorePublicOut(
        name=store.name,
        slug=store.slug,
        tagline=v.get("tagline") if isinstance(v.get("tagline"), str) else None,
        logo_emoji=logo if isinstance(logo, str) and logo else "🍰",
        whatsapp=v.get("whatsapp") if isinstance(v.get("whatsapp"), str) else None,
        social_networks=social_list,
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
    q = (
        select(Product)
        .where(Product.store_id == store.id, Product.active.is_(True))
        .options(joinedload(Product.category))
    )
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
