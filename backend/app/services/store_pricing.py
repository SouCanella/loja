"""Margem alvo (loja e receita) para precificação."""

from decimal import Decimal

from app.models.recipe import Recipe
from app.models.store import Store

DEFAULT_TARGET_MARGIN_PERCENT = Decimal("30")


def get_store_target_margin_percent(store: Store) -> Decimal:
    raw = (store.config or {}).get("pricing", {}).get("target_margin_percent")
    if raw is None:
        return DEFAULT_TARGET_MARGIN_PERCENT
    try:
        return Decimal(str(raw))
    except Exception:
        return DEFAULT_TARGET_MARGIN_PERCENT


def set_store_target_margin_percent(store: Store, value: Decimal) -> None:
    cfg = dict(store.config or {})
    pricing = dict(cfg.get("pricing") or {})
    pricing["target_margin_percent"] = str(value)
    cfg["pricing"] = pricing
    store.config = cfg


def get_store_labor_rate_per_hour(store: Store) -> Decimal:
    raw = (store.config or {}).get("pricing", {}).get("labor_rate_per_hour")
    if raw is None:
        return Decimal("0")
    try:
        return Decimal(str(raw))
    except Exception:
        return Decimal("0")


def set_store_labor_rate_per_hour(store: Store, value: Decimal) -> None:
    cfg = dict(store.config or {})
    pricing = dict(cfg.get("pricing") or {})
    if value <= 0:
        pricing.pop("labor_rate_per_hour", None)
    else:
        pricing["labor_rate_per_hour"] = str(value)
    cfg["pricing"] = pricing
    store.config = cfg


def effective_recipe_margin_percent(store: Store, recipe: Recipe) -> Decimal:
    if recipe.target_margin_percent is not None:
        return recipe.target_margin_percent
    return get_store_target_margin_percent(store)


def suggested_unit_price_from_cost(
    unit_cost: Decimal | None,
    margin_percent: Decimal,
) -> Decimal | None:
    if unit_cost is None:
        return None
    return unit_cost * (Decimal("1") + margin_percent / Decimal("100"))
