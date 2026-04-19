"""Catálogo público — envelope DEC-06."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.handlers import public_catalog as public_handlers
from app.db.session import get_db
from app.schemas.envelope import (
    CategoryPublicListEnvelope,
    ProductPublicEnvelope,
    ProductPublicListEnvelope,
    StorePublicEnvelope,
)
from app.schemas.public_catalog import CategoryPublicOut

router = APIRouter(tags=["public-v2"])


@router.get("/public/stores/{store_slug}", response_model=StorePublicEnvelope)
def public_get_store_v2(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
) -> StorePublicEnvelope:
    data = public_handlers.public_get_store(db, store_slug)
    return StorePublicEnvelope(success=True, data=data, errors=None)


@router.get("/public/stores/{store_slug}/categories", response_model=CategoryPublicListEnvelope)
def public_list_categories_v2(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
) -> CategoryPublicListEnvelope:
    rows = public_handlers.public_list_categories(db, store_slug)
    data = [CategoryPublicOut.model_validate(r) for r in rows]
    return CategoryPublicListEnvelope(success=True, data=data, errors=None)


@router.get(
    "/public/stores/{store_slug}/products/{product_id}",
    response_model=ProductPublicEnvelope,
)
def public_get_product_v2(
    store_slug: str,
    product_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> ProductPublicEnvelope:
    data = public_handlers.public_get_product(db, store_slug, product_id)
    return ProductPublicEnvelope(success=True, data=data, errors=None)


@router.get("/public/stores/{store_slug}/products", response_model=ProductPublicListEnvelope)
def public_list_products_v2(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
    category_slug: Annotated[str | None, Query()] = None,
) -> ProductPublicListEnvelope:
    data = public_handlers.public_list_products(db, store_slug, category_slug=category_slug)
    return ProductPublicListEnvelope(success=True, data=data, errors=None)
