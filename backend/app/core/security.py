"""Password hashing e JWT (access token)."""

from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from app.core.config import get_settings
from jose import jwt


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))


def create_access_token(
    subject: str,
    extra: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    settings = get_settings()
    expire = datetime.now(UTC) + (
        expires_delta if expires_delta else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode: dict[str, Any] = {"exp": expire, "sub": subject, **extra}
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def create_refresh_token(
    subject: str,
    extra: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    settings = get_settings()
    expire = datetime.now(UTC) + (
        expires_delta
        if expires_delta
        else timedelta(days=settings.refresh_token_expire_days)
    )
    to_encode: dict[str, Any] = {
        "exp": expire,
        "sub": subject,
        "token_use": "refresh",
        **extra,
    }
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_refresh_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    if payload.get("token_use") != "refresh":
        raise ValueError("token não é refresh")
    return payload
