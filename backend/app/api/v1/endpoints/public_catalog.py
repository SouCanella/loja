"""Catálogo público (vitrine, sem JWT)."""

from typing import Annotated
from uuid import UUID

from app.api.handlers import public_catalog as public_handlers
from app.db.session import get_db
from app.models.category import Category
from app.schemas.public_catalog import (
    CategoryPublicOut,
    ProductPublicOut,
    StorePublicOut,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter(tags=["public"])


@router.get("/stores/{store_slug}", response_model=StorePublicOut)
def public_get_store(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
) -> StorePublicOut:
    return public_handlers.public_get_store(db, store_slug)


@router.get("/stores/{store_slug}/categories", response_model=list[CategoryPublicOut])
def public_list_categories(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
) -> list[Category]:
    return public_handlers.public_list_categories(db, store_slug)


@router.get(
    "/stores/{store_slug}/products/{product_id}",
    response_model=ProductPublicOut,
)
def public_get_product(
    store_slug: str,
    product_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> ProductPublicOut:
    return public_handlers.public_get_product(db, store_slug, product_id)


@router.get("/stores/{store_slug}/products", response_model=list[ProductPublicOut])
def public_list_products(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
    category_slug: Annotated[str | None, Query()] = None,
) -> list[ProductPublicOut]:
    return public_handlers.public_list_products(db, store_slug, category_slug=category_slug)
