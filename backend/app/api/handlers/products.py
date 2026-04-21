"""Produtos — lógica partilhada v1/v2."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.enums import StockMovementType
from app.models.inventory import InventoryBatch, InventoryItem
from app.models.order import StockMovement
from app.models.product import Product
from app.models.user import User
from app.schemas.catalog import ProductCreate, ProductPatch


def list_products(
    db: Session,
    current: User,
    *,
    category_slug: str | None = None,
    active_only: bool = True,
) -> list[Product]:
    q = select(Product).where(Product.store_id == current.store_id)
    if active_only:
        q = q.where(Product.active.is_(True))
    if category_slug:
        cat = db.scalars(
            select(Category).where(
                Category.store_id == current.store_id,
                Category.slug == category_slug,
            )
        ).first()
        if cat is None:
            return []
        q = q.where(Product.category_id == cat.id)
    q = q.order_by(Product.name)
    return list(db.scalars(q))


def create_product(db: Session, current: User, body: ProductCreate) -> Product:
    if body.category_id is not None:
        cat = db.get(Category, body.category_id)
        if cat is None or cat.store_id != current.store_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Categoria inválida",
            )

    if not body.track_inventory:
        product = Product(
            store_id=current.store_id,
            category_id=body.category_id,
            inventory_item_id=None,
            track_inventory=False,
            name=body.name.strip(),
            description=body.description,
            price=body.price,
            active=True,
            catalog_spotlight=body.catalog_spotlight,
            catalog_sale_mode=body.catalog_sale_mode,
        )
        db.add(product)
        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Conflito ao criar produto",
            ) from exc
        db.refresh(product)
        return product

    assert body.inventory is not None
    item = InventoryItem(
        store_id=current.store_id,
        name=body.name.strip(),
        unit=body.inventory.unit,
    )
    db.add(item)
    db.flush()

    batch = InventoryBatch(
        item_id=item.id,
        quantity_available=body.inventory.initial_quantity,
        unit_cost=body.inventory.unit_cost,
        expiration_date=body.inventory.expiration_date,
    )
    db.add(batch)
    db.add(
        StockMovement(
            store_id=current.store_id,
            item_id=item.id,
            movement_type=StockMovementType.initial_in,
            quantity_delta=body.inventory.initial_quantity,
            order_id=None,
        )
    )

    product = Product(
        store_id=current.store_id,
        category_id=body.category_id,
        inventory_item_id=item.id,
        track_inventory=True,
        name=body.name.strip(),
        description=body.description,
        price=body.price,
        active=True,
        catalog_spotlight=body.catalog_spotlight,
        catalog_sale_mode=body.catalog_sale_mode,
    )
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflito ao criar produto",
        ) from exc
    db.refresh(product)
    return product


def get_product(db: Session, current: User, product_id: UUID) -> Product:
    p = db.get(Product, product_id)
    if p is None or p.store_id != current.store_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return p


def update_product(db: Session, current: User, product_id: UUID, body: ProductPatch) -> Product:
    p = get_product(db, current, product_id)
    if body.name is not None:
        p.name = body.name.strip()
    if body.description is not None:
        p.description = body.description
    if body.image_url is not None:
        url = body.image_url.strip()
        p.image_url = url if url else None
    if body.price is not None:
        p.price = body.price
    if body.active is not None:
        p.active = body.active
    if body.category_id is not None:
        if body.category_id:
            cat = db.get(Category, body.category_id)
            if cat is None or cat.store_id != current.store_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Categoria inválida",
                )
            p.category_id = body.category_id
        else:
            p.category_id = None
    patch_data = body.model_dump(exclude_unset=True)
    if "catalog_spotlight" in patch_data:
        p.catalog_spotlight = body.catalog_spotlight
    if "catalog_sale_mode" in patch_data and body.catalog_sale_mode is not None:
        p.catalog_sale_mode = body.catalog_sale_mode
    db.add(p)
    db.commit()
    db.refresh(p)
    return p
