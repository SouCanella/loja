"""Dependências FastAPI (BD, utilizador atual)."""

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.customer import Customer
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")
_http_bearer_optional = HTTPBearer(auto_error=False)


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
        if payload.get("role") == "customer":
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


def get_current_customer(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> Customer:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if sub is None or payload.get("role") != "customer":
            raise credentials_exc
        cid = UUID(sub)
    except (JWTError, ValueError) as exc:
        raise credentials_exc from exc

    customer = db.get(Customer, cid)
    if customer is None:
        raise credentials_exc

    store_id_claim = payload.get("store_id")
    if store_id_claim is None:
        raise credentials_exc
    try:
        claim_uuid = UUID(str(store_id_claim))
    except ValueError as exc:
        raise credentials_exc from exc
    if claim_uuid != customer.store_id:
        raise credentials_exc

    return customer


def get_optional_customer(
    db: Annotated[Session, Depends(get_db)],
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(_http_bearer_optional)],
) -> Customer | None:
    """Bearer opcional: cliente vitrine (`role: customer`). Staff ou inválido → None."""
    if creds is None:
        return None
    try:
        payload = decode_access_token(creds.credentials)
        sub = payload.get("sub")
        if sub is None or payload.get("role") != "customer":
            return None
        cid = UUID(sub)
    except (JWTError, ValueError):
        return None

    customer = db.get(Customer, cid)
    if customer is None:
        return None

    store_id_claim = payload.get("store_id")
    if store_id_claim is None:
        return None
    try:
        claim_uuid = UUID(str(store_id_claim))
    except ValueError:
        return None
    if claim_uuid != customer.store_id:
        return None

    return customer
