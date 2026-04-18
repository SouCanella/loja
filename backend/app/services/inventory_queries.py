"""Consultas de insumos (partilhadas v1/v2)."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.inventory import InventoryItem
from app.schemas.inventory_items import InventoryItemListOut


def list_inventory_items_for_store(db: Session, store_id: UUID) -> list[InventoryItemListOut]:
    q = (
        select(InventoryItem)
        .where(InventoryItem.store_id == store_id)
        .options(joinedload(InventoryItem.product))
        .order_by(InventoryItem.name)
    )
    rows = db.scalars(q).unique().all()
    return [
        InventoryItemListOut(
            id=r.id,
            name=r.name,
            unit=r.unit,
            has_sale_product=r.product is not None,
        )
        for r in rows
    ]
