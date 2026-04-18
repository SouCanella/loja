"""Perfil do utilizador autenticado."""

from typing import Annotated

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserMeResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

router = APIRouter(tags=["me"])


@router.get("/me", response_model=UserMeResponse)
def read_me(
    current: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserMeResponse:
    u = db.scalars(
        select(User).where(User.id == current.id).options(joinedload(User.store))
    ).first()
    if u is None or u.store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador inválido")
    return UserMeResponse(
        id=u.id,
        email=u.email,
        role=u.role,
        store_id=u.store_id,
        store_slug=u.store.slug,
        store_name=u.store.name,
        created_at=u.created_at,
    )
