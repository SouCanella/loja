"""Receitas e linhas de insumo (Fase 3)."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.inventory import InventoryItem
    from app.models.product import Product
    from app.models.production_run import ProductionRun
    from app.models.store import Store


class Recipe(Base):
    __tablename__ = "recipes"
    __table_args__ = (UniqueConstraint("store_id", "product_id", name="uq_recipes_store_product"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True
    )
    yield_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    time_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Margem alvo % (None = herda stores.config.pricing.target_margin_percent)
    target_margin_percent: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    store: Mapped["Store"] = relationship("Store", back_populates="recipes")
    product: Mapped["Product"] = relationship("Product", back_populates="recipe")
    items: Mapped[list["RecipeItem"]] = relationship(
        "RecipeItem", back_populates="recipe", cascade="all, delete-orphan"
    )
    production_runs: Mapped[list["ProductionRun"]] = relationship(
        "ProductionRun", back_populates="recipe"
    )


class RecipeItem(Base):
    __tablename__ = "recipe_items"
    __table_args__ = (
        UniqueConstraint("recipe_id", "inventory_item_id", name="uq_recipe_items_recipe_item"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"), index=True
    )
    inventory_item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("inventory_items.id", ondelete="RESTRICT"), index=True
    )
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="items")
    inventory_item: Mapped["InventoryItem"] = relationship(
        "InventoryItem", back_populates="recipe_lines"
    )
