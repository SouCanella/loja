"""Insumos — listagem com envelope DEC-06."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import InventoryItemListEnvelope
from app.services.inventory_queries import list_inventory_items_for_store

router = APIRouter(tags=["inventory-v2"])


@router.get("/inventory-items", response_model=InventoryItemListEnvelope)
def list_inventory_items_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> InventoryItemListEnvelope:
    rows = list_inventory_items_for_store(db, current.store_id)
    return InventoryItemListEnvelope(success=True, data=rows, errors=None)
