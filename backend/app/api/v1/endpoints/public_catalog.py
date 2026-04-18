"""Catálogo público (vitrine, sem JWT)."""

from decimal import Decimal
from typing import Annotated
from uuid import UUID

from app.db.session import get_db
from app.models.category import Category
from app.models.product import Product
from app.models.store import Store
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session


class ProductPublicOut(BaseModel):
    id: UUID
    name: str
    description: str | None
    price: Decimal

    model_config = {"from_attributes": True}


router = APIRouter(tags=["public"])


@router.get("/stores/{store_slug}/products", response_model=list[ProductPublicOut])
def public_list_products(
    store_slug: str,
    db: Annotated[Session, Depends(get_db)],
    category_slug: Annotated[str | None, Query()] = None,
) -> list[Product]:
    store = db.scalars(select(Store).where(Store.slug == store_slug)).first()
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loja não encontrada")
    q = select(Product).where(Product.store_id == store.id, Product.active.is_(True))
    if category_slug:
        cat = db.scalars(
            select(Category).where(Category.store_id == store.id, Category.slug == category_slug)
        ).first()
        if cat is None:
            return []
        q = q.where(Product.category_id == cat.id)
    q = q.order_by(Product.name)
    return list(db.scalars(q))
