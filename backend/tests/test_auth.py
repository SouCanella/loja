"""Auth e isolamento por loja."""

from fastapi.testclient import TestClient


def test_register_login_me(client: TestClient) -> None:
    reg = client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Minha Loja",
            "store_slug": "minha-loja",
            "admin_email": "admin@example.com",
            "password": "senha-segura-1",
        },
    )
    assert reg.status_code == 201
    body = reg.json()
    assert "access_token" in body
    assert body.get("refresh_token")
    store_id = body["store_id"]

    login = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "senha-segura-1"},
    )
    assert login.status_code == 200
    login_body = login.json()
    token = login_body["access_token"]
    assert login_body.get("refresh_token")

    me = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    data = me.json()
    assert data["email"] == "admin@example.com"
    assert data["store_id"] == store_id
    assert data["role"] == "store_admin"
    assert data.get("store_target_margin_percent") in ("30", 30)
    assert data.get("store_labor_rate_per_hour") in ("0", 0)

    refreshed = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": login_body["refresh_token"]},
    )
    assert refreshed.status_code == 200
    assert refreshed.json().get("access_token")
    assert refreshed.json().get("refresh_token")

    patch_margin = client.patch(
        "/api/v1/me/store-pricing",
        headers={"Authorization": f"Bearer {token}"},
        json={"target_margin_percent": "25"},
    )
    assert patch_margin.status_code == 200
    assert patch_margin.json().get("store_target_margin_percent") in ("25", 25)


def test_two_stores_isolated_users(client: TestClient) -> None:
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja A",
            "store_slug": "loja-a",
            "admin_email": "a@example.com",
            "password": "senha-segura-1",
        },
    )
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja B",
            "store_slug": "loja-b",
            "admin_email": "b@example.com",
            "password": "senha-segura-2",
        },
    )

    login_a = client.post(
        "/api/v1/auth/login",
        data={"username": "a@example.com", "password": "senha-segura-1"},
    )
    token_a = login_a.json()["access_token"]
    me_a = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token_a}"})
    assert me_a.json()["email"] == "a@example.com"

    login_b = client.post(
        "/api/v1/auth/login",
        data={"username": "b@example.com", "password": "senha-segura-2"},
    )
    token_b = login_b.json()["access_token"]
    me_b = client.get("/api/v1/me", headers={"Authorization": f"Bearer {token_b}"})
    assert me_b.json()["email"] == "b@example.com"
    assert me_b.json()["store_id"] != me_a.json()["store_id"]
