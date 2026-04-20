"""POST público de pedido (vitrine → painel, IP-11)."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient


def _store_with_product(client: TestClient) -> tuple[str, str, dict[str, str]]:
    suf = uuid.uuid4().hex[:8]
    slug = f"pv-{suf}"
    email = f"adm{suf}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja PV",
            "store_slug": slug,
            "admin_email": email,
            "password": "senha-segura-1",
        },
    )
    token = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "senha-segura-1"},
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    pr = client.post(
        "/api/v1/products",
        headers=headers,
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
    assert pr.status_code == 201
    pid = pr.json()["id"]
    return slug, pid, headers


def test_public_order_201_aguardando_confirmacao(client: TestClient) -> None:
    slug, pid, headers = _store_with_product(client)
    body = {
        "items": [{"product_id": pid, "quantity": "2"}],
        "customer_name": "Ana",
        "customer_phone": "11999999999",
        "delivery_option_id": "retirada",
        "payment_method_id": "pix",
        "customer_note": None,
        "delivery_address": None,
        "website": "",
    }
    r = client.post(f"/api/v2/public/stores/{slug}/orders", json=body)
    assert r.status_code == 201, r.text
    j = r.json()
    assert j["success"] is True
    assert len(j["data"]["short_code"]) == 8
    oid = j["data"]["order_id"]

    lst = client.get("/api/v2/orders", headers=headers).json()
    assert lst["success"] is True
    ids = [o["id"] for o in lst["data"]]
    assert oid in ids

    detail = client.get(f"/api/v2/orders/{oid}", headers=headers).json()["data"]
    assert detail["status"] == "aguardando_confirmacao"
    assert detail["source"] == "vitrine"
    assert detail["contact_name"] == "Ana"
    assert detail["contact_phone"] == "11999999999"

    inbox = client.get("/api/v2/notifications", headers=headers).json()
    assert inbox["success"] is True
    assert inbox["data"]["unread_count"] >= 1
    notif_ids = [n["id"] for n in inbox["data"]["items"] if n.get("order_id") == oid]
    assert len(notif_ids) >= 1
    mr = client.post(
        "/api/v2/notifications/mark-read",
        headers=headers,
        json={"notification_ids": notif_ids},
    )
    assert mr.status_code == 200
    assert mr.json()["data"]["marked_count"] >= 1
    inbox2 = client.get("/api/v2/notifications", headers=headers).json()
    assert inbox2["data"]["unread_count"] < inbox["data"]["unread_count"]


def test_public_order_404_slug(client: TestClient) -> None:
    fake_pid = str(uuid.uuid4())
    r = client.post(
        "/api/v2/public/stores/nao-existe-xyz-99/orders",
        json={
            "items": [{"product_id": fake_pid, "quantity": "1"}],
            "customer_name": "A",
            "customer_phone": "11999999999",
            "delivery_option_id": "retirada",
            "payment_method_id": "pix",
            "website": "",
        },
    )
    assert r.status_code == 404


def test_public_order_honeypot_400(client: TestClient) -> None:
    slug, pid, _ = _store_with_product(client)
    r = client.post(
        f"/api/v2/public/stores/{slug}/orders",
        json={
            "items": [{"product_id": pid, "quantity": "1"}],
            "customer_name": "A",
            "customer_phone": "11999999999",
            "delivery_option_id": "retirada",
            "payment_method_id": "pix",
            "website": "http://spam.com",
        },
    )
    assert r.status_code == 400


def test_public_order_requires_address_for_delivery(client: TestClient) -> None:
    slug, pid, _ = _store_with_product(client)
    r = client.post(
        f"/api/v2/public/stores/{slug}/orders",
        json={
            "items": [{"product_id": pid, "quantity": "1"}],
            "customer_name": "A",
            "customer_phone": "11999999999",
            "delivery_option_id": "loja_entrega",
            "payment_method_id": "pix",
            "delivery_address": None,
            "website": "",
        },
    )
    assert r.status_code == 422


def test_public_order_links_customer_when_bearer(client: TestClient) -> None:
    slug, pid, headers = _store_with_product(client)
    reg = client.post(
        f"/api/v2/public/stores/{slug}/customers/register",
        json={"email": f"cli-{uuid.uuid4().hex[:6]}@example.com", "password": "senha-longa-9"},
    )
    assert reg.status_code == 201
    tok = reg.json()["data"]["access_token"]
    cid = reg.json()["data"]["customer_id"]
    body = {
        "items": [{"product_id": pid, "quantity": "1"}],
        "customer_name": "Cli",
        "customer_phone": "11888888888",
        "delivery_option_id": "retirada",
        "payment_method_id": "pix",
        "website": "",
    }
    r = client.post(
        f"/api/v2/public/stores/{slug}/orders",
        json=body,
        headers={"Authorization": f"Bearer {tok}"},
    )
    assert r.status_code == 201
    oid = r.json()["data"]["order_id"]
    detail = client.get(f"/api/v2/orders/{oid}", headers=headers).json()["data"]
    assert detail.get("customer_id") == cid


def test_public_order_rate_limit_429(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    from types import SimpleNamespace

    import app.services.public_vitrine_order as pvo

    monkeypatch.setattr(
        pvo,
        "get_settings",
        lambda: SimpleNamespace(
            public_order_rate_limit_max_attempts=2,
            public_order_rate_limit_window_seconds=9999,
        ),
    )

    slug, pid, _ = _store_with_product(client)
    body = {
        "items": [{"product_id": pid, "quantity": "1"}],
        "customer_name": "A",
        "customer_phone": "11999999999",
        "delivery_option_id": "retirada",
        "payment_method_id": "pix",
        "website": "",
    }
    url = f"/api/v2/public/stores/{slug}/orders"
    assert client.post(url, json=body).status_code == 201
    assert client.post(url, json=body).status_code == 201
    last = client.post(url, json=body)
    assert last.status_code == 429
