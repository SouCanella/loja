"""Helpers para testes de contrato HTTP (registo rápido de loja + token)."""

import uuid

from fastapi.testclient import TestClient


def register_random_store(client: TestClient) -> dict:
    """Cria loja + admin; devolve headers Bearer e ids."""
    suffix = uuid.uuid4().hex[:8]
    r = client.post(
        "/api/v1/auth/register",
        json={
            "store_name": f"Loja {suffix}",
            "store_slug": f"t-{suffix}",
            "admin_email": f"u{suffix}@example.com",
            "password": "senha-segura-9",
        },
    )
    assert r.status_code == 201, r.text
    body = r.json()
    return {
        "headers": {"Authorization": f"Bearer {body['access_token']}"},
        "store_id": body["store_id"],
        "user_id": body["user_id"],
    }
