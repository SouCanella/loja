"""Schemas de autenticação."""

import re
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

_SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class RegisterRequest(BaseModel):
    store_name: str = Field(..., min_length=1, max_length=255)
    store_slug: str = Field(..., min_length=2, max_length=80)
    admin_email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("store_slug")
    @classmethod
    def slug_format(cls, v: str) -> str:
        s = v.strip().lower()
        if not _SLUG_RE.match(s):
            raise ValueError("slug inválido: use minúsculas, números e hífens")
        return s


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class RegisterResponse(TokenResponse):
    store_id: UUID
    user_id: UUID
