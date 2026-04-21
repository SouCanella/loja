"""Testes — margem alvo e mão de obra (`store_pricing`)."""

from __future__ import annotations

import uuid
from decimal import Decimal

from app.models.recipe import Recipe
from app.models.store import Store
from app.services.store_pricing import (
    DEFAULT_TARGET_MARGIN_PERCENT,
    effective_recipe_margin_percent,
    get_store_labor_rate_per_hour,
    get_store_target_margin_percent,
    set_store_labor_rate_per_hour,
    set_store_target_margin_percent,
    suggested_unit_price_from_cost,
)


def test_get_store_target_margin_defaults_and_invalid() -> None:
    s = Store(id=uuid.uuid4(), name="A", slug="a-x", config=None)
    assert get_store_target_margin_percent(s) == DEFAULT_TARGET_MARGIN_PERCENT
    s.config = {"pricing": {}}
    assert get_store_target_margin_percent(s) == DEFAULT_TARGET_MARGIN_PERCENT
    s.config = {"pricing": {"target_margin_percent": "not-a-number"}}
    assert get_store_target_margin_percent(s) == DEFAULT_TARGET_MARGIN_PERCENT
    s.config = {"pricing": {"target_margin_percent": "25.5"}}
    assert get_store_target_margin_percent(s) == Decimal("25.5")


def test_set_store_target_margin_percent() -> None:
    s = Store(id=uuid.uuid4(), name="B", slug="b-x", config={})
    set_store_target_margin_percent(s, Decimal("40"))
    assert s.config == {"pricing": {"target_margin_percent": "40"}}


def test_labor_rate_get_set_and_clear() -> None:
    s = Store(id=uuid.uuid4(), name="C", slug="c-x", config=None)
    assert get_store_labor_rate_per_hour(s) == Decimal("0")
    s.config = {"pricing": {"labor_rate_per_hour": "bad"}}
    assert get_store_labor_rate_per_hour(s) == Decimal("0")
    set_store_labor_rate_per_hour(s, Decimal("100"))
    assert get_store_labor_rate_per_hour(s) == Decimal("100")
    set_store_labor_rate_per_hour(s, Decimal("0"))
    assert "labor_rate_per_hour" not in (s.config or {}).get("pricing", {})


def test_effective_recipe_margin_percent() -> None:
    store = Store(
        id=uuid.uuid4(),
        name="D",
        slug="d-x",
        config={"pricing": {"target_margin_percent": "10"}},
    )
    r = Recipe(
        id=uuid.uuid4(),
        store_id=store.id,
        product_id=uuid.uuid4(),
        yield_quantity=Decimal("1"),
        target_margin_percent=Decimal("50"),
    )
    assert effective_recipe_margin_percent(store, r) == Decimal("50")
    r.target_margin_percent = None
    assert effective_recipe_margin_percent(store, r) == Decimal("10")


def test_suggested_unit_price_from_cost() -> None:
    assert suggested_unit_price_from_cost(None, Decimal("30")) is None
    p = suggested_unit_price_from_cost(Decimal("100"), Decimal("25"))
    assert p == Decimal("100") * (Decimal("1") + Decimal("25") / Decimal("100"))
