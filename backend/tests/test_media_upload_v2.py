"""POST /api/v2/media/upload — MA-03 modo local."""

from io import BytesIO

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from tests.contract_helpers import register_random_store


@pytest.fixture
def media_tmp(monkeypatch, tmp_path):
    root = tmp_path / "media_store"
    root.mkdir()
    monkeypatch.setenv("MEDIA_ROOT", str(root))
    monkeypatch.setenv("MEDIA_BACKEND", "local")
    get_settings.cache_clear()
    yield root
    get_settings.cache_clear()


def test_media_upload_jpeg_and_serve(client: TestClient, auth_headers: dict, media_tmp) -> None:
    r = client.post(
        "/api/v2/media/upload",
        headers=auth_headers,
        data={"purpose": "product"},
        files={"file": ("x.jpg", BytesIO(b"\xff\xd8\xff\xd9"), "image/jpeg")},
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    url = body["data"]["public_url"]
    assert "/media/" in url

    r2 = client.get(url.replace("http://testserver", ""))
    assert r2.status_code == 200
    assert r2.headers.get("content-type", "").startswith("image/")


def test_media_upload_rejects_large(client: TestClient, auth_headers: dict, media_tmp) -> None:
    big = BytesIO(b"x" * (6 * 1024 * 1024))
    r = client.post(
        "/api/v2/media/upload",
        headers=auth_headers,
        data={"purpose": "product"},
        files={"file": ("h.jpg", big, "image/jpeg")},
    )
    assert r.status_code == 400


def test_media_upload_requires_auth(client: TestClient, media_tmp) -> None:
    r = client.post(
        "/api/v2/media/upload",
        data={"purpose": "product"},
        files={"file": ("x.png", BytesIO(b"\x89PNG\r\n\x1a\n\x00"), "image/png")},
    )
    assert r.status_code == 401
