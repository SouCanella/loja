"""Insumos (inventory_items) — CRUD para receitas e painel."""

from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.inventory import InventoryBatch, InventoryItem
from app.models.product import Product
from app.models.recipe import RecipeItem
from app.models.user import User
from app.schemas.inventory_items import (
    InventoryItemCreate,
    InventoryItemDetailOut,
    InventoryItemListOut,
    InventoryItemPatch,
)
from app.services.inventory_queries import list_inventory_items_for_store
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

router = APIRouter(tags=["inventory-items"])


def _get_item_for_store(db: Session, store_id: UUID, item_id: UUID) -> InventoryItem | None:
    return db.scalars(
        select(InventoryItem)
        .where(InventoryItem.id == item_id, InventoryItem.store_id == store_id)
        .options(joinedload(InventoryItem.product))
    ).first()


@router.get("", response_model=list[InventoryItemListOut])
def list_inventory_items(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> list[InventoryItemListOut]:
    return list_inventory_items_for_store(db, current.store_id)


@router.get("/{item_id}", response_model=InventoryItemDetailOut)
def get_inventory_item(
    item_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailOut:
    item = _get_item_for_store(db, current.store_id, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo não encontrado")
    return InventoryItemDetailOut(
        id=item.id,
        name=item.name,
        unit=item.unit,
        has_sale_product=item.product is not None,
    )


@router.post("", response_model=InventoryItemDetailOut, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    body: InventoryItemCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailOut:
    unit = (body.unit or "un").strip() or "un"
    item = InventoryItem(
        store_id=current.store_id,
        name=body.name.strip(),
        unit=unit,
    )
    db.add(item)
    db.flush()
    if body.initial_batch is not None:
        batch = InventoryBatch(
            item_id=item.id,
            quantity_available=body.initial_batch.quantity,
            unit_cost=body.initial_batch.unit_cost,
            expiration_date=body.initial_batch.expiration_date,
        )
        db.add(batch)
    db.commit()
    db.refresh(item)
    return InventoryItemDetailOut(
        id=item.id,
        name=item.name,
        unit=item.unit,
        has_sale_product=False,
    )


@router.patch("/{item_id}", response_model=InventoryItemDetailOut)
def patch_inventory_item(
    item_id: UUID,
    body: InventoryItemPatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailOut:
    item = _get_item_for_store(db, current.store_id, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo não encontrado")
    if body.name is not None:
        item.name = body.name.strip()
    if body.unit is not None:
        item.unit = body.unit.strip() or "un"
    db.commit()
    db.refresh(item)
    item = _get_item_for_store(db, current.store_id, item_id)
    assert item is not None
    return InventoryItemDetailOut(
        id=item.id,
        name=item.name,
        unit=item.unit,
        has_sale_product=item.product is not None,
    )


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> None:
    item = db.scalars(
        select(InventoryItem).where(
            InventoryItem.id == item_id,
            InventoryItem.store_id == current.store_id,
        )
    ).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo não encontrado")

    if db.scalars(select(Product).where(Product.inventory_item_id == item_id)).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insumo ligado a um produto de venda; remova ou altere o produto primeiro",
        )

    used = db.scalar(
        select(func.count()).select_from(RecipeItem).where(RecipeItem.inventory_item_id == item_id)
    )
    if used and used > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insumo usado em receitas; remova as linhas das receitas primeiro",
        )

    db.delete(item)
    db.commit()
