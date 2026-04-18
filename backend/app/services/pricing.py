"""Custo médio ponderado (DEC-09) a partir dos lotes em stock."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.inventory import InventoryBatch
from app.models.recipe import Recipe


def weighted_average_unit_cost(db: Session, item_id: UUID) -> Decimal:
    row = db.execute(
        select(
            func.coalesce(
                func.sum(InventoryBatch.quantity_available * InventoryBatch.unit_cost),
                0,
            ),
            func.coalesce(func.sum(InventoryBatch.quantity_available), 0),
        ).where(
            InventoryBatch.item_id == item_id,
            InventoryBatch.quantity_available > 0,
        )
    ).one()
    num, den = Decimal(str(row[0])), Decimal(str(row[1]))
    if den <= 0:
        return Decimal("0")
    return num / den


def estimate_recipe_unit_cost(db: Session, recipe: Recipe) -> Decimal:
    num = Decimal("0")
    for line in recipe.items:
        w = weighted_average_unit_cost(db, line.inventory_item_id)
        num += line.quantity * w
    den = recipe.yield_quantity
    if den <= 0:
        return Decimal("0")
    return num / den
