"""phase3 recipes production_runs

Revision ID: 20260417_0003
Revises: 20260417_0002
Create Date: 2026-04-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260417_0003"
down_revision: Union[str, None] = "20260417_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "recipes",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("product_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("yield_quantity", sa.Numeric(14, 4), nullable=False),
        sa.Column("time_minutes", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("store_id", "product_id", name="uq_recipes_store_product"),
    )
    op.create_index(op.f("ix_recipes_product_id"), "recipes", ["product_id"], unique=False)
    op.create_index(op.f("ix_recipes_store_id"), "recipes", ["store_id"], unique=False)

    op.create_table(
        "recipe_items",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("recipe_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("inventory_item_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 4), nullable=False),
        sa.ForeignKeyConstraint(["inventory_item_id"], ["inventory_items.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("recipe_id", "inventory_item_id", name="uq_recipe_items_recipe_item"),
    )
    op.create_index(op.f("ix_recipe_items_inventory_item_id"), "recipe_items", ["inventory_item_id"], unique=False)
    op.create_index(op.f("ix_recipe_items_recipe_id"), "recipe_items", ["recipe_id"], unique=False)

    op.create_table(
        "production_runs",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("recipe_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("output_quantity", sa.Numeric(14, 4), nullable=False),
        sa.Column("total_input_cost", sa.Numeric(14, 4), nullable=False),
        sa.Column("unit_output_cost", sa.Numeric(14, 4), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["recipe_id"], ["recipes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("store_id", "idempotency_key", name="uq_production_runs_store_idempotency"),
    )
    op.create_index(op.f("ix_production_runs_recipe_id"), "production_runs", ["recipe_id"], unique=False)
    op.create_index(op.f("ix_production_runs_store_id"), "production_runs", ["store_id"], unique=False)

    op.add_column(
        "stock_movements",
        sa.Column("production_run_id", sa.Uuid(as_uuid=True), nullable=True),
    )
    op.create_index(
        op.f("ix_stock_movements_production_run_id"),
        "stock_movements",
        ["production_run_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_stock_movements_production_run_id",
        "stock_movements",
        "production_runs",
        ["production_run_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_stock_movements_production_run_id", "stock_movements", type_="foreignkey")
    op.drop_index(op.f("ix_stock_movements_production_run_id"), table_name="stock_movements")
    op.drop_column("stock_movements", "production_run_id")
    op.drop_index(op.f("ix_production_runs_store_id"), table_name="production_runs")
    op.drop_index(op.f("ix_production_runs_recipe_id"), table_name="production_runs")
    op.drop_table("production_runs")
    op.drop_index(op.f("ix_recipe_items_recipe_id"), table_name="recipe_items")
    op.drop_index(op.f("ix_recipe_items_inventory_item_id"), table_name="recipe_items")
    op.drop_table("recipe_items")
    op.drop_index(op.f("ix_recipes_store_id"), table_name="recipes")
    op.drop_index(op.f("ix_recipes_product_id"), table_name="recipes")
    op.drop_table("recipes")
