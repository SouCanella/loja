# Qualidade e conformidade com a documentação normativa

**Propósito:** registar o estado da implementação face às propostas de [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md), [documento_enterprise.md](../documento_enterprise.md) e [decisoes-e-pendencias.md](decisoes-e-pendencias.md).  
**Última auditoria:** 2026-04-19 (3) — cobertura global `app` ~**97%** + `test_coverage_gaps.py`.

---

## 1. Verificações automáticas (gate local e CI)

| Verificação | Comando / resultado | Notas |
|-------------|---------------------|--------|
| Lint backend | `make lint` → **Ruff** em `app/` e `tests/` | Deve passar antes de merge. |
| Lint frontend | `npm run lint` (Next.js / ESLint) | Idem. |
| Testes backend | `pytest tests/ -q` — **119** testes | Contratos HTTP (`test_http_contracts_*`), lacunas de rotas/JWT (`test_coverage_gaps.py`), `test_api_v2_envelope.py`, fluxos de domínio e `test_services_*`. |
| Cobertura **camada de serviço** | `pytest --cov=app/services --cov-fail-under=90` | **~94%** agregado em `app/services` (**RNF-QA-01**). Gate **90%** no CI. |
| Testes frontend | `npm run test` (Vitest) | `__tests__/painel-api.test.ts` — helpers e `apiPainelJson` com `fetch` / `localStorage` mock. |
| E2E | `npm run test:e2e` (Playwright) | Smoke `/login`; teste opcional login+painel com `E2E_EMAIL`/`E2E_PASSWORD` — ver `frontend/e2e/README.md` (**RNF-QA-03**). |
| Cobertura global `app` (referência) | `pytest --cov=app` | Total ~**97%** (referência 2026-04); restam sobretudo ramos raros (`IntegrityError` em produção, `init_db`, ramos defensivos em `stock` / `me`). |
| Contrato HTTP | `make openapi-export` → [doc/api/openapi.json](../api/openapi.json) | **RNF-DevEx-08**. |
| **CI (GitHub Actions)** | Workflow `CI` em push/PR para `main` | Backend: Ruff + pytest serviços ≥90%. Frontend: lint, Vitest, build, Playwright (`PW_SERVER_ONLY`). |

---

## 2. Conformidade explícita (o que está alinhado)

| Norma / decisão | Evidência no código / docs |
|-----------------|----------------------------|
| **RNF-SEC-01** isolamento por loja | Rotas autenticadas filtram por `current.store_id`; testes `test_auth.py` e fluxos de pedido por loja. |
| **RNF-Arq-02a** idempotência em pedidos | `POST /orders` com `Idempotency-Key` opcional; painel novo pedido envia header. |
| **RNF-Arq-02b** idempotência em produção | `POST /production` com `Idempotency-Key`; testes em `test_phase3_production.py`. |
| **RNF-Arq-04** regras no backend | Serviços `order_flow`, `stock`, `production_service`, `pricing`; não só no front. |
| **DEC-09 / DEC-17** custo e baixa | `pricing.py`, `production_service.py`, `stock.py` + testes de produção. |
| **DEC-14** estados de pedido | Enum e `PATCH /orders/{id}/status`; UI painel com labels e fluxo. |
| **RNF-DevEx-06** migrações | Alembic versionado; sem alteração ad hoc prescrita. |
| **RNF-DevEx-08** OpenAPI | `openapi.json` no repositório; export por script. |
| **RNF-UX-01 / RNF-UX-03** mobile-first e painel simples | Layouts Tailwind, listas em cartões no painel; formulários por etapas não obrigatórios no MVP. |
| **DEC-16** refresh (parcial) | `POST /auth/refresh`; `refresh_token` no login/registo; cliente renova token; cookie httpOnly — backlog. |
| **RNF-SEC-04** rate limit (parcial) | Limite por IP em `POST /auth/login` (configurável). |
| **DEC-06** envelope (parcial) | **`/api/v2`** piloto: `GET /health`, `GET /reports/financial` com `{ success, data, errors }`; erros HTTP/422 no mesmo formato. **`/api/v1`** mantém resposta directa. |

---

## 3. Lacunas ou desvios conhecidos (transparentes)

