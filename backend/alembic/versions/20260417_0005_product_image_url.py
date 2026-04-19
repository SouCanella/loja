"""Adiciona image_url em products."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260417_0005"
down_revision: Union[str, None] = "20260418_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("image_url", sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("products", "image_url")
