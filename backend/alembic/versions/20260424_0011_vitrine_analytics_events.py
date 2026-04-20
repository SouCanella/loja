"""Eventos de analytics da vitrine (Fase 3.2)."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260424_0011"
down_revision: Union[str, None] = "20260423_0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "vitrine_analytics_events",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("path", sa.String(length=512), nullable=True),
        sa.Column("product_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("session_id", sa.String(length=64), nullable=False),
        sa.Column("country_code", sa.String(length=2), nullable=True),
        sa.Column("meta", sa.JSON(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_vae_store_occurred", "vitrine_analytics_events", ["store_id", "occurred_at"])
    op.create_index(
        "ix_vae_store_type_occurred",
        "vitrine_analytics_events",
        ["store_id", "event_type", "occurred_at"],
    )
    op.create_index("ix_vae_store_product", "vitrine_analytics_events", ["store_id", "product_id"])


def downgrade() -> None:
    op.drop_index("ix_vae_store_product", table_name="vitrine_analytics_events")
    op.drop_index("ix_vae_store_type_occurred", table_name="vitrine_analytics_events")
    op.drop_index("ix_vae_store_occurred", table_name="vitrine_analytics_events")
    op.drop_table("vitrine_analytics_events")
