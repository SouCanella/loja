"""Cliente final (conta na vitrine de uma loja)."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.store import Store


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (UniqueConstraint("store_id", "email", name="uq_customers_store_email"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    store_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    #: `vitrine`: registo público; `painel_manual`: criado no painel (sem login obrigatório).
    source: Mapped[str] = mapped_column(String(32), nullable=False, server_default="vitrine")
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    @property
    def has_vitrine_login(self) -> bool:
        return self.password_hash is not None

    store: Mapped["Store"] = relationship("Store", back_populates="customers")
    orders: Mapped[list["Order"]] = relationship(
        "Order",
        back_populates="customer_account",
        foreign_keys="Order.customer_id",
    )
