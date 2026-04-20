"""Registo e login de clientes na vitrine (API v2 pública)."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def test_customer_register_login_me_and_refresh(client: TestClient) -> None:
    suf = uuid.uuid4().hex[:8]
    slug = f"cli-{suf}"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja Cliente",
            "store_slug": slug,
            "admin_email": f"adm{suf}@example.com",
            "password": "senha-segura-1",
        },
    )

    reg = client.post(
        f"/api/v2/public/stores/{slug}/customers/register",
        json={"email": f"cli{suf}@example.com", "password": "outra-senha-9"},
    )
    assert reg.status_code == 201
    rj = reg.json()
    assert rj["success"] is True
    assert rj["data"]["access_token"]
    assert rj["data"]["customer_id"]
    rt = rj["data"]["refresh_token"]

    me = client.get(
        f"/api/v2/public/stores/{slug}/customers/me",
        headers={"Authorization": f"Bearer {rj['data']['access_token']}"},
    )
    assert me.status_code == 200
    mj = me.json()
    assert mj["success"] is True
    assert mj["data"]["email"] == f"cli{suf}@example.com"
    assert mj["data"]["store_slug"] == slug

    ref = client.post("/api/v2/auth/refresh", json={"refresh_token": rt})
    assert ref.status_code == 200
    assert ref.json()["success"] is True
    assert ref.json()["data"]["access_token"]

    bad = client.post(
        f"/api/v2/public/stores/{slug}/customers/register",
        json={"email": f"cli{suf}@example.com", "password": "x" * 10},
    )
    assert bad.status_code == 409


def test_customer_login_401_wrong_password(client: TestClient) -> None:
    suf = uuid.uuid4().hex[:8]
    slug = f"c2-{suf}"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "L2",
            "store_slug": slug,
            "admin_email": f"a2{suf}@example.com",
            "password": "senha-segura-1",
        },
    )
    client.post(
        f"/api/v2/public/stores/{slug}/customers/register",
        json={"email": f"u{suf}@example.com", "password": "correct-pass-1"},
    )
    lo = client.post(
        f"/api/v2/public/stores/{slug}/customers/login",
        json={"email": f"u{suf}@example.com", "password": "wrong-pass-1"},
    )
    assert lo.status_code == 401


def test_customer_register_404_unknown_store(client: TestClient) -> None:
    r = client.post(
        "/api/v2/public/stores/nao-existe-slug-xyz99/customers/register",
        json={"email": "a@b.com", "password": "12345678"},
    )
    assert r.status_code == 404


def test_staff_me_rejects_customer_token(client: TestClient) -> None:
    suf = uuid.uuid4().hex[:8]
    slug = f"c3-{suf}"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "L3",
            "store_slug": slug,
            "admin_email": f"a3{suf}@example.com",
            "password": "senha-segura-1",
        },
    )
    reg = client.post(
        f"/api/v2/public/stores/{slug}/customers/register",
        json={"email": f"cu{suf}@example.com", "password": "12345678"},
    )
    tok = reg.json()["data"]["access_token"]
    r = client.get("/api/v1/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401
