"""Fase 3: receitas e produção."""

import uuid
from decimal import Decimal

from fastapi.testclient import TestClient


def _register_and_token(client: TestClient) -> tuple[dict[str, str], str]:
    suffix = uuid.uuid4().hex[:8]
    slug = f"p3-{suffix}"
    email = f"p3-{suffix}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Fábrica P3",
            "store_slug": slug,
            "admin_email": email,
            "password": "senha-segura-1",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "senha-segura-1"},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, slug


def test_recipe_and_production_flow(client: TestClient) -> None:
    h, _slug = _register_and_token(client)

    # Produto final (bolo) com stock inicial
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Bolo produção",
            "price": "40.00",
            "inventory": {
                "unit": "un",
                "initial_quantity": "0.0001",
                "unit_cost": "0",
            },
        },
        headers=h,
    )
    assert pr.status_code == 201
    product_id = pr.json()["id"]
    finished_item_id = pr.json()["inventory_item_id"]

    # Insumo farinha (outro produto só para ter item de stock — na prática seria só insumo)
    pr2 = client.post(
        "/api/v1/products",
        json={
            "name": "Farinha pacote",
            "price": "5.00",
            "inventory": {
                "unit": "kg",
                "initial_quantity": "10",
                "unit_cost": "3.00",
            },
        },
        headers=h,
    )
    assert pr2.status_code == 201
    flour_item_id = pr2.json()["inventory_item_id"]
    assert flour_item_id != finished_item_id

    rc = client.post(
        "/api/v1/recipes",
        json={
            "product_id": product_id,
            "yield_quantity": "2",
            "time_minutes": 60,
            "items": [{"inventory_item_id": flour_item_id, "quantity": "1"}],
        },
        headers=h,
    )
    assert rc.status_code == 201
    recipe_id = rc.json()["id"]
    assert rc.json()["estimated_unit_cost"] is not None

    prod = client.post(
        "/api/v1/production",
        json={"recipe_id": recipe_id},
        headers={**h, "Idempotency-Key": "run-1"},
    )
    assert prod.status_code == 201
    body = prod.json()
    assert Decimal(body["output_quantity"]) == Decimal("2")
    assert float(body["total_input_cost"]) > 0

    # Idempotência: mesma chave → mesmo resultado
    prod2 = client.post(
        "/api/v1/production",
        json={"recipe_id": recipe_id},
        headers={**h, "Idempotency-Key": "run-1"},
    )
    assert prod2.status_code == 201
    assert prod2.json()["id"] == body["id"]

    rep = client.get("/api/v1/reports/financial", headers=h)
    assert rep.status_code == 200
    assert rep.json()["production_runs_count"] >= 1
    assert float(rep.json()["production_input_cost"]) > 0


def test_financial_report_orders_revenue(client: TestClient) -> None:
    h, _ = _register_and_token(client)
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Item venda",
            "price": "10.00",
            "inventory": {"unit": "un", "initial_quantity": "5", "unit_cost": "4.00"},
        },
        headers=h,
    )
    pid = pr.json()["id"]
    o = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": pid, "quantity": "2"}]},
        headers=h,
    )
    oid = o.json()["id"]
    client.patch(
        f"/api/v1/orders/{oid}/status",
        json={"status": "confirmado"},
        headers=h,
    )
    r = client.get("/api/v1/reports/financial", headers=h)
    assert r.status_code == 200
    data = r.json()
    assert float(data["orders_revenue"]) >= 20.0
    assert data["orders_count"] >= 1
    assert "period_margin_estimate" in data
    assert "period_margin_percent" in data
    assert isinstance(data["by_product"], list)
    assert isinstance(data["by_category"], list)
    assert isinstance(data["by_order_status"], list)
    assert any(s["status"] == "confirmado" for s in data["by_order_status"])
    row = next((x for x in data["by_product"] if x["product_id"] == pid), None)
    assert row is not None
    assert float(row["orders_revenue"]) >= 20.0
    assert float(row["quantity_sold"]) >= 2.0
