"""Insumos (inventory_items) — CRUD para receitas e painel."""

from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.api.handlers import inventory_items as inventory_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.inventory_items import (
    InventoryItemCreate,
    InventoryItemDetailOut,
    InventoryItemListOut,
    InventoryItemPatch,
)
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["inventory-items"])


@router.get("", response_model=list[InventoryItemListOut])
def list_inventory_items(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> list[InventoryItemListOut]:
    return inventory_handlers.list_inventory_items(db, current)


@router.get("/{item_id}", response_model=InventoryItemDetailOut)
def get_inventory_item(
    item_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailOut:
    return inventory_handlers.get_inventory_item(db, current, item_id)


@router.post("", response_model=InventoryItemDetailOut, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    body: InventoryItemCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailOut:
    return inventory_handlers.create_inventory_item(db, current, body)


@router.patch("/{item_id}", response_model=InventoryItemDetailOut)
def patch_inventory_item(
    item_id: UUID,
    body: InventoryItemPatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailOut:
    return inventory_handlers.patch_inventory_item(db, current, item_id, body)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> None:
    inventory_handlers.delete_inventory_item(db, current, item_id)
