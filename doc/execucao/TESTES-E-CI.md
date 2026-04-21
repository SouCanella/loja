# Testes e integração contínua — visão única

**Propósito:** um único ponto de entrada para o que existe no repositório sobre **pytest**, **Vitest**, **Playwright**, **cobertura** e **GitHub Actions**.  
**Normas:** [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) (**RNF-QA-01** … **RNF-QA-03**, **RNF-DevEx-03/04**).  
**Detalhe normativo + lacunas:** [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md).

**Última actualização:** 2026-04-21.

**Testes HTTP / contrato da API:** política e checklist em [criterios-testes-http-api.md](criterios-testes-http-api.md).

---

## 1. Comandos na raiz do monorepo

| Comando | O quê corre |
|---------|-------------|
| `make test` | `pytest` em `backend/tests/` + `npm run test` (Vitest) em `frontend/` — **gate local recomendado** antes de commit (mesmo fluxo que o utilizador pode repetir). |
| `make dev` | Postgres (Docker) + `uvicorn --reload` + `next dev` — ver [`scripts/dev-local.sh`](../../scripts/dev-local.sh); requer `.env` com `DATABASE_URL` para `localhost:5433` (ou `POSTGRES_HOST_PORT`). |
| `make lint` | Ruff (`backend/app`, `backend/tests`) + ESLint (`frontend/`). |
| `make test-report` | Pytest com relatório HTML + cobertura `app`; frontend `test:coverage`. |
| `make seed-demo-massa` | Gera massa de dados de demonstração (~30 dias) na BD — requer API no ar; ver [seed-demo-massa.md](seed-demo-massa.md). |

A partir de **`doc/`** ou **`doc/api/`** pode usar o mesmo alvo: existe um `Makefile` que encaminha para a raiz (ex.: `make dev`, `make openapi-export`).

**Fase 3.2 (impressão + landing + analytics vitrine + UX painel):** matriz de testes e checklist de documentação no merge — [plano-implementacao-fase-3-2.md](plano-implementacao-fase-3-2.md). Contrato de impressão: `test_order_print_v2.py`; Vitest `__tests__/escpos.test.ts`, `__tests__/painel-filter-classes.test.ts` (classes Tailwind de filtros), `__tests__/painel-menu-catalog-text.test.ts`, `__tests__/painel-share-store.test.ts`; E2E smoke `e2e/smoke.spec.ts` (landing, termos, privacidade); analytics: `test_vitrine_analytics_v2.py`; demandas IP: `test_ip_demands_product.py`.

## 2. Backend (pytest)

