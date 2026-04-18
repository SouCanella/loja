"""Execução de produção (idempotência RNF-Arq-02b)."""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.order import StockMovement
    from app.models.recipe import Recipe
    from app.models.store import Store


class ProductionRun(Base):
    __tablename__ = "production_runs"
    __table_args__ = (
        UniqueConstraint(
            "store_id",
            "idempotency_key",
            name="uq_production_runs_store_idempotency",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("stores.id", ondelete="CASCADE"), index=True
    )
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("recipes.id", ondelete="RESTRICT"), index=True
    )
    idempotency_key: Mapped[str | None] = mapped_column(String(128), nullable=True)
    output_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    total_input_cost: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    unit_output_cost: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    store: Mapped["Store"] = relationship("Store", back_populates="production_runs")
    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="production_runs")
    stock_movements: Mapped[list["StockMovement"]] = relationship(
        "StockMovement", back_populates="production_run"
    )
