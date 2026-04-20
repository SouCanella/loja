"""Produção — lógica partilhada v1/v2."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.production_run import ProductionRun
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.phase3 import ProductionRequest, ProductionRunOut
from app.services.production_service import execute_production


def production_run_to_out(run: ProductionRun) -> ProductionRunOut:
    return ProductionRunOut(
        id=run.id,
        recipe_id=run.recipe_id,
        output_quantity=run.output_quantity,
        total_input_cost=run.total_input_cost,
        unit_output_cost=run.unit_output_cost,
        created_at=run.created_at.isoformat(),
    )


def post_production(
    db: Session,
    current: User,
    body: ProductionRequest,
    *,
    idempotency_key: str | None,
) -> ProductionRunOut:
    key = idempotency_key.strip() if idempotency_key else None
    if key:
        existing = db.scalars(
            select(ProductionRun).where(
                ProductionRun.store_id == current.store_id,
                ProductionRun.idempotency_key == key,
            )
        ).first()
        if existing:
            return production_run_to_out(existing)

    recipe = db.scalars(
        select(Recipe)
        .where(Recipe.id == body.recipe_id, Recipe.store_id == current.store_id)
        .options(joinedload(Recipe.items))
    ).first()
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receita não encontrada")
    if not recipe.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Receita inactiva — reactivar antes de produzir.",
        )

    try:
        run = execute_production(
            db,
            store_id=current.store_id,
            recipe=recipe,
            idempotency_key=key,
        )
        db.commit()
        db.refresh(run)
    except IntegrityError:
        db.rollback()
        if key:
            existing = db.scalars(
                select(ProductionRun).where(
                    ProductionRun.store_id == current.store_id,
                    ProductionRun.idempotency_key == key,
                )
            ).first()
            if existing:
                return production_run_to_out(existing)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflito ao registar produção",
        ) from None
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    else:
        return production_run_to_out(run)
