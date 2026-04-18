"""Produto do catálogo."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.inventory import InventoryItem
    from app.models.order import OrderItem
    from app.models.recipe import Recipe
    from app.models.store import Store


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (UniqueConstraint("inventory_item_id", name="uq_products_inventory_item_id"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), index=True
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    inventory_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("inventory_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    store: Mapped["Store"] = relationship("Store", back_populates="products")
    category: Mapped["Category | None"] = relationship("Category", back_populates="products")
    inventory_item: Mapped["InventoryItem"] = relationship(
        "InventoryItem", back_populates="product", uselist=False
    )
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")
    recipe: Mapped["Recipe | None"] = relationship(
        "Recipe", back_populates="product", uselist=False
    )
