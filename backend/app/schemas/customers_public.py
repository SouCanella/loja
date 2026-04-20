"""Schemas — contas de cliente na vitrine (público)."""

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.auth import TokenResponse


class CustomerRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class CustomerLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class CustomerAuthResponse(TokenResponse):
    customer_id: UUID
    store_id: UUID


class CustomerMeOut(BaseModel):
    email: str
    store_slug: str
