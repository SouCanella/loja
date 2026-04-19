"""Fecho de lacunas de cobertura: JWT/deps, auth, receitas, pedidos, produção, público, v2."""

from __future__ import annotations

import uuid
from unittest.mock import patch
from uuid import UUID

import pytest
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token
from app.models.product import Product
from app.models.store import Store
from fastapi.testclient import TestClient

from tests.contract_helpers import register_random_store


def _uuid(s: str | UUID) -> UUID:
    return UUID(str(s))


# --- JWT / deps (get_current_user) ---


def test_jwt_missing_store_id_claim_returns_401(client: TestClient) -> None:
    ctx = register_random_store(client)
    uid = str(ctx["user_id"])
    tok = create_access_token(uid, {})
    r = client.get("/api/v1/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401


def test_jwt_invalid_sub_returns_401(client: TestClient) -> None:
    ctx = register_random_store(client)
    tok = create_access_token("not-a-uuid", {"store_id": str(ctx["store_id"])})
    r = client.get("/api/v1/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401


def test_jwt_unknown_user_returns_401(client: TestClient) -> None:
    ctx = register_random_store(client)
    tok = create_access_token(str(uuid.uuid4()), {"store_id": str(ctx["store_id"])})
    r = client.get("/api/v1/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401


def test_jwt_store_mismatch_returns_401(client: TestClient) -> None:
    ctx = register_random_store(client)
    tok = create_access_token(
        str(ctx["user_id"]),
        {"store_id": str(uuid.uuid4())},
    )
    r = client.get("/api/v1/me", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 401


def test_jwt_malformed_token_returns_401(client: TestClient) -> None:
    r = client.get("/api/v1/me", headers={"Authorization": "Bearer totally.not.jwt"})
    assert r.status_code == 401


def test_decode_refresh_rejects_access_token() -> None:
    tok = create_access_token(str(uuid.uuid4()), {"store_id": str(uuid.uuid4())})
    with pytest.raises(ValueError, match="refresh"):
        decode_refresh_token(tok)


# --- Rate limit login ---


def test_login_rate_limit_429_v1(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    import app.core.login_rate_limit as rl

    rl._attempts.clear()

    class _S:
        login_rate_limit_max_attempts = 3
        login_rate_limit_window_seconds = 9999

    monkeypatch.setattr("app.api.v1.endpoints.auth.get_settings", lambda: _S())

    last = None
    for _ in range(4):
        last = client.post(
            "/api/v1/auth/login",
            data={"username": "no-one@example.com", "password": "wrong"},
        )
    assert last is not None
    assert last.status_code == 429
    rl._attempts.clear()


# --- v2 auth envelope (happy paths + 409) ---


def test_v2_register_login_refresh_happy_path(client: TestClient) -> None:
    suf = uuid.uuid4().hex[:8]
    reg = client.post(
        "/api/v2/auth/register",
        json={
            "store_name": f"V2 {suf}",
            "store_slug": f"v2-{suf}",
            "admin_email": f"v2{suf}@example.com",
            "password": "senha-segura-9",
        },
    )
    assert reg.status_code == 201
    body = reg.json()
    assert body["success"] is True
    assert body["data"]["access_token"]

    login = client.post(
        "/api/v2/auth/login",
        data={"username": f"v2{suf}@example.com", "password": "senha-segura-9"},
    )
    assert login.status_code == 200
    lj = login.json()
    assert lj["success"] is True
    rt = lj["data"]["refresh_token"]

    ref = client.post("/api/v2/auth/refresh", json={"refresh_token": rt})
    assert ref.status_code == 200
    assert ref.json()["success"] is True
    assert ref.json()["data"]["access_token"]


def test_v2_register_conflict_envelope(client: TestClient) -> None:
    suf = uuid.uuid4().hex[:8]
    payload = {
        "store_name": "Dup",
        "store_slug": f"dup-{suf}",
        "admin_email": f"dup{suf}@example.com",
        "password": "senha-segura-9",
    }
    assert client.post("/api/v2/auth/register", json=payload).status_code == 201
    r2 = client.post("/api/v2/auth/register", json=payload)
    assert r2.status_code == 409


# --- Recipes / products / categories ---


def test_recipes_list_get_patch_flow_and_errors(client: TestClient) -> None:
    h = register_random_store(client)["headers"]

    pr_done = client.post(
        "/api/v1/products",
        json={
            "name": "Acabado",
            "price": "10",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    )
    pr_ing = client.post(
        "/api/v1/products",
        json={
            "name": "Insumo",
            "price": "1",
            "inventory": {"unit": "kg", "initial_quantity": "10", "unit_cost": "1"},
        },
        headers=h,
    )
    pid_done = pr_done.json()["id"]
    ing_item = pr_ing.json()["inventory_item_id"]

    lst0 = client.get("/api/v1/recipes", headers=h)
    assert lst0.status_code == 200
    assert lst0.json() == []

    bad_prod = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": str(uuid.uuid4()),
            "yield_quantity": "1",
            "items": [{"inventory_item_id": ing_item, "quantity": "1"}],
        },
    )
    assert bad_prod.status_code == 400

    rc = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": pid_done,
            "yield_quantity": "2",
            "items": [{"inventory_item_id": ing_item, "quantity": "1"}],
        },
    )
    assert rc.status_code == 201
    rid = rc.json()["id"]

    dup = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": pid_done,
            "yield_quantity": "1",
            "items": [{"inventory_item_id": ing_item, "quantity": "0.5"}],
        },
    )
    assert dup.status_code == 409

    dup_line = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": str(pr_ing.json()["id"]),
            "yield_quantity": "1",
            "items": [
                {"inventory_item_id": ing_item, "quantity": "1"},
                {"inventory_item_id": ing_item, "quantity": "1"},
            ],
        },
    )
    assert dup_line.status_code == 400

    bad_inv = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": str(pr_ing.json()["id"]),
            "yield_quantity": "1",
            "items": [{"inventory_item_id": str(uuid.uuid4()), "quantity": "1"}],
        },
    )
    assert bad_inv.status_code == 400

    other = register_random_store(client)
    other_item = client.post(
        "/api/v1/products",
        json={
            "name": "Outro",
            "price": "1",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=other["headers"],
    ).json()["inventory_item_id"]

    steal = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": str(pr_ing.json()["id"]),
            "yield_quantity": "1",
            "items": [{"inventory_item_id": other_item, "quantity": "1"}],
        },
    )
    assert steal.status_code == 400

    solo = client.post(
        "/api/v1/products",
        json={
            "name": "Só para insumo=acabado",
            "price": "1",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    same_as_product = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": solo["id"],
            "yield_quantity": "1",
            "items": [{"inventory_item_id": solo["inventory_item_id"], "quantity": "1"}],
        },
    )
    assert same_as_product.status_code == 400

    assert client.get(f"/api/v1/recipes/{uuid.uuid4()}", headers=h).status_code == 404

    one = client.get(f"/api/v1/recipes/{rid}", headers=h)
    assert one.status_code == 200

    bad_patch = client.patch(
        f"/api/v1/recipes/{rid}",
        headers=h,
        json={
            "items": [
                {"inventory_item_id": ing_item, "quantity": "1"},
                {"inventory_item_id": ing_item, "quantity": "2"},
            ]
        },
    )
    assert bad_patch.status_code == 400

    assert len(client.get("/api/v1/recipes", headers=h).json()) >= 1


