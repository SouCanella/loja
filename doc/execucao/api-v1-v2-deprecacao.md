# API `/api/v1` vs `/api/v2` — envelope DEC-06 e política de evolução

**Norma:** [DEC-06](../projeto/decisoes-e-pendencias.md) (envelope `{ success, data, errors }`).  
**Auditoria:** [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md).

---

## 1. Estado actual (2026-04-19)

| Prefixo | Formato de sucesso | Erros HTTP | Clientes oficiais |
|---------|--------------------|------------|---------------------|
| **`/api/v1`** | JSON **directo** do schema Pydantic (ex.: `OrderOut`, `TokenResponse`) | Corpo típico FastAPI `{"detail": …}` ou lista de validação | **Painel Next.js** (`NEXT_PUBLIC_API_URL`), testes pytest, fluxos documentados |
| **`/api/v2`** | **`{ "success": true, "data": <payload>, "errors": null }`** | **`{ "success": false, "data": null, "errors": [ { "message", "code", "field" } ] }`** em rotas sob `/api/v2` (handlers em `app/main.py`) | Nenhum cliente obrigatório ainda; para integrações novas ou SDKs |

O mesmo modelo de domínio (ex.: `FinancialReportOut`) aparece em v1 **sem** wrapper e em v2 **dentro** de `data`.

---

## 2. Rotas `/api/v2` implementadas

| Método | Caminho | Auth | `data` (sucesso) |
|--------|---------|------|------------------|
| GET | `/api/v2/health` | Não | `{ "status": "ok" }` |
| POST | `/api/v2/auth/register` | Não | `RegisterResponse` |
| POST | `/api/v2/auth/login` | Não (form OAuth2) | `TokenResponse` |
| POST | `/api/v2/auth/refresh` | Não (body JSON) | `TokenResponse` |
| GET | `/api/v2/reports/financial` | Bearer | `FinancialReportOut` |
| GET | `/api/v2/orders` | Bearer | `OrderOut[]` |
| GET | `/api/v2/inventory-items` | Bearer | `InventoryItemListOut[]` |

Novas rotas v2 devem seguir o mesmo padrão de envelope e documentação neste ficheiro + `make openapi-export`.

---

## 3. Política de deprecação de `/api/v1` (proposta)

1. **Não há data de desligamento:** `/api/v1` permanece suportado enquanto o painel e integrações existentes dependam dele.
2. **Novos clientes** (mobile, parceiros) devem preferir **`/api/v2`** para contrato estável e erros homogéneos.
3. **Alinhamento futuro:** quando todas as rotas críticas tiverem equivalente v2 e o frontend migrar, pode declarar-se **fase de deprecação** (avisos `Deprecation` header ou documento de roadmap) antes de remover v1 — **não planeado no curto prazo**.
4. **Versionamento OpenAPI:** o ficheiro [`doc/api/openapi.json`](../api/openapi.json) agrega v1 e v2 no mesmo schema; clientes podem filtrar por prefixo de path.

---

## 4. Relatório financeiro — margem vs COGS por lote (trabalho futuro)

O relatório actual (`period_margin_estimate`, `by_product[]`) usa **aproximação no período** (receita de pedidos vs custo agregado de corridas de produção por produto). **COGS por lote** (custo exacto dos lotes vendidos) exigiria ligar linhas de pedido a movimentos de stock / lotes — evolução normativa e modelo; ver backlog e RN de stock quando priorizado.

---

## 5. Desenvolvimento local rápido

Ver [README.md](../../README.md) e alvo **`make dev`**: Postgres só em Docker, API e Next no host com *hot reload* para testes manuais das páginas.
