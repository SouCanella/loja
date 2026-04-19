"""Produtos — envelope DEC-06."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import products as products_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.catalog import ProductCreate, ProductOut, ProductPatch
from app.schemas.envelope import ProductEnvelope, ProductListEnvelope

router = APIRouter(tags=["products-v2"])


@router.get("/products", response_model=ProductListEnvelope)
def list_products_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    category_slug: Annotated[str | None, Query()] = None,
    active_only: bool = Query(default=True),
) -> ProductListEnvelope:
    rows = products_handlers.list_products(
        db, current, category_slug=category_slug, active_only=active_only
    )
    data = [ProductOut.model_validate(r) for r in rows]
    return ProductListEnvelope(success=True, data=data, errors=None)


@router.post("/products", response_model=ProductEnvelope, status_code=status.HTTP_201_CREATED)
def create_product_v2(
    body: ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> ProductEnvelope:
    row = products_handlers.create_product(db, current, body)
    return ProductEnvelope(success=True, data=ProductOut.model_validate(row), errors=None)


@router.get("/products/{product_id}", response_model=ProductEnvelope)
def get_product_v2(
    product_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> ProductEnvelope:
    row = products_handlers.get_product(db, current, product_id)
    return ProductEnvelope(success=True, data=ProductOut.model_validate(row), errors=None)


@router.patch("/products/{product_id}", response_model=ProductEnvelope)
def patch_product_v2(
    product_id: UUID,
    body: ProductPatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> ProductEnvelope:
    row = products_handlers.update_product(db, current, product_id, body)
    return ProductEnvelope(success=True, data=ProductOut.model_validate(row), errors=None)
