"""MA-04 — índices compostos (store_id, …) para listagens e relatórios."""

from typing import Sequence, Union

from alembic import op

revision: str = "20260426_0013"
down_revision: Union[str, None] = "20260425_0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_orders_store_created_at",
        "orders",
        ["store_id", "created_at"],
        unique=False,
    )
    op.create_index(
        "ix_products_store_active_name",
        "products",
        ["store_id", "active", "name"],
        unique=False,
    )
    op.create_index(
        "ix_stock_movements_store_created_at",
        "stock_movements",
        ["store_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_stock_movements_store_created_at", table_name="stock_movements")
    op.drop_index("ix_products_store_active_name", table_name="products")
    op.drop_index("ix_orders_store_created_at", table_name="orders")
