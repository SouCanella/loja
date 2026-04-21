"""Testes — produção: baixa FEFO e validações de execute_production."""

import uuid
from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

import pytest
from app.models.inventory import InventoryBatch, InventoryItem
from app.models.product import Product
from app.models.recipe import Recipe, RecipeItem
from app.models.store import Store
from app.services.production_service import consume_ingredient_fefo, execute_production
from sqlalchemy import select
from sqlalchemy.orm import Session


def test_consume_insufficient_stock_raises(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="Loja", slug=f"ps-{sid.hex[:8]}"))
    item = InventoryItem(id=uuid.uuid4(), store_id=sid, name="F", unit="kg")
    db_session.add(item)
    db_session.add(
        InventoryBatch(
            id=uuid.uuid4(),
            item_id=item.id,
            quantity_available=Decimal("1"),
            unit_cost=Decimal("2"),
        )
    )
    db_session.commit()
    run_id = uuid.uuid4()
    with pytest.raises(ValueError, match="estoque insuficiente"):
        consume_ingredient_fefo(db_session, sid, item.id, Decimal("5"), run_id)


def test_consume_fefo_stops_when_need_satisfied_across_batches(db_session: Session) -> None:
    """Cobre o ramo `if remaining <= 0: break` no loop FEFO."""
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="L", slug=f"fefo-{sid.hex[:8]}"))
    item = InventoryItem(id=uuid.uuid4(), store_id=sid, name="Farinha", unit="kg")
    db_session.add(item)
    t0 = datetime.now(UTC)
    db_session.add_all(
        [
            InventoryBatch(
                id=uuid.uuid4(),
                item_id=item.id,
                quantity_available=Decimal("3"),
                unit_cost=Decimal("2"),
                received_at=t0,
            ),
            InventoryBatch(
                id=uuid.uuid4(),
                item_id=item.id,
                quantity_available=Decimal("10"),
                unit_cost=Decimal("5"),
                received_at=t0 + timedelta(seconds=1),
            ),
            InventoryBatch(
                id=uuid.uuid4(),
                item_id=item.id,
                quantity_available=Decimal("100"),
                unit_cost=Decimal("9"),
                received_at=t0 + timedelta(seconds=2),
            ),
        ]
    )
    db_session.commit()
    run_id = uuid.uuid4()
    cost = consume_ingredient_fefo(db_session, sid, item.id, Decimal("5"), run_id)
    # 3*2 + 2*5 = 6 + 10 = 16 (terceiro lote não é tocado)
    assert cost == Decimal("16")
    db_session.refresh(item)
    batches = sorted(item.batches, key=lambda b: b.received_at or datetime.min.replace(tzinfo=UTC))
    assert batches[0].quantity_available == Decimal("0")
    assert batches[1].quantity_available == Decimal("8")
    assert batches[2].quantity_available == Decimal("100")


def test_consume_wrong_store_item_raises(db_session: Session) -> None:
    sid_a = uuid.uuid4()
    sid_b = uuid.uuid4()
    db_session.add_all(
        [
            Store(id=sid_a, name="A", slug=f"a-{sid_a.hex[:8]}"),
            Store(id=sid_b, name="B", slug=f"b-{sid_b.hex[:8]}"),
        ]
    )
    item = InventoryItem(id=uuid.uuid4(), store_id=sid_b, name="Outra loja", unit="un")
    db_session.add(item)
    db_session.commit()
    with pytest.raises(ValueError, match="insumo inválido"):
        consume_ingredient_fefo(db_session, sid_a, item.id, Decimal("1"), uuid.uuid4())


def test_execute_production_wrong_store_raises(db_session: Session) -> None:
    s1 = uuid.uuid4()
    s2 = uuid.uuid4()
    db_session.add_all(
        [
            Store(id=s1, name="S1", slug=f"s1-{s1.hex[:8]}"),
            Store(id=s2, name="S2", slug=f"s2-{s2.hex[:8]}"),
        ]
    )
    fin = InventoryItem(id=uuid.uuid4(), store_id=s1, name="Bolo", unit="un")
    db_session.add(fin)
    prod = Product(
        id=uuid.uuid4(),
        store_id=s1,
        inventory_item_id=fin.id,
        name="Bolo",
        price=Decimal("10"),
        active=True,
    )
    db_session.add(prod)
    recipe = Recipe(
        id=uuid.uuid4(),
        store_id=s1,
        product_id=prod.id,
        yield_quantity=Decimal("1"),
        time_minutes=None,
    )
    db_session.add(recipe)
    db_session.commit()

    with pytest.raises(ValueError, match="receita de outra loja"):
        execute_production(db_session, store_id=s2, recipe=recipe, idempotency_key=None)


