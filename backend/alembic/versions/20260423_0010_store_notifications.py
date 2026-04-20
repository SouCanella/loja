"""Notificações in-app para o lojista."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260423_0010"
down_revision: Union[str, None] = "20260422_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "store_notifications",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_store_notifications_store_id", "store_notifications", ["store_id"])
    op.create_index("ix_store_notifications_order_id", "store_notifications", ["order_id"])
    op.create_index(
        "ix_store_notifications_store_created",
        "store_notifications",
        ["store_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_store_notifications_store_created", table_name="store_notifications")
    op.drop_index("ix_store_notifications_order_id", table_name="store_notifications")
    op.drop_index("ix_store_notifications_store_id", table_name="store_notifications")
    op.drop_table("store_notifications")
