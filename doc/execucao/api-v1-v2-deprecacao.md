# API `/api/v1` vs `/api/v2` — envelope DEC-06 e política de evolução

**Norma:** [DEC-06](../projeto/decisoes-e-pendencias.md) (envelope `{ success, data, errors }`).  
**Auditoria:** [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md).

---

## 1. Estado actual (2026-04-17)

| Prefixo | Formato de sucesso | Erros HTTP | Clientes oficiais |
|---------|--------------------|------------|-------------------|
| **`/api/v1`** | JSON **directo** do schema Pydantic | Corpo típico FastAPI `{"detail": …}` ou lista de validação | Testes pytest, integrações que ainda fixem v1; **paridade** com v2 |
| **`/api/v2`** | **`{ "success": true, "data": <payload>, "errors": null }`** | **`{ "success": false, "data": null, "errors": [ { "message", "code", "field" } ] }`** (handlers em `app/main.py`) | **Aplicação web Next.js** (painel, login, vitrine SSR via `getApiBaseUrl()`), integrações novas |

O mesmo modelo de domínio aparece em v1 **sem** wrapper e em v2 **dentro** de `data`.

---

## 2. Rotas `/api/v2` implementadas (paridade com v1)

Rotas **sem JWT:** `GET /api/v2/health`, `POST /api/v2/auth/register`, `POST /api/v2/auth/login`, `POST /api/v2/auth/refresh`, `GET /api/v2/public/...`

Rotas **com Bearer:** restantes espelham os recursos autenticados de v1.

| Método | Caminho v2 | `data` em sucesso (tipo) |
|--------|------------|---------------------------|
| GET | `/api/v2/health` | `{ status }` |
| POST | `/api/v2/auth/register` | `RegisterResponse` |
| POST | `/api/v2/auth/login` | `TokenResponse` |
| POST | `/api/v2/auth/refresh` | `TokenResponse` |
| GET | `/api/v2/me` | `UserMeResponse` |
| PATCH | `/api/v2/me/store-pricing` | `UserMeResponse` |
| GET | `/api/v2/categories` | `CategoryOut[]` |
| POST | `/api/v2/categories` | `CategoryOut` |
| DELETE | `/api/v2/categories/{id}` | `null` |
| GET | `/api/v2/products` | `ProductOut[]` |
| POST | `/api/v2/products` | `ProductOut` |
| GET | `/api/v2/products/{id}` | `ProductOut` |
| GET | `/api/v2/inventory-items` | `InventoryItemListOut[]` |
| GET | `/api/v2/inventory-items/{id}` | `InventoryItemDetailOut` |
| POST | `/api/v2/inventory-items` | `InventoryItemDetailOut` |
| PATCH | `/api/v2/inventory-items/{id}` | `InventoryItemDetailOut` |
| DELETE | `/api/v2/inventory-items/{id}` | `null` |
| GET | `/api/v2/orders` | `OrderOut[]` |
| POST | `/api/v2/orders` | `OrderDetailOut` |
| GET | `/api/v2/orders/{id}` | `OrderDetailOut` |
| PATCH | `/api/v2/orders/{id}/status` | `OrderDetailOut` |
| GET | `/api/v2/recipes` | `RecipeOut[]` |
| POST | `/api/v2/recipes` | `RecipeOut` |
| GET | `/api/v2/recipes/{id}` | `RecipeOut` |
| PATCH | `/api/v2/recipes/{id}` | `RecipeOut` |
| POST | `/api/v2/production` | `ProductionRunOut` |
| GET | `/api/v2/reports/financial` | `FinancialReportOut` |
| GET | `/api/v2/public/stores/{slug}` | `StorePublicOut` |
| GET | `/api/v2/public/stores/{slug}/categories` | `CategoryPublicOut[]` |
| GET | `/api/v2/public/stores/{slug}/products` | `ProductPublicOut[]` |
| GET | `/api/v2/public/stores/{slug}/products/{product_id}` | `ProductPublicOut` |

A lógica de negócio está em `app/api/handlers/` (partilhada com v1). Novas rotas: implementar no handler, expor em v1 e v2, actualizar esta tabela e `make openapi-export`.

---

## 3. Política de deprecação de `/api/v1` (proposta)

1. **Não há data de desligamento:** `/api/v1` permanece suportado enquanto o painel e integrações existentes dependam dele.
2. **Novos clientes** (mobile, parceiros) devem preferir **`/api/v2`** para contrato estável e erros homogéneos.
3. **Alinhamento futuro:** o **frontend da loja já consome v2** (2026-04-17); a **declaração formal de deprecação de v1** (header `Deprecation`, prazos) fica para quando o ecossistema de testes/integrações estiver alinhado — **não planeado no curto prazo**.
4. **Versionamento OpenAPI:** [`doc/api/openapi.json`](../api/openapi.json) agrega v1 e v2; filtrar por prefixo de path.

---

## 4. Relatório financeiro — margem vs COGS por lote (trabalho futuro)

O relatório inclui **`period_margin_estimate`**, **`period_margin_percent`**, **`by_product[]`**, **`by_category[]`**, **`by_order_status[]`** — sempre com **aproximação no período** (receita de pedidos vs custo agregado de corridas de produção por produto/categoria). **COGS por lote** (custo exacto dos lotes vendidos) exigiria ligar linhas de pedido a movimentos de stock / lotes — evolução normativa e modelo; ver backlog e RN de stock quando priorizado.

---

## 5. Cliente Next.js (`frontend/`)

| Área | Ficheiros / notas |
|------|-------------------|
| Envelope v2 | `frontend/lib/api-v2.ts` |
| Painel autenticado | `frontend/lib/painel-api.ts` — todas as rotas usam prefixo v2; *refresh* em `/api/v2/auth/refresh` |
| Login | `frontend/app/login/page.tsx` — `POST /api/v2/auth/login`, tokens em `data` |
| Vitrine (RSC) | `frontend/lib/vitrine/server-fetch.ts` — `GET /api/v2/public/...` + *unwrap* |
| Testes | `frontend/__tests__/painel-api.test.ts` — mocks com `{ success, data }` / `{ success: false, errors }` |

Variável: `NEXT_PUBLIC_API_URL` (ver `.env.example`).

---

## 6. Desenvolvimento local rápido

Ver [README.md](../../README.md) e alvo **`make dev`**: Postgres só em Docker, API e Next no host com *hot reload* para testar painel/vitrine.
