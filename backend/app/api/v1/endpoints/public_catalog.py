"""Catálogo público (vitrine, sem JWT)."""

from decimal import Decimal
from typing import Annotated, Any
from uuid import UUID

from app.db.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.models.store import Store
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

router = APIRouter(tags=["public"])


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


def _get_store_by_slug(db: Session, store_slug: str) -> Store | None:
    return db.scalars(select(Store).where(Store.slug == store_slug)).first()


def _vitrine_from_theme(store: Store) -> dict[str, Any]:
    raw = store.theme
    if not isinstance(raw, dict):
        return {}
    inner = raw.get("vitrine")
    if isinstance(inner, dict):
        return inner
    return raw


def _product_to_public(p: Product) -> ProductPublicOut:
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


@router.get("/stores/{store_slug}", response_model=StorePublicOut)
def public_get_store(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
) -> StorePublicOut:
    store = _get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    v = _vitrine_from_theme(store)
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


@router.get("/stores/{store_slug}/categories", response_model=list[CategoryPublicOut])
def public_list_categories(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
) -> list[Category]:
    store = _get_store_by_slug(db, store_slug)
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    q = select(Category).where(Category.store_id == store.id).order_by(Category.name)
    return list(db.scalars(q))


@router.get(
    "/stores/{store_slug}/products/{product_id}",
    response_model=ProductPublicOut,
)
def public_get_product(
    store_slug: str,
    product_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> ProductPublicOut:
    store = _get_store_by_slug(db, store_slug)
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
    return _product_to_public(p)


@router.get("/stores/{store_slug}/products", response_model=list[ProductPublicOut])
def public_list_products(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
    category_slug: Annotated[str | None, Query()] = None,
) -> list[ProductPublicOut]:
    store = _get_store_by_slug(db, store_slug)
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
    return [_product_to_public(p) for p in rows]
