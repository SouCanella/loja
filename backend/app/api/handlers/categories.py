"""Categorias — lógica partilhada v1/v2."""

import re
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.user import User
from app.schemas.catalog import CategoryCreate


def _slugify(raw: str) -> str:
    s = raw.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "categoria"


def list_categories(db: Session, current: User) -> list[Category]:
    q = select(Category).where(Category.store_id == current.store_id).order_by(Category.name)
    return list(db.scalars(q))


def create_category(db: Session, current: User, body: CategoryCreate) -> Category:
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


def delete_category(db: Session, current: User, category_id: UUID) -> None:
    cat = db.get(Category, category_id)
    if cat is None or cat.store_id != current.store_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada",
        )
    db.delete(cat)
    db.commit()
