"""Consultas de insumos (partilhadas v1/v2)."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.inventory import InventoryBatch, InventoryItem
from app.schemas.inventory_items import InventoryItemListOut


def list_inventory_items_for_store(db: Session, store_id: UUID) -> list[InventoryItemListOut]:
    q = (
        select(InventoryItem)
        .where(InventoryItem.store_id == store_id)
        .options(joinedload(InventoryItem.product))
        .order_by(InventoryItem.name)
    )
    rows = db.scalars(q).unique().all()
    ids = [r.id for r in rows]
    if not ids:
        return []

    agg_rows = db.execute(
        select(
            InventoryBatch.item_id,
            func.coalesce(func.sum(InventoryBatch.quantity_available), 0),
            func.coalesce(
                func.sum(InventoryBatch.quantity_available * InventoryBatch.unit_cost),
                0,
            ),
        )
        .where(InventoryBatch.item_id.in_(ids))
        .group_by(InventoryBatch.item_id)
    ).all()
    agg: dict[UUID, tuple[Decimal, Decimal]] = {
        row[0]: (Decimal(str(row[1])), Decimal(str(row[2]))) for row in agg_rows
    }

    out: list[InventoryItemListOut] = []
    for r in rows:
        qtot, val = agg.get(r.id, (Decimal("0"), Decimal("0")))
        wavg: Decimal | None = None
        if qtot > 0:
            wavg = (val / qtot).quantize(Decimal("0.0001"))
        out.append(
            InventoryItemListOut(
                id=r.id,
                name=r.name,
                unit=r.unit,
                has_sale_product=r.product is not None,
                quantity_available=qtot,
                weighted_avg_unit_cost=wavg,
                inventory_value=val.quantize(Decimal("0.01")),
            )
        )
    return out
