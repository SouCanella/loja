"""Insumo mestre e lotes (DEC-08, DEC-17)."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.store import Store


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False, default="un")

    store: Mapped["Store"] = relationship("Store", back_populates="inventory_items")
    batches: Mapped[list["InventoryBatch"]] = relationship(
        "InventoryBatch", back_populates="item", cascade="all, delete-orphan"
    )
    product: Mapped["Product | None"] = relationship("Product", back_populates="inventory_item")


class InventoryBatch(Base):
    __tablename__ = "inventory_batches"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inventory_items.id", ondelete="CASCADE"),
        index=True,
    )
    quantity_available: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    expiration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    item: Mapped["InventoryItem"] = relationship("InventoryItem", back_populates="batches")
