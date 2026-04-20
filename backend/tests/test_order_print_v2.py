"""GET /api/v2/orders/{id}/print — dados para impressão (Fase 3.2)."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def _store_with_order(client: TestClient) -> tuple[str, dict[str, str]]:
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
    r = client.post(
        f"/api/v2/public/stores/{slug}/orders",
        json={
            "items": [{"product_id": pid, "quantity": "2"}],
            "customer_name": "Ana",
            "customer_phone": "11999999999",
            "delivery_option_id": "retirada",
            "payment_method_id": "pix",
            "customer_note": "Sem açúcar",
            "delivery_address": None,
            "website": "",
        },
    )
    assert r.status_code == 201, r.text
    oid = r.json()["data"]["order_id"]
    return oid, h


def test_order_print_200_envelope_and_lines(client: TestClient) -> None:
    oid, h = _store_with_order(client)
    r = client.get(f"/api/v2/orders/{oid}/print", headers=h)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["success"] is True
    d = j["data"]
    assert d["order_id"] == oid
    assert d["store_name"]
    assert d["total"] == "24.00"
    assert len(d["lines"]) == 1
    assert d["lines"][0]["product_name"] == "Bolo"
    assert float(d["lines"][0]["quantity"]) == 2.0
    pc = d["print_config"]
    assert pc["channel"] == "off"
    assert pc["paper_width_mm"] in (58, 80)
    assert pc["shipping_label_size"] in ("a4", "a6")


def test_me_print_config_defaults(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.get("/api/v2/me", headers=auth_headers)
    assert r.status_code == 200
    me = r.json()["data"]
    pc = me.get("print_config") or {}
    assert pc.get("channel") == "off"
    assert pc.get("paper_width_mm") in (58, 80)


def test_me_patch_merges_print_config(client: TestClient, auth_headers: dict[str, str]) -> None:
    r = client.patch(
        "/api/v2/me/store-settings",
        headers=auth_headers,
        json={
            "config": {
                "print": {
                    "channel": "usb",
                    "paper_width_mm": 58,
                    "shipping_label_size": "a6",
                }
            }
        },
    )
    assert r.status_code == 200, r.text
    pc = r.json()["data"]["print_config"]
    assert pc["channel"] == "usb"
    assert pc["paper_width_mm"] == 58
    assert pc["shipping_label_size"] == "a6"


def test_order_print_404_other_store(client: TestClient) -> None:
    oid, _ = _store_with_order(client)
    ctx2 = register_random_store(client)
    r = client.get(f"/api/v2/orders/{oid}/print", headers=ctx2["headers"])
    assert r.status_code == 404


def test_order_print_401_without_token(client: TestClient) -> None:
    fake = str(uuid.uuid4())
    r = client.get(f"/api/v2/orders/{fake}/print")
    assert r.status_code == 401
