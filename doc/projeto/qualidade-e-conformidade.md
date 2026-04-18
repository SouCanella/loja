# Qualidade e conformidade com a documentação normativa

**Propósito:** registar o estado da implementação face às propostas de [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md), [documento_enterprise.md](../documento_enterprise.md) e [decisoes-e-pendencias.md](decisoes-e-pendencias.md).  
**Última auditoria:** 2026-04-17 — código e ferramentas da raiz do repositório.

---

## 1. Verificações automáticas (gate local e CI)

| Verificação | Comando / resultado | Notas |
|-------------|---------------------|--------|
| Lint backend | `make lint` → **Ruff** em `app/` e `tests/` | Deve passar antes de merge. |
| Lint frontend | `npm run lint` (Next.js / ESLint) | Idem. |
| Testes backend | `pytest tests/ -q` — **32+** testes | Inclui `test_services_production.py` (erros de stock / `execute_production`), `order_flow`, `pricing`, integração, `GET /me` + WhatsApp. |
| Cobertura **camada de serviço** | `pytest --cov=app/services --cov-fail-under=90` | **~94%** agregado em `app/services` (**RNF-QA-01**). Gate **90%** no CI. |
| Testes frontend | `npm run test` (Vitest) | `__tests__/painel-api.test.ts` — helpers e `apiPainelJson` com `fetch` / `localStorage` mock. |
| E2E | `npm run test:e2e` (Playwright) | Smoke `/login`; ver `frontend/e2e/README.md` (**RNF-QA-03**). CI: `build` + servidor standalone + E2E. |
| Cobertura global `app` (referência) | `pytest --cov=app` | Total ~86%+ conforme restantes módulos. |
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

---

## 3. Lacunas ou desvios conhecidos (transparentes)

| Referência | Situação | Recomendação |
|------------|----------|--------------|
| **RNF-QA-01** 90% serviço | Pacote `app/services` ~**94%**; gate CI **90%**. | Manter ao evoluir serviços. |
| **RNF-QA-02** fluxos críticos | Pytest cobre fluxos; Vitest cobre `painel-api.ts`. | Componentes React e mais fluxos Vitest conforme prioridade. |
| **RNF-QA-03** E2E | Playwright + smoke `/login` (`frontend/e2e/`). | Alargar fluxos (login real, vitrine) com API de teste ou mocks. |
| **RNF-QA-06** matriz RN → testes | [matriz-rn-testes.md](../normativos/matriz-rn-testes.md) existe; não está 100% preenchida para cada RN novo. | Actualizar ao fechar marcos. |
| **DEC-06 / RNF-Ops-02** envelope `{ success, data, errors }` | API FastAPI devolve JSON **directo** dos schemas (sem envelope unificado). | Desvio documentado; alinhar numa versão futura da API ou aceitar como MVP pragmático. |
| **DEC-10** FieldHelp | Ajuda contextual não está em todos os campos do painel (receitas, pedidos, etc.). | Incrementar por área conforme prioridade UX. |
| **RNF-SEC-03 / DEC-16** refresh | Access JWT; refresh token **não** implementado na API actual. | Backlog. |
| **RNF-SEC-04** rate limiting | Não aplicado no login. | Backlog hardening. |
| **RNF-Ops-01** logs estruturados | MVP sem request id obrigatório em todos os caminhos. | Fase 4 / observabilidade. |

---

## 4. Inventário de testes backend (referência rápida)

| Ficheiro | Foco |
|----------|------|
| `tests/test_auth.py` | Registo, login, `/me`, isolamento duas lojas |
| `tests/test_phase2_orders.py` | Pedidos, stock, cancelamento |
| `tests/test_public_vitrine.py` | Catálogo público |
| `tests/test_phase3_production.py` | Receitas, produção idempotente, relatório financeiro |
| `tests/test_services_order_flow.py` | `is_transition_allowed_mvp`, `needs_stock_commit` (parametrizado) |
| `tests/test_services_pricing.py` | `weighted_average_unit_cost`, `estimate_recipe_unit_cost` |
| `tests/test_me_vitrine_whatsapp.py` | `GET /me` com `vitrine_whatsapp` após `stores.theme` |
| `tests/test_services_production.py` | `consume_ingredient_fefo`, `execute_production` — stock insuficiente, loja errada, receita vazia, rendimento 0, insumo = acabado, produto inválido |
| `tests/test_smoke.py` | Smoke API |

---

## 5. Próximos passos sugeridos (prioridade)

1. **Qualidade:** ramos restantes em `production_service` (linhas 48/88 — loop / receita apagada); mais testes Vitest em componentes; E2E com fluxo autenticado (API de teste).  
2. **Produto (backlog):** CRUD de insumos “puros”; margem configurável nas receitas; métricas extra no relatório.  
3. **Plataforma:** CI com Ruff, pytest (serviços ≥90%), Vitest, build, Playwright; relatório HTML de cobertura em PR opcional.  
4. **Conformidade forte:** envelope API (**DEC-06**); refresh token (**DEC-16**); rate limit em auth.

---

## 6. Ligações

- Inventário funcional Fase 3: [fase-03-gestao.md](../fases/fase-03-gestao.md) **§10**.  
- Marcos: [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md).  
- Débitos gerais: [backlog.md](backlog.md).
