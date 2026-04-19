"""Receitas — envelope DEC-06."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import recipes as recipes_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.envelope import RecipeEnvelope, RecipeListEnvelope
from app.schemas.phase3 import RecipeCreate, RecipePatch

router = APIRouter(tags=["recipes-v2"])


@router.get("/recipes", response_model=RecipeListEnvelope)
def list_recipes_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> RecipeListEnvelope:
    data = recipes_handlers.list_recipes(db, current)
    return RecipeListEnvelope(success=True, data=data, errors=None)


@router.post("/recipes", response_model=RecipeEnvelope, status_code=status.HTTP_201_CREATED)
def create_recipe_v2(
    body: RecipeCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> RecipeEnvelope:
    data = recipes_handlers.create_recipe(db, current, body)
    return RecipeEnvelope(success=True, data=data, errors=None)


@router.get("/recipes/{recipe_id}", response_model=RecipeEnvelope)
def get_recipe_v2(
    recipe_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> RecipeEnvelope:
    data = recipes_handlers.get_recipe(db, current, recipe_id)
    return RecipeEnvelope(success=True, data=data, errors=None)


@router.patch("/recipes/{recipe_id}", response_model=RecipeEnvelope)
def patch_recipe_v2(
    recipe_id: UUID,
    body: RecipePatch,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> RecipeEnvelope:
    data = recipes_handlers.patch_recipe(db, current, recipe_id, body)
    return RecipeEnvelope(success=True, data=data, errors=None)