def test_execute_production_empty_recipe_raises(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="E", slug=f"e-{sid.hex[:8]}"))
    fin = InventoryItem(id=uuid.uuid4(), store_id=sid, name="X", unit="un")
    db_session.add(fin)
    prod = Product(
        id=uuid.uuid4(),
        store_id=sid,
        inventory_item_id=fin.id,
        name="P",
        price=Decimal("1"),
        active=True,
    )
    db_session.add(prod)
    recipe = Recipe(
        id=uuid.uuid4(),
        store_id=sid,
        product_id=prod.id,
        yield_quantity=Decimal("1"),
        time_minutes=None,
    )
    db_session.add(recipe)
    db_session.commit()

    with pytest.raises(ValueError, match="receita sem insumos"):
        execute_production(db_session, store_id=sid, recipe=recipe, idempotency_key=None)


def test_execute_production_invalid_yield_raises(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="Y", slug=f"y-{sid.hex[:8]}"))
    flour = InventoryItem(id=uuid.uuid4(), store_id=sid, name="F", unit="kg")
    fin = InventoryItem(id=uuid.uuid4(), store_id=sid, name="P", unit="un")
    db_session.add_all([flour, fin])
    prod = Product(
        id=uuid.uuid4(),
        store_id=sid,
        inventory_item_id=fin.id,
        name="Prod",
        price=Decimal("1"),
        active=True,
    )
    db_session.add(prod)
    recipe = Recipe(
        id=uuid.uuid4(),
        store_id=sid,
        product_id=prod.id,
        yield_quantity=Decimal("0"),
        time_minutes=None,
    )
    db_session.add(recipe)
    db_session.add(
        RecipeItem(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            inventory_item_id=flour.id,
            quantity=Decimal("1"),
        )
    )
    db_session.commit()

    with pytest.raises(ValueError, match="rendimento inválido"):
        execute_production(db_session, store_id=sid, recipe=recipe, idempotency_key=None)


def test_execute_production_cannot_consume_finished_item_raises(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="C", slug=f"c-{sid.hex[:8]}"))
    fin = InventoryItem(id=uuid.uuid4(), store_id=sid, name="Acabado", unit="un")
    db_session.add(fin)
    prod = Product(
        id=uuid.uuid4(),
        store_id=sid,
        inventory_item_id=fin.id,
        name="Bolo",
        price=Decimal("1"),
        active=True,
    )
    db_session.add(prod)
    recipe = Recipe(
        id=uuid.uuid4(),
        store_id=sid,
        product_id=prod.id,
        yield_quantity=Decimal("1"),
        time_minutes=None,
    )
    db_session.add(recipe)
    db_session.add(
        RecipeItem(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            inventory_item_id=fin.id,
            quantity=Decimal("1"),
        )
    )
    db_session.commit()

    with pytest.raises(ValueError, match="mesmo insumo do produto acabado"):
        execute_production(db_session, store_id=sid, recipe=recipe, idempotency_key=None)


