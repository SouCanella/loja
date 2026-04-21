"""IP-05 (observações por linha) + IP-14 (track_inventory, inventory_item_id opcional — DEC-23)."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260427_0014"
down_revision: Union[str, None] = "20260426_0013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("order_items", sa.Column("line_note", sa.Text(), nullable=True))
    op.add_column(
        "products",
        sa.Column(
            "track_inventory",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.alter_column(
        "products",
        "inventory_item_id",
        existing_type=sa.Uuid(as_uuid=True),
        nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        "products",
        "inventory_item_id",
        existing_type=sa.Uuid(as_uuid=True),
        nullable=False,
    )
    op.drop_column("products", "track_inventory")
    op.drop_column("order_items", "line_note")
