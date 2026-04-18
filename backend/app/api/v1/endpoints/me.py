"""Perfil do utilizador autenticado."""

from typing import Annotated

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.store import Store
from app.models.user import User
from app.schemas.user import UserMeResponse
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

router = APIRouter(tags=["me"])


def _vitrine_whatsapp_from_store(store: Store) -> str | None:
    raw = store.theme
    if not isinstance(raw, dict):
        return None
    inner = raw.get("vitrine")
    v = inner if isinstance(inner, dict) else raw
    w = v.get("whatsapp")
    if isinstance(w, str) and w.strip():
        return w.strip()
    return None


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
        vitrine_whatsapp=_vitrine_whatsapp_from_store(u.store),
    )
