"""phase2 categories products inventory orders

Revision ID: 20260417_0002
Revises: 20260417_0001
Create Date: 2026-04-17

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260417_0002"
down_revision: Union[str, None] = "20260417_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("store_id", "slug", name="uq_categories_store_slug"),
    )
    op.create_index(op.f("ix_categories_store_id"), "categories", ["store_id"], unique=False)

    op.create_table(
        "inventory_items",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_inventory_items_store_id"), "inventory_items", ["store_id"], unique=False)

    op.create_table(
        "inventory_batches",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("item_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("quantity_available", sa.Numeric(14, 4), nullable=False),
        sa.Column("unit_cost", sa.Numeric(12, 4), nullable=False),
        sa.Column("expiration_date", sa.Date(), nullable=True),
        sa.Column(
            "received_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["item_id"], ["inventory_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_inventory_batches_item_id"), "inventory_batches", ["item_id"], unique=False)

    op.create_table(
        "products",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("category_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("inventory_item_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["inventory_item_id"], ["inventory_items.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("inventory_item_id", name="uq_products_inventory_item_id"),
    )
    op.create_index(op.f("ix_products_category_id"), "products", ["category_id"], unique=False)
    op.create_index(op.f("ix_products_inventory_item_id"), "products", ["inventory_item_id"], unique=False)
    op.create_index(op.f("ix_products_store_id"), "products", ["store_id"], unique=False)

    op.create_table(
        "orders",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("customer_note", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=128), nullable=True),
        sa.Column("stock_committed", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_orders_store_id"), "orders", ["store_id"], unique=False)
    # Idempotência: em Postgres/SQLite múltiplas linhas com idempotency_key NULL são permitidas em UNIQUE.
    op.create_unique_constraint("uq_orders_store_idempotency", "orders", ["store_id", "idempotency_key"])

    op.create_table(
        "stock_movements",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("store_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("item_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("movement_type", sa.String(length=32), nullable=False),
        sa.Column("quantity_delta", sa.Numeric(14, 4), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["item_id"], ["inventory_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_stock_movements_item_id"), "stock_movements", ["item_id"], unique=False)
    op.create_index(op.f("ix_stock_movements_order_id"), "stock_movements", ["order_id"], unique=False)
    op.create_index(op.f("ix_stock_movements_store_id"), "stock_movements", ["store_id"], unique=False)

    op.create_table(
        "order_items",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("product_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 4), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_order_items_order_id"), "order_items", ["order_id"], unique=False)
    op.create_index(op.f("ix_order_items_product_id"), "order_items", ["product_id"], unique=False)

    op.create_table(
        "order_status_history",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("from_status", sa.String(length=32), nullable=True),
        sa.Column("to_status", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_order_status_history_order_id"), "order_status_history", ["order_id"], unique=False
    )

    op.create_table(
        "order_stock_allocations",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("order_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("batch_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 4), nullable=False),
        sa.ForeignKeyConstraint(["batch_id"], ["inventory_batches.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_order_stock_allocations_order_id"),
        "order_stock_allocations",
        ["order_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_order_stock_allocations_batch_id"),
        "order_stock_allocations",
        ["batch_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_order_stock_allocations_batch_id"), table_name="order_stock_allocations")
    op.drop_index(op.f("ix_order_stock_allocations_order_id"), table_name="order_stock_allocations")
    op.drop_table("order_stock_allocations")
    op.drop_index(op.f("ix_order_status_history_order_id"), table_name="order_status_history")
    op.drop_table("order_status_history")
    op.drop_index(op.f("ix_order_items_product_id"), table_name="order_items")
    op.drop_index(op.f("ix_order_items_order_id"), table_name="order_items")
    op.drop_table("order_items")
    op.drop_index(op.f("ix_stock_movements_store_id"), table_name="stock_movements")
    op.drop_index(op.f("ix_stock_movements_order_id"), table_name="stock_movements")
    op.drop_index(op.f("ix_stock_movements_item_id"), table_name="stock_movements")
    op.drop_table("stock_movements")
    op.drop_constraint("uq_orders_store_idempotency", "orders", type_="unique")
    op.drop_index(op.f("ix_orders_store_id"), table_name="orders")
    op.drop_table("orders")
    op.drop_index(op.f("ix_products_store_id"), table_name="products")
    op.drop_index(op.f("ix_products_inventory_item_id"), table_name="products")
    op.drop_index(op.f("ix_products_category_id"), table_name="products")
    op.drop_table("products")
    op.drop_index(op.f("ix_inventory_batches_item_id"), table_name="inventory_batches")
    op.drop_table("inventory_batches")
    op.drop_index(op.f("ix_inventory_items_store_id"), table_name="inventory_items")
    op.drop_table("inventory_items")
    op.drop_index(op.f("ix_categories_store_id"), table_name="categories")
    op.drop_table("categories")
