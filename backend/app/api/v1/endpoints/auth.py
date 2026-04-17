"""Registo e login."""

from typing import Annotated

from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.store import Store
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, RegisterResponse, TokenResponse
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> RegisterResponse:
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
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email ou slug da loja já em uso",
        ) from exc

    db.refresh(user)
    db.refresh(store)
    token = create_access_token(
        subject=str(user.id),
        extra={
            "store_id": str(user.store_id),
            "email": user.email,
            "role": user.role.value,
        },
    )
    return RegisterResponse(
        access_token=token,
        token_type="bearer",
        store_id=store.id,
        user_id=user.id,
    )


@router.post("/auth/login", response_model=TokenResponse)
def login(
    db: Annotated[Session, Depends(get_db)],
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> TokenResponse:
    """OAuth2 password: campo `username` deve ser o email."""
    email = form.username.strip().lower()
    user = db.scalars(select(User).where(User.email == email)).first()
    if user is None or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou palavra-passe incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(
        subject=str(user.id),
        extra={
            "store_id": str(user.store_id),
            "email": user.email,
            "role": user.role.value,
        },
    )
    return TokenResponse(access_token=token, token_type="bearer")
