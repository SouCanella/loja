"""Consumo físico de lotes (DEC-17, RN-071, RN-072)."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import StockMovementType
from app.models.inventory import InventoryBatch
from app.models.order import Order, OrderStockAllocation, StockMovement


def _batches_ordered_for_consumption(stmt):
    """DEC-17: FEFO (validade crescente, sem data por último); empate FIFO por entrada."""
    return stmt.order_by(
        InventoryBatch.expiration_date.asc().nulls_last(),
        InventoryBatch.received_at.asc(),
        InventoryBatch.id.asc(),
    )


def allocate_stock_for_order(db: Session, order: Order, store_id: UUID) -> None:
    """Baixa lotes para todas as linhas do pedido; idempotente se já existir alocação."""
    if order.stock_committed:
        return

    remaining_by_item: dict[UUID, Decimal] = {}
    for line in order.items:
        pid = line.product_id
        qty = line.quantity
        if pid not in remaining_by_item:
            remaining_by_item[pid] = Decimal("0")
        remaining_by_item[pid] += qty

    for product_id, need_total in remaining_by_item.items():
        from app.models.product import Product

        product = db.get(Product, product_id)
        if product is None or product.store_id != store_id:
            raise ValueError("produto inválido na linha")
        if not product.track_inventory or product.inventory_item_id is None:
            continue
        item_id = product.inventory_item_id
        need = need_total
        stmt = _batches_ordered_for_consumption(
            select(InventoryBatch).where(
                InventoryBatch.item_id == item_id,
                InventoryBatch.quantity_available > 0,
            )
        )
        batches = list(db.scalars(stmt))
        for batch in batches:
            if need <= 0:
                break
            take = min(need, batch.quantity_available)
            batch.quantity_available -= take
            db.add(
                OrderStockAllocation(
                    order_id=order.id,
                    batch_id=batch.id,
                    quantity=take,
                )
            )
            db.add(
                StockMovement(
                    store_id=store_id,
                    item_id=item_id,
                    movement_type=StockMovementType.sale_out,
                    quantity_delta=-take,
                    order_id=order.id,
                )
            )
            need -= take
        if need > 0:
            raise ValueError("estoque insuficiente para o pedido")

    order.stock_committed = True


def release_stock_for_order(db: Session, order: Order, store_id: UUID) -> None:
    """Reverte baixas (cancelamento após confirmado)."""
    if not order.stock_committed:
        return

    for alloc in list(order.stock_allocations):
        batch = db.get(InventoryBatch, alloc.batch_id)
        if batch is None:
            continue
        batch.quantity_available += alloc.quantity
        db.add(
            StockMovement(
                store_id=store_id,
                item_id=batch.item_id,
                movement_type=StockMovementType.sale_reversal,
                quantity_delta=alloc.quantity,
                order_id=order.id,
            )
        )
        db.delete(alloc)

    order.stock_committed = False
