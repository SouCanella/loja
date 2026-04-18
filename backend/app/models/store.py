"""Loja (tenant)."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.inventory import InventoryItem
    from app.models.order import Order
    from app.models.product import Product
    from app.models.user import User


class Store(Base):
    __tablename__ = "stores"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True, nullable=False)
    theme: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    config: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    users: Mapped[list["User"]] = relationship("User", back_populates="store")
    categories: Mapped[list["Category"]] = relationship(
        "Category", back_populates="store", cascade="all, delete-orphan"
    )
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="store", cascade="all, delete-orphan"
    )
    inventory_items: Mapped[list["InventoryItem"]] = relationship(
        "InventoryItem", back_populates="store", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="store",
        cascade="all, delete-orphan",
    )
