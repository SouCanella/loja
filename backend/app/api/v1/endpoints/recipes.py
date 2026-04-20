"""CRUD de receitas."""

from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.api.handlers import recipes as recipes_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.phase3 import RecipeCreate, RecipeOut, RecipePatch
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["recipes"])


@router.get("", response_model=list[RecipeOut])
def list_recipes(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
    include_inactive: bool = Query(False),
) -> list[RecipeOut]:
    return recipes_handlers.list_recipes(db, current, include_inactive=include_inactive)


@router.post("", response_model=RecipeOut, status_code=status.HTTP_201_CREATED)
def create_recipe(
    body: RecipeCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> RecipeOut:
    return recipes_handlers.create_recipe(db, current, body)


@router.get("/{recipe_id}", response_model=RecipeOut)
def get_recipe(
    recipe_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> RecipeOut:
    return recipes_handlers.get_recipe(db, current, recipe_id)


@router.patch("/{recipe_id}", response_model=RecipeOut)
def patch_recipe(
    recipe_id: UUID,
    body: RecipePatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> RecipeOut:
    return recipes_handlers.patch_recipe(db, current, recipe_id, body)
