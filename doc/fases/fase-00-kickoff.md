# Fase 0 — Kickoff

**Referência:** [documento_enterprise.md](../documento_enterprise.md)  
**Roadmap mestre:** [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) (fases 0 a 4)

## Documentação normativa (leitura para esta fase)

- [regras-negocio.md](../normativos/regras-negocio.md)
- [requisitos-funcionais.md](../normativos/requisitos-funcionais.md)
- [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md)
- [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) — gates por fase

### Gates antes de implementar esta fase

- Repositório e `doc/` coerentes com o planejamento; convenções de branch e qualidade (testes/relatórios HTML) definidas.
- Não é necessário ter implementado autenticação completa nem pedidos (isso é Fase 1+).

---

## Parte A — Planejamento (referência fixa)

Use esta seção como **contrato** do que a Fase 0 deve entregar em termos de processo e base técnica. Se algo mudar, atualize aqui e o [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md).

### Objetivo

Formalizar o início do projeto: estrutura de documentação em `doc/`, decisões de repositório, convenções mínimas e contrato de qualidade (testes com relatórios HTML), **sem** exigir todas as features de negócio do MVP.

### Não-objetivos (Fase 0)

- Implementar catálogo completo, pedidos, receitas ou relatórios financeiros.
- Atingir 90% de cobertura global (meta progressiva conforme [documento_enterprise.md](../documento_enterprise.md) §21).
- CI/CD completo (previsto para evolução na Fase 4 / §24).

### Decisão de repositório

**Monorepo** na raiz do projeto:

- `frontend/` — Next.js (App Router), TypeScript, Tailwind, React Query (conforme evolução).
- `backend/` — FastAPI, SQLAlchemy 2.x, Alembic, Pydantic.
- `doc/` — documentação e registro por fase.
- Orquestração local: Docker Compose + Makefile.

### Convenções

- **Branches:** `main` estável; features em `feature/<nome-curto>`; correções em `fix/<nome-curto>`.
- **Ambiente:** copiar `.env.example` para `.env` na raiz (e ajustar por serviço se necessário). Nunca commitar segredos.
- **Multi-tenant:** toda consulta a dados de negócio deve incluir filtro por `store_id` (middleware obrigatório nas rotas autenticadas — evolução na Fase 1).

### Planejamento das demais fases

Os documentos abaixo descrevem **todo o roadmap** (entregáveis, critérios de aceite, riscos). Podem ser revisados a qualquer momento; mantenha o roadmap mestre alinhado.

| Fase | Documento |
|------|-----------|
| 1 — Fundação | [fase-01-fundacao.md](fase-01-fundacao.md) |
| 2 — Operação | [fase-02-operacao.md](fase-02-operacao.md) |
| 3 — Gestão | [fase-03-gestao.md](fase-03-gestao.md) |
| 4 — Escala | [fase-04-escala.md](fase-04-escala.md) |

### Definição de pronto (Fase 0 — execução)

- [x] `doc/README.md`, [projeto/backlog.md](../projeto/backlog.md) e este arquivo coerentes com o repositório.
- [x] Esqueleto `frontend/` e `backend/` com serviços subindo via Docker Compose.
- [x] Makefile na raiz com `up`, `down`, `test`, `migrate`, `lint` (migrate/lint podem ser mínimos até Alembic/ESLint plenos).
- [x] Pelo menos um teste smoke por camada (backend e frontend).
- [x] Relatórios HTML de teste documentados em [doc/README.md](../README.md) e geráveis via `make test-report`.

### Relatórios HTML

Política: artefatos em `backend/htmlcov/`, `backend/reports/`, `frontend/coverage/`, `frontend/playwright-report/` ficam fora do Git; reprodução descrita em [doc/README.md](../README.md).

### Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Monorepo aumenta tempo de CI | Pipeline única na Fase 4; localmente `make test` por pasta |
| 90% de cobertura cedo demais | Exigir aumento gradual; documentar percentual atual nas fases |
| E2E frágil no início | Playwright opcional; priorizar API + unit no MVP |

---

## Parte B — Estado da execução

| Campo | Valor |
|-------|--------|
| **Planejamento (docs fases 0–4)** | Concluído — ver [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) |
| **Status da implementação da Fase 0** | **concluída** (código-base e checklist Parte A satisfeitos) |
| **Data última atualização** | 2026-04-17 |

**Próximo passo:** executar [fase-01-fundacao.md](fase-01-fundacao.md) (JWT, middleware de tenant, Alembic, rotas `/loja/[slug]`, OpenAPI operacional).

---

## Parte C — Relatório da implementação (2026-04-17)

### Entregue

| Item | Detalhe |
|------|---------|
| Monorepo na raiz | [README.md](../../README.md) com comandos, estrutura e convenções de branch |
| `backend/` | FastAPI, `GET /health`, pytest smoke (`tests/test_smoke.py`), Ruff, `Dockerfile`, dependências em `requirements.txt` |
| `frontend/` | Next.js 14 (App Router), Tailwind, página inicial mínima, Vitest smoke (`__tests__/smoke.test.ts`), ESLint, `Dockerfile` (output `standalone`) |
| Orquestração | [docker-compose.yml](../../docker-compose.yml): `postgres:16-alpine`, `backend`, `frontend`; volume nomeado para dados PG |
| Makefile | `up`, `down`, `test`, `test-report`, `migrate` (no-op documentado), `lint`, `backend-venv` (cria `backend/.venv` se necessário — PEP 668) |
| Qualidade | `make test` validado (pytest + vitest); `docker compose build` validado |
| Git | [.gitignore](../../.gitignore) (artefatos de cobertura, `.env`, `node_modules`, `.venv`, etc.) |
| Ambiente | [.env.example](../../.env.example) |

### Pendências (não bloqueiam Fase 1)

| # | Pendência | Nota |
|---|-----------|------|
| P1 | **Next.js / npm audit** | `npm audit` reporta vulnerabilidades transitórias; acompanhar releases Next 14.x/15.x e [avisos de segurança](https://nextjs.org/blog). Atualizar dependências num sprint dedicado. **Backlog:** **MA-08** em [backlog.md](../projeto/backlog.md). |
| P2 | **Vitest (CJS)** | Aviso de depreciação da API CJS do Vite; migrar config para ESM quando conveniente. **Backlog:** **MA-09** em [backlog.md](../projeto/backlog.md). |
| P3 | **Alembic** | `make migrate` é intencionalmente no-op; migrações na Fase 1. |
| P4 | **Ligação backend ↔ Postgres** | Compose define `DATABASE_URL`; a API ainda não usa SQLAlchemy (Fase 1). |
| P5 | **CI/CD** | Fora do âmbito da Fase 0; previsto evolução [documento_enterprise.md](../documento_enterprise.md) §24 / Fase 4. |

Outras sugestões de revisão (API versionada, testes de isolamento tenant, RLS, route groups Next, etc.) estão mapeadas como **MA-01 … MA-09** em [projeto/backlog.md](../projeto/backlog.md).

### Como reproduzir localmente

```bash
cp .env.example .env
make test              # cria backend/.venv à primeira execução e corre testes
make up                # sobe Postgres + API :8000 + frontend :3000
# Opcional: make test-report  # cobertura HTML em backend/htmlcov e frontend/coverage
```
