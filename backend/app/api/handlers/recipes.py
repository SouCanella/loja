"""Receitas — lógica partilhada v1/v2."""

from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models.inventory import InventoryItem
from app.models.product import Product
from app.models.recipe import Recipe, RecipeItem
from app.models.store import Store
from app.models.user import User
from app.schemas.phase3 import RecipeCreate, RecipeItemOut, RecipeOut, RecipePatch
from app.services.pricing import estimate_recipe_unit_cost
from app.services.store_pricing import (
    effective_recipe_margin_percent,
    suggested_unit_price_from_cost,
)


def recipe_to_out(db: Session, r: Recipe) -> RecipeOut:
    est: Decimal | None = None
    try:
        est = estimate_recipe_unit_cost(db, r)
    except Exception:
        est = None
    store = db.get(Store, r.store_id)
    assert store is not None
    eff = effective_recipe_margin_percent(store, r)
    sug = suggested_unit_price_from_cost(est, eff)
    return RecipeOut(
        id=r.id,
        product_id=r.product_id,
        yield_quantity=r.yield_quantity,
        time_minutes=r.time_minutes,
        items=[RecipeItemOut.model_validate(x) for x in r.items],
        estimated_unit_cost=est,
        target_margin_percent=r.target_margin_percent,
        effective_margin_percent=eff,
        suggested_unit_price=sug,
    )


def list_recipes(db: Session, current: User) -> list[RecipeOut]:
    rows = db.scalars(
        select(Recipe)
        .where(Recipe.store_id == current.store_id)
        .options(selectinload(Recipe.items))
        .order_by(Recipe.created_at.desc())
    ).all()
    return [recipe_to_out(db, r) for r in rows]


def create_recipe(db: Session, current: User, body: RecipeCreate) -> RecipeOut:
    p = db.get(Product, body.product_id)
    if p is None or p.store_id != current.store_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Produto inválido")

    dup = db.scalars(
        select(Recipe).where(
            Recipe.store_id == current.store_id,
            Recipe.product_id == body.product_id,
        )
    ).first()
    if dup:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe receita para este produto",
        )

    seen: set[UUID] = set()
    for it in body.items:
        if it.inventory_item_id in seen:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insumo duplicado")
        seen.add(it.inventory_item_id)
        inv = db.get(InventoryItem, it.inventory_item_id)
        if inv is None or inv.store_id != current.store_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insumo inválido")
        if inv.id == p.inventory_item_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insumo não pode ser o mesmo do produto acabado",
            )

    recipe = Recipe(
        store_id=current.store_id,
        product_id=body.product_id,
        yield_quantity=body.yield_quantity,
        time_minutes=body.time_minutes,
        target_margin_percent=body.target_margin_percent,
    )
    for it in body.items:
        recipe.items.append(
            RecipeItem(inventory_item_id=it.inventory_item_id, quantity=it.quantity)
        )
    db.add(recipe)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não foi possível criar a receita",
        ) from None
    db.refresh(recipe)
    r = db.scalars(
        select(Recipe)
        .where(Recipe.id == recipe.id)
        .options(selectinload(Recipe.items))
    ).first()
    assert r is not None
    return recipe_to_out(db, r)


def get_recipe(db: Session, current: User, recipe_id: UUID) -> RecipeOut:
    r = db.scalars(
        select(Recipe)
        .where(Recipe.id == recipe_id, Recipe.store_id == current.store_id)
        .options(selectinload(Recipe.items))
    ).first()
    if r is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receita não encontrada")
    return recipe_to_out(db, r)


def patch_recipe(db: Session, current: User, recipe_id: UUID, body: RecipePatch) -> RecipeOut:
    r = db.scalars(
        select(Recipe)
        .where(Recipe.id == recipe_id, Recipe.store_id == current.store_id)
        .options(selectinload(Recipe.items))
    ).first()
    if r is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receita não encontrada")

    if body.yield_quantity is not None:
        r.yield_quantity = body.yield_quantity
    if body.time_minutes is not None:
        r.time_minutes = body.time_minutes

    patch_data = body.model_dump(exclude_unset=True)
    if "target_margin_percent" in patch_data:
        r.target_margin_percent = patch_data["target_margin_percent"]

    if body.items is not None:
        p = db.get(Product, r.product_id)
        assert p is not None
        seen: set[UUID] = set()
        for it in body.items:
            if it.inventory_item_id in seen:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insumo duplicado",
                )
            seen.add(it.inventory_item_id)
            inv = db.get(InventoryItem, it.inventory_item_id)
            if inv is None or inv.store_id != current.store_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insumo inválido",
                )
            if inv.id == p.inventory_item_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Insumo não pode ser o mesmo do produto acabado",
                )
        r.items.clear()
        for it in body.items:
            r.items.append(
                RecipeItem(inventory_item_id=it.inventory_item_id, quantity=it.quantity)
            )

    db.commit()
    db.refresh(r)
    r2 = db.scalars(
        select(Recipe)
        .where(Recipe.id == r.id)
        .options(selectinload(Recipe.items))
    ).first()
    assert r2 is not None
    return recipe_to_out(db, r2)
