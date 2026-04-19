"""Insumos — envelope DEC-06."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import inventory_items as inventory_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import (
    DeleteSuccessEnvelope,
    InventoryItemDetailEnvelope,
    InventoryItemListEnvelope,
)
from app.schemas.inventory_items import (
    InventoryItemCreate,
    InventoryItemPatch,
)

router = APIRouter(tags=["inventory-v2"])


@router.get("/inventory-items", response_model=InventoryItemListEnvelope)
def list_inventory_items_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemListEnvelope:
    rows = inventory_handlers.list_inventory_items(db, current)
    return InventoryItemListEnvelope(success=True, data=rows, errors=None)


@router.get("/inventory-items/{item_id}", response_model=InventoryItemDetailEnvelope)
def get_inventory_item_v2(
    item_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailEnvelope:
    data = inventory_handlers.get_inventory_item(db, current, item_id)
    return InventoryItemDetailEnvelope(success=True, data=data, errors=None)


@router.post(
    "/inventory-items",
    response_model=InventoryItemDetailEnvelope,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_item_v2(
    body: InventoryItemCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailEnvelope:
    data = inventory_handlers.create_inventory_item(db, current, body)
    return InventoryItemDetailEnvelope(success=True, data=data, errors=None)


@router.patch("/inventory-items/{item_id}", response_model=InventoryItemDetailEnvelope)
def patch_inventory_item_v2(
    item_id: UUID,
    body: InventoryItemPatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemDetailEnvelope:
    data = inventory_handlers.patch_inventory_item(db, current, item_id, body)
    return InventoryItemDetailEnvelope(success=True, data=data, errors=None)


@router.delete("/inventory-items/{item_id}", response_model=DeleteSuccessEnvelope)
def delete_inventory_item_v2(
    item_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> DeleteSuccessEnvelope:
    inventory_handlers.delete_inventory_item(db, current, item_id)
    return DeleteSuccessEnvelope(success=True, data=None, errors=None)
