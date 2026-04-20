"""Contas de cliente na vitrine (por loja)."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260421_0008"
down_revision: Union[str, None] = "20260420_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("store_id", sa.Uuid(as_uuid=True), sa.ForeignKey("stores.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("store_id", "email", name="uq_customers_store_email"),
    )
    op.create_index("ix_customers_store_id", "customers", ["store_id"])


def downgrade() -> None:
    op.drop_index("ix_customers_store_id", table_name="customers")
    op.drop_table("customers")
