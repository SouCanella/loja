"""Tema da vitrine pública: helpers e GET /public/stores (v1 + envelope v2)."""

from __future__ import annotations

import uuid

from app.api.handlers.public_catalog import _overlay_percent, _safe_https_url
from app.models.store import Store
from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def test_safe_https_url_accepts_https_and_strips() -> None:
    assert _safe_https_url("  https://cdn.example/logo.png  ") == "https://cdn.example/logo.png"
    assert _safe_https_url("https://a/b?x=1") == "https://a/b?x=1"


def test_safe_https_url_rejects_non_https_and_invalid() -> None:
    assert _safe_https_url("http://insecure.com/x.jpg") is None
    assert _safe_https_url("//cdn.net/x") is None
    assert _safe_https_url("") is None
    assert _safe_https_url(None) is None
    assert _safe_https_url(123) is None


def test_overlay_percent_defaults_and_clamps() -> None:
    assert _overlay_percent(None) == 88
    assert _overlay_percent(True) == 88
    assert _overlay_percent(False) == 88
    assert _overlay_percent(object()) == 88
    assert _overlay_percent(5) == 15
    assert _overlay_percent(200) == 97
    assert _overlay_percent(50) == 50


def test_overlay_percent_float_and_string() -> None:
    assert _overlay_percent(92.7) == 93
    assert _overlay_percent("92,5") == 92
    assert _overlay_percent("  40.2 ") == 40
    assert _overlay_percent("not-num") == 88


def test_public_store_v1_and_v2_return_appearance_theme(
    client: TestClient, db_session
) -> None:
    ctx = register_random_store(client)
    slug = client.get("/api/v1/me", headers=ctx["headers"]).json()["store_slug"]
    store = db_session.get(Store, uuid.UUID(str(ctx["store_id"])))
    assert store is not None
    store.theme = {
        "vitrine": {
            "primary_color": "  #0f766e  ",
            "accent_color": "#f59e0b",
            "hero_image_url": "https://cdn.example/bg.jpg",
            "logo_image_url": "https://cdn.example/logo.png",
            "background_overlay_percent": 72,
            "hero_image_url_bad": "http://ignored.com/x.jpg",
            "logo_http": "http://bad.org/l.png",
        }
    }
    db_session.commit()

    j = client.get(f"/api/v1/public/stores/{slug}").json()
    assert j["primary_color"] == "#0f766e"
    assert j["accent_color"] == "#f59e0b"
    assert j["hero_image_url"] == "https://cdn.example/bg.jpg"
    assert j["logo_image_url"] == "https://cdn.example/logo.png"
    assert j["background_overlay_percent"] == 72

    r2 = client.get(f"/api/v2/public/stores/{slug}")
    assert r2.status_code == 200
    body = r2.json()
    assert body["success"] is True
    d = body["data"]
    assert d["primary_color"] == "#0f766e"
    assert d["accent_color"] == "#f59e0b"
    assert d["hero_image_url"] == "https://cdn.example/bg.jpg"
    assert d["logo_image_url"] == "https://cdn.example/logo.png"
    assert d["background_overlay_percent"] == 72


def test_public_store_strips_invalid_image_urls_and_overlay_string(
    client: TestClient, db_session
) -> None:
    ctx = register_random_store(client)
    slug = client.get("/api/v1/me", headers=ctx["headers"]).json()["store_slug"]
    store = db_session.get(Store, uuid.UUID(str(ctx["store_id"])))
    assert store is not None
    store.theme = {
        "vitrine": {
            "hero_image_url": "http://only-http.com/a.jpg",
            "logo_image_url": "ftp://x/y",
            "background_overlay_percent": "95,0",
        }
    }
    db_session.commit()

    j = client.get(f"/api/v1/public/stores/{slug}").json()
    assert j["hero_image_url"] is None
    assert j["logo_image_url"] is None
    assert j["background_overlay_percent"] == 95
