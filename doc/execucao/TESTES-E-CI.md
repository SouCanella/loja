# Testes e integração contínua — visão única

**Propósito:** um único ponto de entrada para o que existe no repositório sobre **pytest**, **Vitest**, **Playwright**, **cobertura** e **GitHub Actions**.  
**Normas:** [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) (**RNF-QA-01** … **RNF-QA-03**, **RNF-DevEx-03/04**).  
**Detalhe normativo + lacunas:** [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md).

**Última actualização:** 2026-04-18.

---

## 1. Comandos na raiz do monorepo

| Comando | O quê corre |
|---------|-------------|
| `make test` | `pytest` em `backend/tests/` + `npm run test` (Vitest) em `frontend/`. |
| `make lint` | Ruff (`backend/app`, `backend/tests`) + ESLint (`frontend/`). |
| `make test-report` | Pytest com relatório HTML + cobertura `app`; frontend `test:coverage`. |

## 2. Backend (pytest)

| Item | Valor |
|------|--------|
| Pasta | `backend/tests/` |
| Config | `backend/pytest.ini` |
| Cobertura **camada de serviço** | `pytest --cov=app/services --cov-fail-under=90` — agregado ~**94%** (referência 2026-04). |
| Inventário por ficheiro | [qualidade-e-conformidade.md §4](../projeto/qualidade-e-conformidade.md#4-inventário-de-testes-backend-referência-rápida) |

Ficheiros de serviço dedicados: `test_services_order_flow.py`, `test_services_pricing.py`, `test_services_production.py`.

## 3. Frontend unitário (Vitest)

| Item | Valor |
|------|--------|
| Config | `frontend/vitest.config.ts` (alias `@/` alinhado ao Next.js) |
| Padrão de ficheiros | `frontend/__tests__/**/*.test.ts` |
| Foco actual | `__tests__/painel-api.test.ts` — helpers e `apiPainelJson` |

Comando: `cd frontend && npm run test` (ou `npm run test:coverage`).

## 4. E2E (Playwright)

| Item | Valor |
|------|--------|
| Config | `frontend/playwright.config.ts` |
| Testes | `frontend/e2e/*.spec.ts` |
| Documentação de uso | [`frontend/e2e/README.md`](../../frontend/e2e/README.md) |
| Smoke actual | Página `/login` (sem dependência da API em execução para o HTML) |

Variáveis úteis:

- **`PW_SERVER_ONLY=1`** — não volta a fazer `build`; sobe só `node .next/standalone/server.js` (usar depois de `npm run build`, ex. no CI).
- **`PW_REUSE_SERVER=1`** — não arranca `webServer`; espera servidor já a correr em `http://127.0.0.1:3000`.

Primeira instalação dos browsers: `cd frontend && npx playwright install chromium`.

## 5. GitHub Actions

| Ficheiro | Conteúdo |
|----------|----------|
| [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) | Job **backend:** Python 3.12, Ruff, pytest com `--cov=app/services --cov-fail-under=90`. Job **frontend:** `npm ci`, ESLint, Vitest, `next build`, instalação Chromium, `npm run test:e2e` com `PW_SERVER_ONLY=1`. |

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
