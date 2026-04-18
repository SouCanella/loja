"""GET /me expõe vitrine_whatsapp a partir do tema da loja."""

import uuid

from app.models.store import Store
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_me_includes_vitrine_whatsapp_when_theme_set(
    client: TestClient, db_session: Session
) -> None:
    suffix = uuid.uuid4().hex[:8]
    email = f"me-wa-{suffix}@example.com"
    slug = f"loja-wa-{suffix}"
    client.post(
        "/api/v1/auth/register",
        json={
            "store_name": "Loja WA",
            "store_slug": slug,
            "admin_email": email,
            "password": "senha-segura-1",
        },
    )
    login = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "senha-segura-1"},
    )
    token = login.json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}

    me1 = client.get("/api/v1/me", headers=h).json()
    assert me1.get("vitrine_whatsapp") in (None, "")

    store = db_session.get(Store, uuid.UUID(me1["store_id"]))
    assert store is not None
    store.theme = {"vitrine": {"whatsapp": "+5511987654321"}}
    db_session.commit()

    me2 = client.get("/api/v1/me", headers=h).json()
    assert me2["vitrine_whatsapp"] == "+5511987654321"
