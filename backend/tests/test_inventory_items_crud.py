"""CRUD de insumos (inventory_items)."""

import uuid
from decimal import Decimal

from app.models.inventory import InventoryItem
from app.models.product import Product
from app.models.recipe import Recipe, RecipeItem
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def _auth_headers(client: TestClient) -> tuple[dict[str, str], str]:
    suffix = uuid.uuid4().hex[:8]
    email = f"inv-{suffix}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja Inv",
            "store_slug": f"loja-inv-{suffix}",
            "admin_email": email,
            "password": "senha-segura-1",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "senha-segura-1"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, email


def test_inventory_crud_and_delete_rules(client: TestClient, db_session: Session) -> None:
    h, _ = _auth_headers(client)

    create = client.post(
        "/api/v1/inventory-items",
        headers=h,
        json={
            "name": "  Açúcar  ",
            "unit": "kg",
            "initial_batch": {"quantity": "2", "unit_cost": "3.5"},
        },
    )
    assert create.status_code == 201
    item_id = create.json()["id"]
    assert create.json()["has_sale_product"] is False

    listed = client.get("/api/v1/inventory-items", headers=h).json()
    assert any(x["id"] == item_id and x["has_sale_product"] is False for x in listed)

    patch = client.patch(
        f"/api/v1/inventory-items/{item_id}",
        headers=h,
        json={"name": "Açúcar refinado"},
    )
    assert patch.status_code == 200
    assert patch.json()["name"] == "Açúcar refinado"

    # produto de venda bloqueia delete
    store_id = uuid.UUID(client.get("/api/v1/me", headers=h).json()["store_id"])
    prod = Product(
        id=uuid.uuid4(),
        store_id=store_id,
        inventory_item_id=uuid.UUID(item_id),
        name="Doce",
        price=Decimal("5"),
        active=True,
    )
    db_session.add(prod)
    db_session.commit()

    bad_del = client.delete(f"/api/v1/inventory-items/{item_id}", headers=h)
    assert bad_del.status_code == 400

    db_session.delete(prod)
    db_session.commit()

    # receita bloqueia delete
    fin = InventoryItem(id=uuid.uuid4(), store_id=store_id, name="Bolo", unit="un")
    db_session.add(fin)
    db_session.flush()
    p2 = Product(
        id=uuid.uuid4(),
        store_id=store_id,
        inventory_item_id=fin.id,
        name="Bolo venda",
        price=Decimal("10"),
        active=True,
    )
    db_session.add(p2)
    rec = Recipe(
        id=uuid.uuid4(),
        store_id=store_id,
        product_id=p2.id,
        yield_quantity=Decimal("1"),
    )
    db_session.add(rec)
    db_session.add(
        RecipeItem(
            id=uuid.uuid4(),
            recipe_id=rec.id,
            inventory_item_id=uuid.UUID(item_id),
            quantity="0.1",
        )
    )
    db_session.commit()

    bad_del2 = client.delete(f"/api/v1/inventory-items/{item_id}", headers=h)
    assert bad_del2.status_code == 400

    db_session.delete(rec)
    db_session.delete(p2)
    db_session.delete(fin)
    db_session.commit()

    ok_del = client.delete(f"/api/v1/inventory-items/{item_id}", headers=h)
    assert ok_del.status_code == 204
