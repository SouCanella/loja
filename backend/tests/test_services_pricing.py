"""Testes — custo médio ponderado e receita (camada pricing)."""

import uuid
from decimal import Decimal

from app.models.inventory import InventoryBatch, InventoryItem
from app.models.product import Product
from app.models.recipe import Recipe, RecipeItem
from app.models.store import Store
from app.services.pricing import estimate_recipe_unit_cost, weighted_average_unit_cost
from sqlalchemy.orm import Session


def test_weighted_average_two_batches(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="T", slug=f"t-{sid.hex[:8]}"))
    item = InventoryItem(id=uuid.uuid4(), store_id=sid, name="Farinha", unit="kg")
    db_session.add(item)
    db_session.add_all(
        [
            InventoryBatch(
                id=uuid.uuid4(),
                item_id=item.id,
                quantity_available=Decimal("10"),
                unit_cost=Decimal("1.00"),
            ),
            InventoryBatch(
                id=uuid.uuid4(),
                item_id=item.id,
                quantity_available=Decimal("10"),
                unit_cost=Decimal("3.00"),
            ),
        ]
    )
    db_session.commit()

    w = weighted_average_unit_cost(db_session, item.id)
    assert w == Decimal("2")


def test_weighted_average_no_stock_returns_zero(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="T2", slug=f"t2-{sid.hex[:8]}"))
    item = InventoryItem(id=uuid.uuid4(), store_id=sid, name="Vazio", unit="un")
    db_session.add(item)
    db_session.commit()

    assert weighted_average_unit_cost(db_session, item.id) == Decimal("0")


def test_estimate_recipe_unit_cost(db_session: Session) -> None:
    sid = uuid.uuid4()
    db_session.add(Store(id=sid, name="Padaria", slug=f"p-{sid.hex[:8]}"))

    flour = InventoryItem(id=uuid.uuid4(), store_id=sid, name="Farinha", unit="kg")
    db_session.add(flour)
    db_session.add(
        InventoryBatch(
            id=uuid.uuid4(),
            item_id=flour.id,
            quantity_available=Decimal("100"),
            unit_cost=Decimal("2.00"),
        )
    )

    prod_item = InventoryItem(id=uuid.uuid4(), store_id=sid, name="Bolo", unit="un")
    db_session.add(prod_item)

    product = Product(
        id=uuid.uuid4(),
        store_id=sid,
        inventory_item_id=prod_item.id,
        name="Bolo simples",
        price=Decimal("30.00"),
        active=True,
    )
    db_session.add(product)

    recipe = Recipe(
        id=uuid.uuid4(),
        store_id=sid,
        product_id=product.id,
        yield_quantity=Decimal("10"),
        time_minutes=None,
    )
    db_session.add(recipe)
    db_session.add(
        RecipeItem(
            id=uuid.uuid4(),
            recipe_id=recipe.id,
            inventory_item_id=flour.id,
            quantity=Decimal("5"),
        )
    )
    db_session.commit()

    unit = estimate_recipe_unit_cost(db_session, recipe)
    # (5 kg * 2 R$/kg) / 10 unidades = 1 R$/un
    assert unit == Decimal("1")
