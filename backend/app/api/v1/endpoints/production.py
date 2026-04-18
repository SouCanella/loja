"""Ordem de produção (idempotência RNF-Arq-02b)."""

from typing import Annotated

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.production_run import ProductionRun
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.phase3 import ProductionRequest, ProductionRunOut
from app.services.production_service import execute_production
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

router = APIRouter(tags=["production"])


def _to_out(run: ProductionRun) -> ProductionRunOut:
    return ProductionRunOut(
        id=run.id,
        recipe_id=run.recipe_id,
        output_quantity=run.output_quantity,
        total_input_cost=run.total_input_cost,
        unit_output_cost=run.unit_output_cost,
        created_at=run.created_at.isoformat(),
    )


@router.post("", response_model=ProductionRunOut, status_code=status.HTTP_201_CREATED)
def post_production(
    body: ProductionRequest,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
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
            return _to_out(existing)

    recipe = db.scalars(
        select(Recipe)
        .where(Recipe.id == body.recipe_id, Recipe.store_id == current.store_id)
        .options(joinedload(Recipe.items))
    ).first()
    if recipe is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Receita não encontrada")

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
                return _to_out(existing)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflito ao registar produção",
        ) from None
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    else:
        return _to_out(run)
