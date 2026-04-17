"""Dependências FastAPI (BD, utilizador atual)."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if sub is None:
            raise credentials_exc
        user_id = UUID(sub)
    except (JWTError, ValueError) as exc:
        raise credentials_exc from exc

    user = db.get(User, user_id)
    if user is None:
        raise credentials_exc

    store_id_claim = payload.get("store_id")
    if store_id_claim is None:
        raise credentials_exc
    try:
        claim_uuid = UUID(str(store_id_claim))
    except ValueError as exc:
        raise credentials_exc from exc
    if claim_uuid != user.store_id:
        raise credentials_exc

    return user


def get_current_store_id(user: Annotated[User, Depends(get_current_user)]) -> UUID:
    return user.store_id
