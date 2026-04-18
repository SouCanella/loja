"""Categoria por loja (DEC-20)."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.product import Product
    from app.models.store import Store


class Category(Base):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("store_id", "slug", name="uq_categories_store_slug"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    store: Mapped["Store"] = relationship("Store", back_populates="categories")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")
