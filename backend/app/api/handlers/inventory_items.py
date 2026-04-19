"""Insumos — lógica partilhada v1/v2."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

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


def _get_item_for_store(db: Session, store_id: UUID, item_id: UUID) -> InventoryItem | None:
    return db.scalars(
        select(InventoryItem)
        .where(InventoryItem.id == item_id, InventoryItem.store_id == store_id)
        .options(joinedload(InventoryItem.product))
    ).first()


def list_inventory_items(db: Session, current: User) -> list[InventoryItemListOut]:
    return list_inventory_items_for_store(db, current.store_id)


def get_inventory_item(db: Session, current: User, item_id: UUID) -> InventoryItemDetailOut:
    item = _get_item_for_store(db, current.store_id, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Insumo não encontrado")
    return InventoryItemDetailOut(
        id=item.id,
        name=item.name,
        unit=item.unit,
        has_sale_product=item.product is not None,
    )


def create_inventory_item(
    db: Session, current: User, body: InventoryItemCreate
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


def patch_inventory_item(
    db: Session, current: User, item_id: UUID, body: InventoryItemPatch
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


def delete_inventory_item(db: Session, current: User, item_id: UUID) -> None:
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