| Item | Valor |
|------|--------|
| Pasta | `backend/tests/` |
| Config | `backend/pytest.ini` |
| Cobertura **camada de serviço** | `pytest --cov=app/services --cov-fail-under=90` — agregado ~**99%** (referência 2026-04); ver `test_services_dec12_coverage.py`. |
| Inventário por ficheiro | [qualidade-e-conformidade.md §4](../projeto/qualidade-e-conformidade.md#4-inventário-de-testes-backend-referência-rápida) |

Ficheiros de serviço dedicados: `test_services_order_flow.py`, `test_services_pricing.py`, `test_services_production.py`, `test_services_dec12_coverage.py` (lacunas DEC-12 / refresh / dashboard / stock).

**Contrato HTTP (401, 404, 422, rotas públicas, v2):** `test_http_contracts_*.py` — ver [criterios-testes-http-api.md](criterios-testes-http-api.md). **Isolamento multi-tenant (MA-01):** `test_ma01_store_isolation.py`. **Request id (DT-02):** `test_request_id_middleware.py`. **Papéis de utilizador (BE-05, enum):** `test_user_roles.py`.

**Cobertura alargada de rotas e auth:** `test_coverage_gaps.py` (JWT, refresh, rate limit, receitas, vitrine, v2). Referência global: `pytest --cov=app` ~**97%** — [qualidade-e-conformidade §1](../projeto/qualidade-e-conformidade.md#1-verificações-automáticas-gate-local-e-ci).

## 3. Frontend unitário (Vitest)

| Item | Valor |
|------|--------|
| Config | `frontend/vitest.config.ts` (alias `@/` alinhado ao Next.js); **Vitest 3.x**; **`pool: "threads"`** + **`singleThread: true`** — evita crash do `tinypool` ao encerrar o pool de *forks* em alguns ambientes (Linux/Node 20+); `npm run test` invoca só `vitest run` (opções no config). |
| Padrão de ficheiros | `frontend/__tests__/**/*.test.ts` |
| Foco actual | `painel-api.test.ts`, `customer-session.test.ts` (refresh vitrine), `painel-filter-classes.test.ts`, `painel-menu-catalog-text.test.ts`, `painel-share-store.test.ts`, `painel-pagination.test.ts` (`slicePage` / `paginationRangeLabel`, DT-03) |

Comando: `cd frontend && npm run test` (ou `npm run test:coverage`). O `make test` na raiz depende deste comando concluir com **exit 0**.

## 4. E2E (Playwright)

**Mapeamento de lacunas vs pytest/Vitest e plano por fases:** [plano-e2e-mapeamento-implementacao.md](plano-e2e-mapeamento-implementacao.md).

| Item | Valor |
|------|--------|
| Config | `frontend/playwright.config.ts` |
| Testes | `frontend/e2e/*.spec.ts` |
| Documentação de uso | [`frontend/e2e/README.md`](../../frontend/e2e/README.md) |
| Smoke | `smoke.spec.ts` — `/login` (HTML apenas). |
| Auth público | `auth-public.spec.ts` — `/login` (link registo) e `/registo` (formulário). |
| Vitrine conta | `vitrine-conta.spec.ts` — `/loja/[slug]/conta` (UI; não exige API graças a `fetchStorePublic` degradado). |
| Opcional (API + credenciais) | `login-painel.spec.ts` — preenche login e verifica `/painel`; **omitido** se `E2E_EMAIL` / `E2E_PASSWORD` não estiverem definidos. |
| Regressão painel (opcional) | `painel-regression.spec.ts` — após login, **Guardar alterações** + barra de gravação em `/painel/configuracao`; catálogo sem erros `Produtos:` / `Categorias:`. Ver também `painel-routes-smoke.spec.ts`, `painel-config-save.spec.ts`, `vitrine-loja-smoke.spec.ts`, `helpers/auth.ts`. Requer **BD migrada** (`make migrate`) e API; `E2E_STORE_SLUG` opcional para vitrine. |

### Regressão automatizada — o que é realista hoje

| Camada | Comando / artefacto | Cobre |
|--------|---------------------|--------|
| Backend + libs | `make test` (pytest + Vitest) | Contratos, handlers, helpers; **não** UI do painel nem browser. |
| E2E com API real | Playwright + `E2E_EMAIL` / `E2E_PASSWORD` | Fluxo login + páginas críticas; depende de stack alinhado a produção. |
| E2E — estilo mínimo | `e2e/helpers/cta-contrast.ts` — `getComputedStyle` no botão (fundo ≠ branco) | Regressão de **cor** sem screenshot; útil quando classes Tailwind em `lib/` deixam de ser geradas. |
| Roadmap | Screenshots pixel-diff (Playwright `toHaveScreenshot`) ou Chromatic; WCAG com axe | Contraste fino e layout; custo de manutenção maior. |
| Roadmap | Mais E2E (criar produto, guardar config) ou testes HTTP contract em staging | Aproxima «regressivo completo»; documentar matriz em [criterios-testes-http-api.md](criterios-testes-http-api.md). |

Variáveis úteis:

- **`PW_SERVER_ONLY=1`** — não volta a fazer `build`; sobe só `node .next/standalone/server.js` (usar depois de `npm run build`, ex. no CI).
- **`PW_REUSE_SERVER=1`** — não arranca `webServer`; espera servidor já a correr em `http://127.0.0.1:3000`.
- **`E2E_EMAIL`**, **`E2E_PASSWORD`** — utilizador real (ou de staging) para o teste de login no painel; a API deve estar acessível em `NEXT_PUBLIC_API_URL`.

Primeira instalação dos browsers: `cd frontend && npx playwright install chromium`.

## 5. GitHub Actions

| Ficheiro | Conteúdo |
|----------|----------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Job **`docker-images`:** `docker build` backend + frontend (valida Dockerfiles). Job **backend:** Python 3.12, Ruff, pytest com `--cov=app/services --cov-fail-under=90`. Job **frontend:** `npm ci`, ESLint, Vitest, `next build`, instalação Chromium, `npm run test:e2e` com `PW_SERVER_ONLY=1`. |

Disparo: **push** e **pull_request** para `main`.

## 6. Artefactos ignorados pelo Git

- `frontend/coverage/`, `frontend/playwright-report/`, `frontend/test-results/`
- `backend/htmlcov/`, `backend/reports/`, `.coverage`

Ver [`.gitignore`](../../.gitignore).

## 7. Ligações relacionadas

| Documento | Conteúdo |
|-----------|-----------|
| [CHANGELOG-FASES.md](CHANGELOG-FASES.md) | Marcos datados (inclui entradas sobre testes e CI). |
| [fase-03-gestao.md §10.8](../fases/fase-03-gestao.md) | Resumo qualidade no âmbito da Fase 3. |
| [README raiz](../../README.md) | Comandos `make test`, E2E, tabela de docs. |
| [criterios-testes-http-api.md](criterios-testes-http-api.md) | Política: nova rota → OpenAPI + testes de contrato HTTP. |
