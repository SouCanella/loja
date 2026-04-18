"""Endpoints públicos da vitrine."""

import uuid

from fastapi.testclient import TestClient


def test_public_store_categories_and_products(client: TestClient) -> None:
    suffix = uuid.uuid4().hex[:8]
    slug = f"pub-{suffix}"
    email = f"vitrine-{suffix}@example.com"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Doçura Pública",
            "store_slug": slug,
            "admin_email": email,
            "password": "senha-segura-1",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "senha-segura-1"},
    )
    h = {"Authorization": f"Bearer {login.json()['access_token']}"}

    client.post(
        "/api/v1/categories",
        json={"name": "Bolos", "slug": "bolos"},
        headers=h,
    )
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Bolo chocolate",
            "price": "45.00",
            "inventory": {
                "unit": "un",
                "initial_quantity": "3",
                "unit_cost": "20.00",
            },
        },
        headers=h,
    )
    assert pr.status_code == 201
    pid = pr.json()["id"]

    st = client.get(f"/api/v1/public/stores/{slug}")
    assert st.status_code == 200
    assert st.json()["name"] == "Doçura Pública"
    assert st.json()["slug"] == slug

    cats = client.get(f"/api/v1/public/stores/{slug}/categories")
    assert cats.status_code == 200
    assert len(cats.json()) >= 1

    prods = client.get(f"/api/v1/public/stores/{slug}/products")
    assert prods.status_code == 200
    body = prods.json()
    assert len(body) >= 1
    assert body[0]["id"] == pid

    one = client.get(f"/api/v1/public/stores/{slug}/products/{pid}")
    assert one.status_code == 200
    assert one.json()["name"] == "Bolo chocolate"
