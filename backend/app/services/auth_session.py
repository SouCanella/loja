"""Emissão de tokens e fluxos de registo/login (partilhado v1/v2)."""

from uuid import UUID

from jose import JWTError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models.store import Store
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, RegisterResponse, TokenResponse


def issue_tokens_for_user(user: User) -> TokenResponse:
    extra = {
        "store_id": str(user.store_id),
        "email": user.email,
        "role": user.role.value,
    }
    access = create_access_token(subject=str(user.id), extra=extra)
    refresh = create_refresh_token(subject=str(user.id), extra=extra)
    return TokenResponse(access_token=access, token_type="bearer", refresh_token=refresh)


def register_store_and_admin(db: Session, body: RegisterRequest) -> RegisterResponse:
    store = Store(name=body.store_name.strip(), slug=body.store_slug)
    user = User(
        store=store,
        email=str(body.admin_email).lower().strip(),
        password_hash=hash_password(body.password),
        role=UserRole.store_admin,
    )
    db.add(store)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(user)
    db.refresh(store)
    tokens = issue_tokens_for_user(user)
    return RegisterResponse(
        access_token=tokens.access_token,
        token_type=tokens.token_type,
        refresh_token=tokens.refresh_token,
        store_id=store.id,
        user_id=user.id,
    )


def login_with_credentials(db: Session, email: str, password: str) -> TokenResponse | None:
    user = db.scalars(select(User).where(User.email == email)).first()
    if user is None or not verify_password(password, user.password_hash):
        return None
    return issue_tokens_for_user(user)


def refresh_session_tokens(db: Session, refresh_token: str) -> TokenResponse | None:
    try:
        payload = decode_refresh_token(refresh_token)
    except (JWTError, ValueError):
        return None
    try:
        user_id = UUID(str(payload.get("sub")))
    except ValueError:
        return None
    user = db.get(User, user_id)
    if user is None:
        return None
    claim_store = payload.get("store_id")
    if claim_store is None or str(user.store_id) != str(claim_store):
        return None
    return issue_tokens_for_user(user)
