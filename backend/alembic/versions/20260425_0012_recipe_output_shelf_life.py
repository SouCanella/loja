"""Validade opcional do produto acabado na receita (dias após produção)."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260425_0012"
down_revision: Union[str, None] = "20260424_0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "recipes",
        sa.Column("output_shelf_life_days", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("recipes", "output_shelf_life_days")
