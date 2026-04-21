"""IP-05, IP-06, IP-14 — observações por linha, stats de clientes, produto sem stock."""

from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def test_public_order_line_note_persisted(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Bolo IP05",
            "price": "20.00",
            "inventory": {
                "unit": "un",
                "initial_quantity": "5",
                "unit_cost": "8.00",
            },
        },
        headers=h,
    )
    assert pr.status_code == 201, pr.text
    pid = pr.json()["id"]
    slug = client.get("/api/v2/me", headers=h).json()["data"]["store_slug"]
    body = {
        "items": [
            {
                "product_id": pid,
                "quantity": "1",
                "line_note": "  Sem cerejas  ",
            }
        ],
        "customer_name": "Ana",
        "customer_phone": "11999999999",
        "delivery_option_id": "retirada",
        "payment_method_id": "pix",
        "delivery_address": None,
        "website": "",
    }
    r = client.post(f"/api/v2/public/stores/{slug}/orders", json=body)
    assert r.status_code == 201, r.text
    oid = r.json()["data"]["order_id"]
    detail = client.get(f"/api/v2/orders/{oid}", headers=h).json()["data"]
    assert detail["items"][0].get("line_note") == "Sem cerejas"


def test_product_without_inventory_no_stock_on_confirm(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Serviço IP14",
            "price": "50.00",
            "track_inventory": False,
            "catalog_sale_mode": "order_only",
        },
        headers=h,
    )
    assert pr.status_code == 201, pr.text
    assert pr.json().get("track_inventory") is False
    assert pr.json().get("inventory_item_id") is None
    pid = pr.json()["id"]
    or_post = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": pid, "quantity": "1"}]},
        headers=h,
    )
    assert or_post.status_code == 201, or_post.text
    oid = or_post.json()["id"]
    p1 = client.patch(
        f"/api/v1/orders/{oid}/status",
        json={"status": "confirmado"},
        headers=h,
    )
    assert p1.status_code == 200, p1.text
    assert p1.json().get("stock_committed") is True


def test_recipe_rejected_for_product_without_track(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Sem stock",
            "price": "10.00",
            "track_inventory": False,
        },
        headers=h,
    )
    pid = pr.json()["id"]
    ing = client.post(
        "/api/v1/inventory-items",
        json={"name": "Farinha", "unit": "kg"},
        headers=h,
    )
    assert ing.status_code == 201
    iid = ing.json()["id"]
    r = client.post(
        "/api/v1/recipes",
        json={
            "product_id": pid,
            "yield_quantity": "1",
            "items": [{"inventory_item_id": iid, "quantity": "1"}],
        },
        headers=h,
    )
    assert r.status_code == 400
    assert "stock" in r.json()["detail"].lower()


def test_customer_order_stats_empty(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    r = client.get(
        "/api/v2/dashboard/customer-order-stats?date_from=2026-01-01&date_to=2026-12-31",
        headers=h,
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert data["stats"] == []
