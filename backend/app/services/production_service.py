"""Execução de receita: baixa DEC-17 e custo médio do lote de saída (DEC-09)."""

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.enums import StockMovementType
from app.models.inventory import InventoryBatch, InventoryItem
from app.models.order import StockMovement
from app.models.product import Product
from app.models.production_run import ProductionRun
from app.models.recipe import Recipe


def _batches_ordered_for_consumption(stmt):
    return stmt.order_by(
        InventoryBatch.expiration_date.asc().nulls_last(),
        InventoryBatch.received_at.asc(),
        InventoryBatch.id.asc(),
    )


def consume_ingredient_fefo(
    db: Session,
    store_id: UUID,
    item_id: UUID,
    need: Decimal,
    production_run_id: UUID,
) -> Decimal:
    """Baixa insumo; devolve custo total dos lotes consumidos."""
    item = db.get(InventoryItem, item_id)
    if item is None or item.store_id != store_id:
        raise ValueError("insumo inválido na receita")

    cost = Decimal("0")
    remaining = need
    stmt = _batches_ordered_for_consumption(
        select(InventoryBatch).where(
            InventoryBatch.item_id == item_id,
            InventoryBatch.quantity_available > 0,
        )
    )
    batches = list(db.scalars(stmt))
    for batch in batches:
        if remaining <= 0:
            break
        take = min(remaining, batch.quantity_available)
        batch.quantity_available -= take
        cost += take * batch.unit_cost
        db.add(
            StockMovement(
                store_id=store_id,
                item_id=item_id,
                movement_type=StockMovementType.production_out,
                quantity_delta=-take,
                production_run_id=production_run_id,
            )
        )
        remaining -= take
    if remaining > 0:
        raise ValueError("estoque insuficiente para produção")
    return cost


def execute_production(
    db: Session,
    *,
    store_id: UUID,
    recipe: Recipe,
    idempotency_key: str | None,
) -> ProductionRun:
    """Uma corrida de produção: consome insumos e gera lote de produto acabado."""
    if recipe.store_id != store_id:
        raise ValueError("receita de outra loja")

    product = db.get(Product, recipe.product_id)
    if product is None or product.store_id != store_id:
        raise ValueError("produto inválido")
    if not product.track_inventory or product.inventory_item_id is None:
        raise ValueError("produto sem stock acabado (sem controlo de inventário)")

    recipe = db.scalars(
        select(Recipe)
        .where(Recipe.id == recipe.id)
        .options(joinedload(Recipe.items))
    ).first()
    if recipe is None:
        raise ValueError("receita não encontrada")

    if not recipe.items:
        raise ValueError("receita sem insumos")

    yld = recipe.yield_quantity
    if yld <= 0:
        raise ValueError("rendimento inválido")

    finished_item_id = product.inventory_item_id
    for line in recipe.items:
        if line.inventory_item_id == finished_item_id:
            raise ValueError("receita não pode consumir o mesmo insumo do produto acabado")

    run = ProductionRun(
        store_id=store_id,
        recipe_id=recipe.id,
        idempotency_key=idempotency_key,
        output_quantity=yld,
        total_input_cost=Decimal("0"),
        unit_output_cost=Decimal("0"),
    )
    db.add(run)
    db.flush()

    total_in = Decimal("0")
    for line in recipe.items:
        total_in += consume_ingredient_fefo(
            db,
            store_id,
            line.inventory_item_id,
            line.quantity,
            run.id,
        )

    unit_out = (total_in / yld) if yld > 0 else Decimal("0")
    out_exp = None
    days = recipe.output_shelf_life_days
    if days is not None and days > 0:
        out_exp = (datetime.now(UTC) + timedelta(days=days)).date()
    out_batch = InventoryBatch(
        item_id=finished_item_id,
        quantity_available=yld,
        unit_cost=unit_out,
        expiration_date=out_exp,
    )
    db.add(out_batch)
    db.add(
        StockMovement(
            store_id=store_id,
            item_id=finished_item_id,
            movement_type=StockMovementType.production_in,
            quantity_delta=yld,
            production_run_id=run.id,
        )
    )

    run.total_input_cost = total_in
    run.unit_output_cost = unit_out
    db.add(run)
    return run