def test_execute_production_product_wrong_store_raises(db_session: Session) -> None:
    s1 = uuid.uuid4()
    s2 = uuid.uuid4()
    db_session.add_all(
        [
            Store(id=s1, name="L1", slug=f"l1-{s1.hex[:8]}"),
            Store(id=s2, name="L2", slug=f"l2-{s2.hex[:8]}"),
        ]
    )
    flour = InventoryItem(id=uuid.uuid4(), store_id=s1, name="F", unit="kg")
    fin = InventoryItem(id=uuid.uuid4(), store_id=s1, name="B", unit="un")
    db_session.add_all([flour, fin])
    prod = Product(
        id=uuid.uuid4(),
        store_id=s2,
        inventory_item_id=fin.id,
        name="Estrangeiro",
        price=Decimal("1"),
        active=True,
    )
    db_session.add(prod)
    recipe = Recipe(
        id=uuid.uuid4(),
        store_id=s1,
        product_id=prod.id,
        yield_quantity=Decimal("1"),
        time_minutes=None,
    )
    db_session.add(recipe)
    db_session.add(
        RecipeItem(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            inventory_item_id=flour.id,
            quantity=Decimal("1"),
        )
    )
    db_session.add(
        InventoryBatch(
            id=uuid.uuid4(),
            item_id=flour.id,
            quantity_available=Decimal("10"),
            unit_cost=Decimal("1"),
        )
    )
    db_session.commit()

    with pytest.raises(ValueError, match="produto inválido"):
        execute_production(db_session, store_id=s1, recipe=recipe, idempotency_key=None)


def test_execute_production_raises_when_recipe_deleted(db_session: Session) -> None:
    """Receita removida entre o objeto em memória e o reload por id."""
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="Del", slug=f"del-{sid.hex[:8]}"))
    flour = InventoryItem(id=uuid.uuid4(), store_id=sid, name="F", unit="kg")
    fin = InventoryItem(id=uuid.uuid4(), store_id=sid, name="Bolo", unit="un")
    db_session.add_all([flour, fin])
    prod = Product(
        id=uuid.uuid4(),
        store_id=sid,
        inventory_item_id=fin.id,
        name="Bolo",
        price=Decimal("10"),
        active=True,
    )
    db_session.add(prod)
    recipe = Recipe(
        id=uuid.uuid4(),
        store_id=sid,
        product_id=prod.id,
        yield_quantity=Decimal("1"),
        time_minutes=None,
    )
    db_session.add(recipe)
    db_session.add(
        RecipeItem(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            inventory_item_id=flour.id,
            quantity=Decimal("1"),
        )
    )
    db_session.add(
        InventoryBatch(
            id=uuid.uuid4(),
            item_id=flour.id,
            quantity_available=Decimal("10"),
            unit_cost=Decimal("1"),
        )
    )
    db_session.commit()

    recipe_ref = recipe
    db_session.delete(recipe)
    db_session.commit()

    with pytest.raises(ValueError, match="receita não encontrada"):
        execute_production(db_session, store_id=sid, recipe=recipe_ref, idempotency_key=None)


def test_execute_production_output_batch_expiration_from_shelf_life(
    db_session: Session,
) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="Shelf", slug=f"sh-{sid.hex[:8]}"))
    flour = InventoryItem(id=uuid.uuid4(), store_id=sid, name="F", unit="kg")
    fin = InventoryItem(id=uuid.uuid4(), store_id=sid, name="Bolo", unit="un")
    db_session.add_all([flour, fin])
    prod = Product(
        id=uuid.uuid4(),
        store_id=sid,
        inventory_item_id=fin.id,
        name="Bolo",
        price=Decimal("10"),
        active=True,
    )
    db_session.add(prod)
    recipe = Recipe(
        id=uuid.uuid4(),
        store_id=sid,
        product_id=prod.id,
        yield_quantity=Decimal("2"),
        time_minutes=None,
        output_shelf_life_days=5,
    )
    db_session.add(recipe)
    db_session.add(
        RecipeItem(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            inventory_item_id=flour.id,
            quantity=Decimal("1"),
        )
    )
    db_session.add(
        InventoryBatch(
            id=uuid.uuid4(),
            item_id=flour.id,
            quantity_available=Decimal("10"),
            unit_cost=Decimal("1"),
        )
    )
    db_session.commit()

    with patch("app.services.production_service.datetime") as mock_dt:
        mock_dt.now.return_value = datetime(2026, 4, 10, 12, 0, 0, tzinfo=UTC)
        mock_dt.UTC = UTC
        execute_production(db_session, store_id=sid, recipe=recipe, idempotency_key=None)

    db_session.flush()

    stmt = select(InventoryBatch).where(InventoryBatch.item_id == fin.id)
    out_batches = [
        b for b in db_session.scalars(stmt).all() if b.quantity_available > 0
    ]
    assert len(out_batches) == 1
    assert out_batches[0].expiration_date == date(2026, 4, 15)
