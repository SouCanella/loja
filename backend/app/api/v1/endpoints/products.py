"""Produtos."""

from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.api.handlers import products as products_handlers
from app.db.session import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.catalog import ProductCreate, ProductOut
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    category_slug: Annotated[str | None, Query()] = None,
    active_only: bool = Query(default=True),
) -> list[Product]:
    return products_handlers.list_products(
        db, current, category_slug=category_slug, active_only=active_only
    )


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Product:
    return products_handlers.create_product(db, current, body)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Product:
    return products_handlers.get_product(db, current, product_id)
