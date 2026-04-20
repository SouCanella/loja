"""Analytics de vitrine — ingestão pública e resumo no painel."""

from __future__ import annotations

import uuid
from datetime import date, timedelta

from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def _store_with_product(client: TestClient) -> tuple[str, str, dict[str, str]]:
    ctx = register_random_store(client)
    h = ctx["headers"]
    pr = client.post(
        "/api/v1/products",
        headers=h,
        json={
            "name": "Bolo",
            "price": "12.00",
            "inventory": {
                "unit": "un",
                "initial_quantity": "20",
                "unit_cost": "5.00",
            },
        },
    )
    assert pr.status_code == 201, pr.text
    pid = pr.json()["id"]
    slug = client.get("/api/v2/me", headers=h).json()["data"]["store_slug"]
    return slug, pid, h


def test_analytics_summary_401(client: TestClient) -> None:
    r = client.get("/api/v2/analytics/vitrine/summary?date_from=2026-01-01&date_to=2026-01-31")
    assert r.status_code == 401


def test_analytics_ingest_and_summary(client: TestClient) -> None:
    slug, pid, headers = _store_with_product(client)
    sid = str(uuid.uuid4())
    today = date.today()
    d0 = (today - timedelta(days=1)).isoformat()
    d1 = (today + timedelta(days=1)).isoformat()

    body = {
        "events": [
            {
                "event_type": "page_view",
                "path": f"/loja/{slug}",
                "session_id": sid,
            },
            {
                "event_type": "product_view",
                "path": f"/loja/{slug}/p/{pid}",
                "session_id": sid,
                "product_id": pid,
            },
            {
                "event_type": "add_to_cart",
                "path": f"/loja/{slug}",
                "session_id": sid,
                "product_id": pid,
            },
        ]
    }
    r = client.post(f"/api/v2/public/stores/{slug}/analytics/events", json=body)
    assert r.status_code == 200, r.text
    assert r.json()["success"] is True
    assert r.json()["data"]["accepted"] == 3

    r2 = client.get(
        f"/api/v2/analytics/vitrine/summary?date_from={d0}&date_to={d1}",
        headers=headers,
    )
    assert r2.status_code == 200, r2.text
    j = r2.json()["data"]
    assert j["distinct_sessions"] >= 1
    assert j["events_by_type"].get("page_view", 0) >= 1
    assert j["events_by_type"].get("product_view", 0) >= 1
    assert len(j["top_products_by_view"]) >= 1
    assert j["top_products_by_view"][0]["name"] == "Bolo"


def test_analytics_ingest_404_slug(client: TestClient) -> None:
    r = client.post(
        "/api/v2/public/stores/nao-existe-slug-xyz99/analytics/events",
        json={
            "events": [
                {
                    "event_type": "page_view",
                    "path": "/x",
                    "session_id": "sess-one-ok",
                }
            ]
        },
    )
    assert r.status_code == 404
