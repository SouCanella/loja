"""Receitas: flag is_active."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260419_0006"
down_revision: Union[str, None] = "20260417_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "recipes",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column("recipes", "is_active", server_default=None)


def downgrade() -> None:
    op.drop_column("recipes", "is_active")
