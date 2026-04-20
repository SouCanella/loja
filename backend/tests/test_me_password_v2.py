"""PATCH /api/v2/me/password — alteração de palavra-passe do painel."""

from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def test_patch_password_wrong_current(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    r = client.patch(
        "/api/v2/me/password",
        headers=h,
        json={"current_password": "wrong-pass-99", "new_password": "nova-senha-8"},
    )
    assert r.status_code == 400
    raw = r.json()
    text = str(raw).lower()
    assert "incorrecta" in text or "actual" in text or "senha" in text


def test_patch_password_success_and_login(client: TestClient) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    r = client.patch(
        "/api/v2/me/password",
        headers=h,
        json={"current_password": "senha-segura-9", "new_password": "outra-senha-9"},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    assert body["data"]["email"]

    # Login com a nova senha
    email = body["data"]["email"]
    login = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "outra-senha-9"},
    )
    assert login.status_code == 200, login.text
    assert login.json().get("access_token")
