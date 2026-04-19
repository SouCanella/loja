"""Categorias (DEC-20)."""

from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.api.handlers import categories as categories_handlers
from app.db.session import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.catalog import CategoryCreate, CategoryOut
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter(tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> list[Category]:
    return categories_handlers.list_categories(db, current)


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    body: CategoryCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Category:
    return categories_handlers.create_category(db, current, body)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> None:
    categories_handlers.delete_category(db, current, category_id)
