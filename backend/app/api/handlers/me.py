"""Perfil / margem — lógica partilhada v1/v2."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.store import Store
from app.models.user import User
from app.schemas.user import StorePricingPatch, UserMeResponse
from app.services.store_pricing import (
    get_store_target_margin_percent,
    set_store_target_margin_percent,
)


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


def read_me(db: Session, current: User) -> UserMeResponse:
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
        store_target_margin_percent=get_store_target_margin_percent(u.store),
    )


def patch_store_pricing(db: Session, current: User, body: StorePricingPatch) -> UserMeResponse:
    u = db.scalars(
        select(User).where(User.id == current.id).options(joinedload(User.store))
    ).first()
    if u is None or u.store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador inválido")
    set_store_target_margin_percent(u.store, body.target_margin_percent)
    db.add(u.store)
    db.commit()
    db.refresh(u)
    return UserMeResponse(
        id=u.id,
        email=u.email,
        role=u.role,
        store_id=u.store_id,
        store_slug=u.store.slug,
        store_name=u.store.name,
        created_at=u.created_at,
        vitrine_whatsapp=_vitrine_whatsapp_from_store(u.store),
        store_target_margin_percent=get_store_target_margin_percent(u.store),
    )
