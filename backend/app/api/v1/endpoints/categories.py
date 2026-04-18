"""Categorias (DEC-20)."""

import re
from typing import Annotated
from uuid import UUID

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.catalog import CategoryCreate, CategoryOut
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

router = APIRouter(tags=["categories"])


def _slugify(raw: str) -> str:
    s = raw.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "categoria"


@router.get("", response_model=list[CategoryOut])
def list_categories(
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> list[Category]:
    q = select(Category).where(Category.store_id == current.store_id).order_by(Category.name)
    return list(db.scalars(q))


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    body: CategoryCreate,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> Category:
    slug = _slugify(body.slug)
    cat = Category(store_id=current.store_id, name=body.name.strip(), slug=slug)
    db.add(cat)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug ou nome em conflito")
    db.refresh(cat)
    return cat


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current: Annotated[User, Depends(get_current_user)],
) -> None:
    cat = db.get(Category, category_id)
    if cat is None or cat.store_id != current.store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada",
        )
    db.delete(cat)
    db.commit()
