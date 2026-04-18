# Qualidade e conformidade com a documentação normativa

**Propósito:** registar o estado da implementação face às propostas de [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md), [documento_enterprise.md](../documento_enterprise.md) e [decisoes-e-pendencias.md](decisoes-e-pendencias.md).  
**Última auditoria:** 2026-04-17 — código e ferramentas da raiz do repositório.

---

## 1. Verificações automáticas (gate local e CI)

| Verificação | Comando / resultado | Notas |
|-------------|---------------------|--------|
| Lint backend | `make lint` → **Ruff** em `app/` e `tests/` | Deve passar antes de merge. |
| Lint frontend | `npm run lint` (Next.js / ESLint) | Idem. |
| Testes backend | `pytest tests/ -q` — **25** testes | Inclui unitários de `order_flow` e `pricing`, integração existente, `GET /me` + WhatsApp. |
| Cobertura **camada de serviço** | `pytest --cov=app/services --cov-fail-under=88` | **~90%** agregado em `app/services` (**RNF-QA-01** progressivo). Gate mínimo **88%** no CI (`.github/workflows/ci.yml`). |
| Cobertura global `app` (referência) | `pytest --cov=app` | Total ~86%+ conforme restantes módulos. |
| Contrato HTTP | `make openapi-export` → [doc/api/openapi.json](../api/openapi.json) | **RNF-DevEx-08**. |
| **CI (GitHub Actions)** | Workflow `CI` em push/PR para `main` | Backend: Ruff + pytest com cobertura serviços ≥88%. Frontend: `npm ci`, lint, build. |

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
| **RNF-QA-01** 90% serviço | Pacote `app/services` ~**90%** com gate CI ≥**88%**; `production_service` ainda ~86% (ramos de erro). | Reforçar testes de produção / falhas de stock. |
| **RNF-QA-02** fluxos críticos | Cobertos em pytest; **painel Next** sem testes automatizados de UI nas últimas features. | Vitest/Testing Library para `lib/painel-api.ts` e componentes críticos; evolução. |
| **RNF-QA-03** E2E | Não há Playwright/Cypress no repositório. | Backlog / Fase 4. |
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
| `tests/test_smoke.py` | Smoke API |

---

## 5. Próximos passos sugeridos (prioridade)

1. **Qualidade:** cobertura em `production_service` (ramos de erro); testes Vitest para `painel-api.ts` no frontend; **RNF-QA-03** E2E quando estável.  
2. **Produto (backlog):** CRUD de insumos “puros”; margem configurável nas receitas; métricas extra no relatório.  
3. **Plataforma:** CI já inclui lint + pytest (serviços ≥88%) + build Next; alargar a `pytest` com cobertura global ou relatório HTML em PR se necessário.  
4. **Conformidade forte:** envelope API (**DEC-06**); refresh token (**DEC-16**); rate limit em auth.

---

## 6. Ligações

- Inventário funcional Fase 3: [fase-03-gestao.md](../fases/fase-03-gestao.md) **§10**.  
- Marcos: [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md).  
- Débitos gerais: [backlog.md](backlog.md).
