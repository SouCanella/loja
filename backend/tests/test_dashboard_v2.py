"""Dashboard e extensões v2 (Fase 3.1)."""

import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def test_dashboard_summary_requires_date_range(client: TestClient, auth_headers: dict) -> None:
    r = client.get("/api/v2/dashboard/summary", headers=auth_headers)
    assert r.status_code == 422


def test_dashboard_summary_ok_empty_store(client: TestClient, auth_headers: dict) -> None:
    d1 = date(2026, 1, 1)
    d2 = date(2026, 1, 14)
    r = client.get(
        f"/api/v2/dashboard/summary?date_from={d1.isoformat()}&date_to={d2.isoformat()}",
        headers=auth_headers,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    data = body["data"]
    assert data["date_from"] == d1.isoformat()
    assert data["date_to"] == d2.isoformat()
    assert data["kpis"]["orders_in_period"] == 0
    assert len(data["revenue_by_day"]) == 14
    assert data["kpis"]["new_customers_in_period"] is None


def test_dashboard_rejects_inverted_range(client: TestClient, auth_headers: dict) -> None:
    r = client.get(
        "/api/v2/dashboard/summary?date_from=2026-02-01&date_to=2026-01-01",
        headers=auth_headers,
    )
    assert r.status_code == 400


def test_patch_store_settings_name(client: TestClient) -> None:
    ctx = register_random_store(client)
    r = client.patch(
        "/api/v2/me/store-settings",
        headers=ctx["headers"],
        json={"store_name": "Nome Novo"},
    )
    assert r.status_code == 200, r.text
    me = r.json()["data"]
    assert me["store_name"] == "Nome Novo"


def test_patch_product_image_url(client: TestClient) -> None:
    ctx = register_random_store(client)
    suf = uuid.uuid4().hex[:8]
    create = client.post(
        "/api/v2/products",
        headers=ctx["headers"],
        json={
            "name": f"P{suf}",
            "price": "10.00",
            "inventory": {
                "unit": "un",
                "initial_quantity": "1",
                "unit_cost": "1.00",
            },
        },
    )
    assert create.status_code == 201, create.text
    pid = create.json()["data"]["id"]
    r = client.patch(
        f"/api/v2/products/{pid}",
        headers=ctx["headers"],
        json={"image_url": "https://example.com/x.jpg"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["data"]["image_url"] == "https://example.com/x.jpg"


def test_patch_store_slug_conflict_second_store(client: TestClient) -> None:
    a = register_random_store(client)
    b = register_random_store(client)
    slug_a = client.get("/api/v2/me", headers=a["headers"]).json()["data"]["store_slug"]
    r = client.patch(
        "/api/v2/me/store-settings",
        headers=b["headers"],
        json={"store_slug": slug_a},
    )
    assert r.status_code == 400
