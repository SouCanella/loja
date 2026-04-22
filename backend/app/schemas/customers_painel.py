"""Clientes da loja — gestão pelo painel (lojista)."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class StaffCustomerCreate(BaseModel):
    """Contacto no painel (`painel_manual`). E-mail opcional; sem palavra-passe na vitrine."""

    contact_name: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=3, max_length=32)
    email: EmailStr | None = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_str_to_none(cls, v: object) -> object:
        if v == "":
            return None
        return v


class StaffCustomerOut(BaseModel):
    id: UUID
    source: str
    contact_name: str | None
    phone: str | None
    email: str | None
    has_vitrine_login: bool
    created_at: datetime

    model_config = {"from_attributes": True}
