"""Auth com envelope DEC-06."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.login_rate_limit import register_login_attempt
from app.db.session import get_db
from app.schemas.auth import RefreshRequest, RegisterRequest
from app.schemas.envelope import RegisterEnvelope, TokenEnvelope
from app.services.auth_session import (
    login_with_credentials,
    refresh_session_tokens,
    register_store_and_admin,
)

router = APIRouter(tags=["auth-v2"])


@router.post("/auth/register", response_model=RegisterEnvelope, status_code=status.HTTP_201_CREATED)
def register_v2(body: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> RegisterEnvelope:
    try:
        out = register_store_and_admin(db, body)
        return RegisterEnvelope(success=True, data=out, errors=None)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email ou slug da loja já em uso",
        ) from None


@router.post("/auth/login", response_model=TokenEnvelope)
def login_v2(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
) -> TokenEnvelope:
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
    return TokenEnvelope(success=True, data=tokens, errors=None)


@router.post("/auth/refresh", response_model=TokenEnvelope)
def refresh_v2(body: RefreshRequest, db: Annotated[Session, Depends(get_db)]) -> TokenEnvelope:
    tokens = refresh_session_tokens(db, body.refresh_token)
    if tokens is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado",
        )
    return TokenEnvelope(success=True, data=tokens, errors=None)
