"""Produtos: destaque e modo de venda na vitrine (RF-CA-05 / RF-CA-11)."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260420_0007"
down_revision: Union[str, None] = "20260419_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("catalog_spotlight", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "products",
        sa.Column(
            "catalog_sale_mode",
            sa.String(length=20),
            nullable=False,
            server_default="in_stock",
        ),
    )
    op.alter_column("products", "catalog_sale_mode", server_default=None)


def downgrade() -> None:
    op.drop_column("products", "catalog_sale_mode")
    op.drop_column("products", "catalog_spotlight")
