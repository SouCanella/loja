"""Produtos."""

from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.category import Category
from app.models.enums import StockMovementType
from app.models.inventory import InventoryBatch, InventoryItem
from app.models.order import StockMovement
from app.models.product import Product
from app.models.user import User
from app.schemas.catalog import ProductCreate, ProductOut
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

router = APIRouter(tags=["products"])


@router.get("", response_model=list[ProductOut])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    category_slug: Annotated[str | None, Query()] = None,
    active_only: bool = Query(default=True),
) -> list[Product]:
    q = select(Product).where(Product.store_id == current.store_id)
    if active_only:
        q = q.where(Product.active.is_(True))
    if category_slug:
        cat = db.scalars(
            select(Category).where(
                Category.store_id == current.store_id,
                Category.slug == category_slug,
            )
        ).first()
        if cat is None:
            return []
        q = q.where(Product.category_id == cat.id)
    q = q.order_by(Product.name)
    return list(db.scalars(q))


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Product:
    if body.category_id is not None:
        cat = db.get(Category, body.category_id)
        if cat is None or cat.store_id != current.store_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria inválida",
            )

    item = InventoryItem(
        store_id=current.store_id,
        name=body.name.strip(),
        unit=body.inventory.unit,
    )
    db.add(item)
    db.flush()

    batch = InventoryBatch(
        item_id=item.id,
        quantity_available=body.inventory.initial_quantity,
        unit_cost=body.inventory.unit_cost,
        expiration_date=body.inventory.expiration_date,
    )
    db.add(batch)
    db.add(
        StockMovement(
            store_id=current.store_id,
            item_id=item.id,
            movement_type=StockMovementType.initial_in,
            quantity_delta=body.inventory.initial_quantity,
            order_id=None,
        )
    )

    product = Product(
        store_id=current.store_id,
        category_id=body.category_id,
        inventory_item_id=item.id,
        name=body.name.strip(),
        description=body.description,
        price=body.price,
        active=True,
    )
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflito ao criar produto",
        ) from exc
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Product:
    p = db.get(Product, product_id)
    if p is None or p.store_id != current.store_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return p
