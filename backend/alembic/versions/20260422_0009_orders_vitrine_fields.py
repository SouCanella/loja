"""Pedidos da vitrine: contacto, origem, cliente opcional."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260422_0009"
down_revision: Union[str, None] = "20260421_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "orders",
        sa.Column("source", sa.String(length=20), nullable=True),
    )
    op.add_column(
        "orders",
        sa.Column(
            "customer_id",
            sa.Uuid(as_uuid=True),
            sa.ForeignKey("customers.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column("orders", sa.Column("contact_name", sa.String(length=255), nullable=True))
    op.add_column("orders", sa.Column("contact_phone", sa.String(length=64), nullable=True))
    op.add_column("orders", sa.Column("delivery_option_id", sa.String(length=64), nullable=True))
    op.add_column("orders", sa.Column("payment_method_id", sa.String(length=64), nullable=True))
    op.add_column("orders", sa.Column("delivery_address", sa.Text(), nullable=True))
    op.create_index("ix_orders_customer_id", "orders", ["customer_id"])


def downgrade() -> None:
    op.drop_index("ix_orders_customer_id", table_name="orders")
    op.drop_column("orders", "delivery_address")
    op.drop_column("orders", "payment_method_id")
    op.drop_column("orders", "delivery_option_id")
    op.drop_column("orders", "contact_phone")
    op.drop_column("orders", "contact_name")
    op.drop_column("orders", "customer_id")
    op.drop_column("orders", "source")
