"""Clientes inseridos pelo painel (nome/telefone; e-mail opcional; origem)."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260428_0015"
down_revision: Union[str, None] = "20260427_0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "customers",
        sa.Column(
            "source",
            sa.String(length=32),
            nullable=False,
            server_default="vitrine",
        ),
    )
    op.add_column("customers", sa.Column("contact_name", sa.String(length=255), nullable=True))
    op.add_column("customers", sa.Column("phone", sa.String(length=32), nullable=True))
    op.alter_column(
        "customers",
        "email",
        existing_type=sa.String(length=255),
        nullable=True,
    )
    op.alter_column(
        "customers",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=True,
    )
    op.alter_column("customers", "source", server_default=None)


def downgrade() -> None:
    op.alter_column(
        "customers",
        "password_hash",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    op.alter_column(
        "customers",
        "email",
        existing_type=sa.String(length=255),
        nullable=False,
    )
    op.drop_column("customers", "phone")
    op.drop_column("customers", "contact_name")
    op.drop_column("customers", "source")
