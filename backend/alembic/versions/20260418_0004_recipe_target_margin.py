"""Margem opcional por receita (precificação)."""

import sqlalchemy as sa
from alembic import op

revision = "20260418_0004"
down_revision = "20260417_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "recipes",
        sa.Column("target_margin_percent", sa.Numeric(5, 2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("recipes", "target_margin_percent")
