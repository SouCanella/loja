"""Registo e login."""

from typing import Annotated

from app.core.config import get_settings
from app.core.login_rate_limit import register_login_attempt
from app.db.session import get_db
from app.schemas.auth import RefreshRequest, RegisterRequest, RegisterResponse, TokenResponse
from app.services.auth_session import (
    login_with_credentials,
    refresh_session_tokens,
    register_store_and_admin,
)
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> RegisterResponse:
    try:
        return register_store_and_admin(db, body)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email ou slug da loja já em uso",
        ) from exc


@router.post("/auth/login", response_model=TokenResponse)
def login(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> TokenResponse:
    """OAuth2 password: campo `username` deve ser o email."""
    settings = get_settings()
    client_ip = request.client.host if request.client else "unknown"
    register_login_attempt(
        client_ip,
        max_attempts=settings.login_rate_limit_max_attempts,
        window_seconds=settings.login_rate_limit_window_seconds,
    )
    email = form.username.strip().lower()
    tokens = login_with_credentials(db, email, form.password)
    if tokens is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou palavra-passe incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return tokens


@router.post("/auth/refresh", response_model=TokenResponse)
def refresh_session(body: RefreshRequest, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    tokens = refresh_session_tokens(db, body.refresh_token)
    if tokens is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado",
        )
    return tokens