| Referência | Situação | Recomendação |
|------------|----------|--------------|
| **RNF-QA-01** 90% serviço | Pacote `app/services` ~**94%**; gate CI **90%**. | Manter ao evoluir serviços. |
| **RNF-QA-02** fluxos críticos | Pytest cobre fluxos; Vitest cobre `painel-api.ts`. | Componentes React e mais fluxos Vitest conforme prioridade. |
| **RNF-QA-03** E2E | Smoke `/login`; login+painel opcional com env — ver [TESTES-E-CI §4](../execucao/TESTES-E-CI.md#4-e2e-playwright). | Alargar fluxos (vitrina checkout) e activar E2E autenticado no CI com secrets. |
| **RNF-QA-06** matriz RN → testes | [matriz-rn-testes.md](../normativos/matriz-rn-testes.md) existe; não está 100% preenchida para cada RN novo. | Actualizar ao fechar marcos. |
| **DEC-06 / RNF-Ops-02** envelope global | **`/api/v1`** continua sem envelope; **`/api/v2`** inicia migração (rotas piloto). | Alargar `/api/v2` ou deprecar v1 quando clientes estiverem prontos. |
| **DEC-10** FieldHelp | Ajuda contextual não está em todos os campos do painel (receitas, pedidos, etc.). | Incrementar por área conforme prioridade UX. |
| **RNF-SEC-03 / DEC-16** cookie httpOnly | Refresh entregue em JSON + `localStorage` no cliente; cookie httpOnly **não** aplicado. | Evolução de segurança quando houver mesmo domínio API+front ou proxy BFF. |
| **RNF-Ops-01** logs estruturados | MVP sem request id obrigatório em todos os caminhos. | Fase 4 / observabilidade. |
| Cobertura `app` ~3% residual | Ramos difíceis de reproduzir sem corrida ou hacks (`POST /production` `IntegrityError` concorrente; `GET /me` com utilizador inconsistente; `init_db` / `get_db` fora do `TestClient`). | Aceite como risco baixo; reavaliar se a API ganhar mais complexidade. |

---

## 4. Inventário de testes backend (referência rápida)

| Ficheiro | Foco |
|----------|------|
| `tests/test_auth.py` | Registo, login, `/me`, refresh, margem loja, isolamento duas lojas |
| `tests/test_phase2_orders.py` | Pedidos, stock, cancelamento |
| `tests/test_public_vitrine.py` | Catálogo público |
| `tests/test_phase3_production.py` | Receitas, produção idempotente, relatório financeiro |
| `tests/test_services_order_flow.py` | `is_transition_allowed_mvp`, `needs_stock_commit` (parametrizado), `apply_status_change` transição inválida |
| `tests/test_services_pricing.py` | `weighted_average_unit_cost`, `estimate_recipe_unit_cost`, rendimento zero |
| `tests/test_me_vitrine_whatsapp.py` | `GET /me` com `vitrine_whatsapp` após `stores.theme` |
| `tests/test_services_production.py` | FEFO multi-lote, receita apagada, stock insuficiente, validações `execute_production` |
| `tests/test_inventory_items_crud.py` | CRUD `/inventory-items`, delete bloqueado |
| `tests/test_smoke.py` | Smoke API |
| `tests/test_api_v2_envelope.py` | `/api/v2/health`, relatório envelope, 401 envelope |
| `tests/test_http_contracts_auth_health.py` | `/health`, registo/login/refresh — 401/422/409 |
| `tests/test_http_contracts_bearer_401.py` | Rotas protegidas sem Bearer → 401 |
| `tests/test_http_contracts_validation_bodies.py` | 422/404 em PATCH/POST/GET autenticados |
| `tests/test_http_contracts_public.py` | Vitrine pública — slug inexistente 404 |
| `tests/test_http_contracts_v2.py` | Envelope v2 — refresh e registo incompleto 422 |
| `tests/test_coverage_gaps.py` | JWT/deps, rate limit, receitas/produtos/categorias, pedidos, produção, público, auth v2, refresh, inventário |

Política de novas rotas: [criterios-testes-http-api.md](../execucao/criterios-testes-http-api.md).

---

## 5. Próximos passos sugeridos (prioridade)

1. **DEC-06:** migrar mais rotas para **`/api/v2`** (auth, CRUD críticos); documentar política de deprecação de `/api/v1`.  
2. **Relatório:** custo de vendas ligado a lotes (COGS) vs aproximação actual período-a-período.  
3. **Qualidade:** Vitest; E2E no CI com secrets; cookie httpOnly para refresh.  
4. **Roadmap:** [fase-03-gestao.md §9.2](../fases/fase-03-gestao.md#92-próximo-marco-sugerido-fora-do-fecho-mínimo-da-fase-3) e **Fase 4**.

---

## 6. Ligações

- Inventário funcional Fase 3: [fase-03-gestao.md](../fases/fase-03-gestao.md) **§10**.  
- Marcos: [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md).  
- Débitos gerais: [backlog.md](backlog.md).

---

## 7. Inventário frontend (testes)

| Tipo | Localização | Comando |
|------|-------------|---------|
| Vitest | `frontend/__tests__/**/*.test.ts` | `cd frontend && npm run test` |
| Playwright | `frontend/e2e/*.spec.ts`, `frontend/playwright.config.ts` | `cd frontend && npm run test:e2e` |

Detalhe: [TESTES-E-CI.md](../execucao/TESTES-E-CI.md) **§3–4**.
