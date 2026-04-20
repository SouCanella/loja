"""Perfil / margem — lógica partilhada v1/v2."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.store import Store
from app.models.user import User
from app.core.security import hash_password, verify_password
from app.schemas.user import (
    StorePricingPatch,
    StoreSettingsPatch,
    UserMeResponse,
    UserPasswordPatch,
)
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


def _vitrine_theme_from_store(store: Store) -> dict | None:
    raw = store.theme
    if not isinstance(raw, dict):
        return None
    inner = raw.get("vitrine")
    if not isinstance(inner, dict):
        return None
    return dict(inner)


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
        vitrine_theme=_vitrine_theme_from_store(u.store),
        store_target_margin_percent=get_store_target_margin_percent(u.store),
    )


def patch_store_settings(db: Session, current: User, body: StoreSettingsPatch) -> UserMeResponse:
    u = db.scalars(
        select(User).where(User.id == current.id).options(joinedload(User.store))
    ).first()
    if u is None or u.store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador inválido")
    store = u.store
    if body.store_name is not None:
        store.name = body.store_name.strip()
    if body.store_slug is not None:
        taken = db.scalars(
            select(Store.id).where(Store.slug == body.store_slug, Store.id != store.id)
        ).first()
        if taken is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este slug já está em uso.",
            )
        store.slug = body.store_slug
    if body.theme is not None:
        base = dict(store.theme) if isinstance(store.theme, dict) else {}
        for key, val in body.theme.items():
            if key == "vitrine" and isinstance(val, dict):
                vit = base.get("vitrine")
                inner = dict(vit or {}) if isinstance(vit, dict) else {}
                inner.update(val)
                base["vitrine"] = inner
            else:
                base[key] = val
        store.theme = base
    if body.config is not None:
        base_c = dict(store.config) if isinstance(store.config, dict) else {}
        for key, val in body.config.items():
            if key == "general" and isinstance(val, dict):
                gen = base_c.get("general")
                inner = dict(gen or {}) if isinstance(gen, dict) else {}
                inner.update(val)
                base_c["general"] = inner
            else:
                base_c[key] = val
        store.config = base_c
    db.add(store)
    db.commit()
    db.refresh(u)
    return read_me(db, current)


def patch_user_password(db: Session, current: User, body: UserPasswordPatch) -> UserMeResponse:
    u = db.scalars(
        select(User).where(User.id == current.id).options(joinedload(User.store))
    ).first()
    if u is None or u.store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilizador inválido")
    if not verify_password(body.current_password, u.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha actual incorrecta.",
        )
    u.password_hash = hash_password(body.new_password)
    db.add(u)
    db.commit()
    db.refresh(u)
    return read_me(db, current)


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
        vitrine_theme=_vitrine_theme_from_store(u.store),
        store_target_margin_percent=get_store_target_margin_percent(u.store),
    )