def test_recipe_cost_exception_returns_null_estimate(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    p1 = client.post(
        "/api/v1/products",
        json={
            "name": "A",
            "price": "1",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    p2 = client.post(
        "/api/v1/products",
        json={
            "name": "B",
            "price": "1",
            "inventory": {"unit": "kg", "initial_quantity": "2", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    with patch(
        "app.api.handlers.recipes.estimate_recipe_unit_cost",
        side_effect=RuntimeError("boom"),
    ):
        rc = client.post(
            "/api/v1/recipes",
            headers=h,
            json={
                "product_id": p1["id"],
                "yield_quantity": "1",
                "items": [{"inventory_item_id": p2["inventory_item_id"], "quantity": "1"}],
            },
        )
    assert rc.status_code == 201
    assert rc.json()["estimated_unit_cost"] is None


def test_products_list_category_and_404(client: TestClient, db_session) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    cat = client.post(
        "/api/v1/categories",
        json={"name": "Doces", "slug": "doces"},
        headers=h,
    )
    assert cat.status_code == 201
    cid = cat.json()["id"]

    client.post(
        "/api/v1/products",
        json={
            "name": "P1",
            "price": "5",
            "category_id": cid,
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    )
    empty_slug = client.get("/api/v1/products?category_slug=zzz", headers=h)
    assert empty_slug.status_code == 200
    assert empty_slug.json() == []

    filtered = client.get("/api/v1/products?category_slug=doces", headers=h)
    assert len(filtered.json()) == 1

    bad_cat = client.post(
        "/api/v1/products",
        json={
            "name": "X",
            "price": "1",
            "category_id": str(uuid.uuid4()),
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    )
    assert bad_cat.status_code == 400

    assert (
        client.get(f"/api/v1/products/{uuid.uuid4()}", headers=h).status_code == 404
    )

    # inactive visível com active_only=false
    pid = filtered.json()[0]["id"]
    p = db_session.get(Product, _uuid(pid))
    assert p is not None
    p.active = False
    db_session.commit()

    all_p = client.get("/api/v1/products?active_only=false", headers=h)
    assert any(x["id"] == pid for x in all_p.json())


def test_categories_delete_404_and_slug_conflict(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    r1 = client.post(
        "/api/v1/categories",
        json={"name": "A", "slug": "dup-slug"},
        headers=h,
    )
    assert r1.status_code == 201
    r2 = client.post(
        "/api/v1/categories",
        json={"name": "B", "slug": "dup-slug"},
        headers=h,
    )
    assert r2.status_code == 409
    assert client.delete(f"/api/v1/categories/{uuid.uuid4()}", headers=h).status_code == 404


# --- Orders idempotência + produto inválido ---


def test_orders_idempotency_returns_same_order(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Pedido",
            "price": "10",
            "inventory": {"unit": "un", "initial_quantity": "5", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    pid = pr["id"]
    body = {"items": [{"product_id": pid, "quantity": "1"}]}
    o1 = client.post(
        "/api/v1/orders",
        json=body,
        headers={**h, "Idempotency-Key": "idem-1"},
    )
    assert o1.status_code == 201
    oid = o1.json()["id"]
    o2 = client.post(
        "/api/v1/orders",
        json=body,
        headers={**h, "Idempotency-Key": "idem-1"},
    )
    assert o2.status_code == 201
    assert o2.json()["id"] == oid


def test_orders_invalid_product_400(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    r = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": str(uuid.uuid4()), "quantity": "1"}]},
        headers=h,
    )
    assert r.status_code == 400


# --- Produção 404 e stock insuficiente ---


def test_production_recipe_not_found_404(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    r = client.post(
        "/api/v1/production",
        json={"recipe_id": str(uuid.uuid4())},
        headers=h,
    )
    assert r.status_code == 404


def test_production_insufficient_stock_400(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    p_done = client.post(
        "/api/v1/products",
        json={
            "name": "Bolo",
            "price": "20",
            "inventory": {"unit": "un", "initial_quantity": "0.001", "unit_cost": "0"},
        },
        headers=h,
    ).json()
    p_flour = client.post(
        "/api/v1/products",
        json={
            "name": "Farinha",
            "price": "2",
            "inventory": {"unit": "kg", "initial_quantity": "0.5", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    rc = client.post(
        "/api/v1/recipes",
        json={
            "product_id": p_done["id"],
            "yield_quantity": "1",
            "items": [{"inventory_item_id": p_flour["inventory_item_id"], "quantity": "100"}],
        },
        headers=h,
    )
    assert rc.status_code == 201
    pr = client.post(
        "/api/v1/production",
        json={"recipe_id": rc.json()["id"]},
        headers=h,
    )
    assert pr.status_code == 400


# --- Público: tema, redes, filtro categoria vazio ---


def test_public_store_theme_social_and_product_filters(client: TestClient, db_session) -> None:
    ctx = register_random_store(client)
    h = ctx["headers"]
    me = client.get("/api/v1/me", headers=h).json()
    slug = me["store_slug"]
    store = db_session.get(Store, _uuid(ctx["store_id"]))
    assert store is not None
    store.theme = {
        "vitrine": {
            "tagline": "Delícias",
            "logo_emoji": "🧁",
            "whatsapp": "+351911",
            "social_networks": [
                {"url": "https://a.example", "label": "A", "icon": "link"},
                {"nourl": True},
                "bad",
            ],
        }
    }
    db_session.commit()

    st = client.get(f"/api/v1/public/stores/{slug}")
    assert st.status_code == 200
    j = st.json()
    assert j["tagline"] == "Delícias"
    assert j["logo_emoji"] == "🧁"
    assert j["whatsapp"] == "+351911"
    assert len(j["social_networks"]) == 1
    assert j["social_networks"][0]["url"] == "https://a.example"

    client.post(
        "/api/v1/categories",
        json={"name": "C", "slug": "cat-x"},
        headers=h,
    )
    assert (
        client.get(f"/api/v1/public/stores/{slug}/products?category_slug=nada").json() == []
    )

    store.theme = []
    db_session.commit()
    assert client.get(f"/api/v1/public/stores/{slug}").status_code == 200


def test_inventory_post_with_initial_batch_detail(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    r = client.post(
        "/api/v1/inventory-items",
        headers=h,
        json={
            "name": "Lote",
            "unit": "kg",
            "initial_batch": {"quantity": "1", "unit_cost": "2"},
        },
    )
    assert r.status_code == 201


def test_get_order_unknown_404(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    assert client.get(f"/api/v1/orders/{uuid.uuid4()}", headers=h).status_code == 404


def test_list_orders_empty_ok(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    r = client.get("/api/v1/orders", headers=h)
    assert r.status_code == 200
    assert r.json() == []


def test_v2_login_401_wrong_password(client: TestClient) -> None:
    suf = uuid.uuid4().hex[:8]
    client.post(
        "/api/v2/auth/register",
        json={
            "store_name": "L",
            "store_slug": f"v2b-{suf}",
            "admin_email": f"v2b{suf}@example.com",
            "password": "right-pass-1",
        },
    )
    r = client.post(
        "/api/v2/auth/login",
        data={"username": f"v2b{suf}@example.com", "password": "wrong"},
    )
    assert r.status_code == 401


def test_v2_refresh_401_invalid_token(client: TestClient) -> None:
    r = client.post(
        "/api/v2/auth/refresh",
        json={"refresh_token": "eyJhbGciOiJIUzI1NiJ9.e30.invalidsig"},
    )
    assert r.status_code == 401


def test_v1_refresh_without_store_id_claim(client: TestClient) -> None:
    ctx = register_random_store(client)
    rt = create_refresh_token(str(ctx["user_id"]), {})
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": rt})
    assert r.status_code == 401


def test_v1_refresh_invalid_sub_value(client: TestClient) -> None:
    rt = create_refresh_token("nope", {"store_id": str(uuid.uuid4())})
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": rt})
    assert r.status_code == 401


def test_v1_refresh_valid_uuid_user_missing_returns_401(client: TestClient) -> None:
    ctx = register_random_store(client)
    rt = create_refresh_token(
        str(uuid.uuid4()),
        {"store_id": str(ctx["store_id"])},
    )
    r = client.post("/api/v1/auth/refresh", json={"refresh_token": rt})
    assert r.status_code == 401


def test_inventory_get_has_sale_product_and_patch_unit_strip(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Com stock",
            "price": "3",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    )
    iid = pr.json()["inventory_item_id"]
    g = client.get(f"/api/v1/inventory-items/{iid}", headers=h)
    assert g.status_code == 200
    assert g.json()["has_sale_product"] is True

    solo = client.post(
        "/api/v1/inventory-items",
        headers=h,
        json={"name": "Só", "unit": "kg"},
    ).json()["id"]
    p404 = client.patch(
        f"/api/v1/inventory-items/{uuid.uuid4()}",
        headers=h,
        json={"name": "x"},
    )
    assert p404.status_code == 404

    pu = client.patch(
        f"/api/v1/inventory-items/{solo}",
        headers=h,
        json={"unit": "   "},
    )
    assert pu.status_code == 200
    assert pu.json()["unit"] == "un"

    assert client.delete(f"/api/v1/inventory-items/{uuid.uuid4()}", headers=h).status_code == 404


def test_public_routes_404_unknown_store(client: TestClient) -> None:
    assert client.get("/api/v1/public/stores/nao-existe-slug-xyz/categories").status_code == 404
    assert (
        client.get("/api/v1/public/stores/nao-existe-slug-xyz/products").status_code == 404
    )
    assert (
        client.get(f"/api/v1/public/stores/nao-existe-slug-xyz/products/{uuid.uuid4()}").status_code
        == 404
    )


def test_public_vitrine_inner_non_dict_uses_theme_root(client: TestClient, db_session) -> None:
    ctx = register_random_store(client)
    slug = client.get("/api/v1/me", headers=ctx["headers"]).json()["store_slug"]
    store = db_session.get(Store, _uuid(ctx["store_id"]))
    assert store is not None
    store.theme = {"vitrine": "not-a-dict", "tagline": "No topo"}
    db_session.commit()
    r = client.get(f"/api/v1/public/stores/{slug}")
    assert r.status_code == 200
    assert r.json()["tagline"] == "No topo"


def test_public_get_product_404_when_inactive(client: TestClient, db_session) -> None:
    h = register_random_store(client)["headers"]
    slug = client.get("/api/v1/me", headers=h).json()["store_slug"]
    pr = client.post(
        "/api/v1/products",
        json={
            "name": "Oculto",
            "price": "1",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    pid = pr["id"]
    p = db_session.get(Product, _uuid(pid))
    assert p is not None
    p.active = False
    db_session.commit()
    assert (
        client.get(f"/api/v1/public/stores/{slug}/products/{pid}").status_code == 404
    )


def test_patch_recipe_404_unknown_id(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    r = client.patch(
        f"/api/v1/recipes/{uuid.uuid4()}",
        headers=h,
        json={"yield_quantity": "1"},
    )
    assert r.status_code == 404


def test_public_products_filtered_by_existing_category(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    slug = client.get("/api/v1/me", headers=h).json()["store_slug"]
    cat = client.post(
        "/api/v1/categories",
        json={"name": "Filtro", "slug": "filtro"},
        headers=h,
    ).json()
    client.post(
        "/api/v1/products",
        json={
            "name": "P",
            "price": "1",
            "category_id": cat["id"],
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    )
    rows = client.get(
        f"/api/v1/public/stores/{slug}/products?category_slug=filtro",
    ).json()
    assert len(rows) == 1


def test_patch_recipe_success_and_duplicate_item_on_patch(client: TestClient) -> None:
    h = register_random_store(client)["headers"]
    p1 = client.post(
        "/api/v1/products",
        json={
            "name": "Fim",
            "price": "10",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    ing_a = client.post(
        "/api/v1/products",
        json={
            "name": "A",
            "price": "1",
            "inventory": {"unit": "kg", "initial_quantity": "5", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    ing_b = client.post(
        "/api/v1/products",
        json={
            "name": "B",
            "price": "1",
            "inventory": {"unit": "kg", "initial_quantity": "5", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    rc = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": p1["id"],
            "yield_quantity": "2",
            "items": [{"inventory_item_id": ing_a["inventory_item_id"], "quantity": "1"}],
        },
    )
    rid = rc.json()["id"]

    dup_patch = client.patch(
        f"/api/v1/recipes/{rid}",
        headers=h,
        json={
            "items": [
                {"inventory_item_id": ing_a["inventory_item_id"], "quantity": "1"},
                {"inventory_item_id": ing_a["inventory_item_id"], "quantity": "2"},
            ]
        },
    )
    assert dup_patch.status_code == 400

    ok = client.patch(
        f"/api/v1/recipes/{rid}",
        headers=h,
        json={
            "yield_quantity": "4",
            "target_margin_percent": "12",
            "items": [
                {"inventory_item_id": ing_b["inventory_item_id"], "quantity": "1"},
            ],
        },
    )
    assert ok.status_code == 200
    assert str(ok.json()["yield_quantity"]).startswith("4")
    assert client.get(f"/api/v1/recipes/{rid}", headers=h).json()["target_margin_percent"] in (
        "12",
        12,
        "12.00",
    )


def test_store_margin_invalid_config_falls_back(client: TestClient, db_session) -> None:
    ctx = register_random_store(client)
    store = db_session.get(Store, _uuid(ctx["store_id"]))
    assert store is not None
    store.config = {"pricing": {"target_margin_percent": "not-a-number"}}
    db_session.commit()
    me = client.get("/api/v1/me", headers=ctx["headers"])
    assert me.status_code == 200
    assert me.json()["store_target_margin_percent"] in ("30", 30)


def test_effective_margin_uses_recipe_target(client: TestClient) -> None:
    """Cobre effective_recipe_margin_percent quando receita tem margem própria."""
    h = register_random_store(client)["headers"]
    p1 = client.post(
        "/api/v1/products",
        json={
            "name": "F",
            "price": "10",
            "inventory": {"unit": "un", "initial_quantity": "1", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    ing = client.post(
        "/api/v1/products",
        json={
            "name": "I",
            "price": "1",
            "inventory": {"unit": "kg", "initial_quantity": "3", "unit_cost": "1"},
        },
        headers=h,
    ).json()
    rc = client.post(
        "/api/v1/recipes",
        headers=h,
        json={
            "product_id": p1["id"],
            "yield_quantity": "1",
            "target_margin_percent": "22",
            "items": [{"inventory_item_id": ing["inventory_item_id"], "quantity": "1"}],
        },
    )
    assert rc.status_code == 201
    out = rc.json()
    eff = str(out["effective_margin_percent"])
    assert eff.startswith("22")
