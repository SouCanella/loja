"""Insumos (inventory_items) — leitura para receitas e painel."""

from typing import Annotated

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.inventory import InventoryItem
from app.models.user import User
from app.schemas.inventory_items import InventoryItemListOut
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter(tags=["inventory-items"])


@router.get("", response_model=list[InventoryItemListOut])
def list_inventory_items(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> list[InventoryItem]:
    q = (
        select(InventoryItem)
        .where(InventoryItem.store_id == current.store_id)
        .order_by(InventoryItem.name)
    )
    return list(db.scalars(q))
