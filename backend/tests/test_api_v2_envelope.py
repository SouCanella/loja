"""`/api/v2` — envelope DEC-06 (paridade com v1)."""

import uuid

from fastapi.testclient import TestClient


def test_v2_health_envelope(client: TestClient) -> None:
    r = client.get("/api/v2/health")
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["data"] == {"status": "ok"}
    assert body["errors"] is None


def test_v2_financial_requires_auth_envelope(client: TestClient) -> None:
    r = client.get("/api/v2/reports/financial")
    assert r.status_code == 401
    body = r.json()
    assert body["success"] is False
    assert body["data"] is None
    assert body["errors"]
    assert "message" in body["errors"][0]


def test_v2_orders_and_inventory_envelope(client: TestClient) -> None:
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja V2 OI",
            "store_slug": "loja-v2-oi",
            "admin_email": "v2oi@example.com",
            "password": "senha-segura-1",
        },
    )
    token = reg.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    o = client.get("/api/v2/orders", headers=h)
    assert o.status_code == 200
    b = o.json()
    assert b["success"] is True
    assert isinstance(b["data"], list)
    inv = client.get("/api/v2/inventory-items", headers=h)
    assert inv.status_code == 200
    assert inv.json()["success"] is True


def test_v2_me_categories_products_recipes_envelope(client: TestClient) -> None:
    suf = uuid.uuid4().hex[:8]
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja V2 Full",
            "store_slug": f"v2full-{suf}",
            "admin_email": f"v2full{suf}@example.com",
            "password": "senha-segura-1",
        },
    )
    assert reg.status_code == 201
    h = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    me = client.get("/api/v2/me", headers=h)
    assert me.status_code == 200
    mj = me.json()
    assert mj["success"] is True
    assert mj["data"]["email"] == f"v2full{suf}@example.com"
    for path in (
        "/api/v2/categories",
        "/api/v2/products",
        "/api/v2/recipes",
    ):
        r = client.get(path, headers=h)
        assert r.status_code == 200
        assert r.json()["success"] is True
        assert isinstance(r.json()["data"], list)


def test_v2_financial_envelope_ok(client: TestClient) -> None:
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja V2",
            "store_slug": "loja-v2-env",
            "admin_email": "v2env@example.com",
            "password": "senha-segura-1",
        },
    )
    token = reg.json()["access_token"]
    r = client.get(
        "/api/v2/reports/financial",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["success"] is True
    assert body["errors"] is None
    data = body["data"]
    assert data is not None
    assert "orders_revenue" in data
    assert "by_product" in data
    assert "by_category" in data
    assert "by_order_status" in data
    assert "period_margin_estimate" in data
