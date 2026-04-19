"""Categorias — envelope DEC-06."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.handlers import categories as categories_handlers
from app.db.session import get_db
from app.models.user import User
from app.schemas.catalog import CategoryCreate, CategoryOut
from app.schemas.envelope import CategoryEnvelope, CategoryListEnvelope, DeleteSuccessEnvelope

router = APIRouter(tags=["categories-v2"])


@router.get("/categories", response_model=CategoryListEnvelope)
def list_categories_v2(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> CategoryListEnvelope:
    rows = categories_handlers.list_categories(db, current)
    data = [CategoryOut.model_validate(r) for r in rows]
    return CategoryListEnvelope(success=True, data=data, errors=None)


@router.post("/categories", response_model=CategoryEnvelope, status_code=status.HTTP_201_CREATED)
def create_category_v2(
    body: CategoryCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> CategoryEnvelope:
    row = categories_handlers.create_category(db, current, body)
    return CategoryEnvelope(success=True, data=CategoryOut.model_validate(row), errors=None)


@router.delete("/categories/{category_id}", response_model=DeleteSuccessEnvelope)
def delete_category_v2(
    category_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> DeleteSuccessEnvelope:
    categories_handlers.delete_category(db, current, category_id)
    return DeleteSuccessEnvelope(success=True, data=None, errors=None)
