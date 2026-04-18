"""Listagem de insumos (gestão)."""

from uuid import UUID

from pydantic import BaseModel


class InventoryItemListOut(BaseModel):
    id: UUID
    name: str
    unit: str

    model_config = {"from_attributes": True}
