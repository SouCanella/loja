# Loja — monorepo

SaaS multi-tenant para gestão de lojas caseiras. Documentação canónica em [`doc/documento_enterprise.md`](doc/documento_enterprise.md).

## Requisitos

- Docker e Docker Compose v2
- Node.js 20+ e npm (testes e lint do frontend localmente)
- Python 3.12+ (testes e lint do backend localmente)

## Primeiros passos

```bash
cp .env.example .env
make test             # cria backend/.venv se necessário (PEP 668); pytest + vitest
make up             # Postgres + API (porta 8000) + frontend (porta 3000)
make migrate        # aplica Alembic no Postgres (com serviços no ar; DATABASE_URL em .env)
make openapi-export # regenera doc/api/openapi.json (contrato OpenAPI offline)
```

Requer **Node.js 20+** e **Python 3.12+** para comandos locais fora do Docker. O alvo `make backend-venv` (ou qualquer alvo que dependa dele) instala dependências Python em `backend/.venv`.

- API: `GET http://localhost:8000/health` (compat. Fase 0), `GET http://localhost:8000/api/v1/health`
- Auth (Fase 1): `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/me` (Bearer)
- Operação (Fase 2 — backend): categorias e produtos `GET/POST /api/v1/categories`, `DELETE /api/v1/categories/{id}`, `GET/POST /api/v1/products`, `GET /api/v1/products/{id}`; pedidos `GET/POST /api/v1/orders`, `GET /api/v1/orders/{id}`, `PATCH /api/v1/orders/{id}/status` (`Idempotency-Key` opcional no POST); vitrine pública `GET /api/v1/public/stores/{store_slug}`, `GET .../categories`, `GET .../products`, `GET .../products/{product_id}`
- Gestão (Fase 3): receitas, produção e relatório como acima; **`GET /api/v1/inventory-items`** (insumos para o painel); **`GET /api/v1/me`** inclui `store_slug`, `store_name` e **`vitrine_whatsapp`** (de `stores.theme.vitrine.whatsapp`, para atalho WhatsApp no detalhe do pedido)
- Frontend: `http://localhost:3000` — `/loja/[slug]` vitrine; `/painel` (resumo, link vitrine), `/painel/pedidos` (lista com **filtro por estado**, `/painel/pedidos/novo` **POST /orders** com `Idempotency-Key`, detalhe com estado + **WhatsApp** com rascunho do pedido se o telefone estiver configurado), `/painel/receitas`, `/painel/receitas/nova`, `/painel/relatorio`; `/login`. **WhatsApp (vitrine):** em `stores.theme` use `{"vitrine": {"whatsapp": "+5511…"}}` (ou ajuste via SQL) — o painel lê o mesmo campo via `/me`.
- OpenAPI: esquema em [`doc/api/openapi.json`](doc/api/openapi.json) (offline; regenerar com `make openapi-export`); com API no ar: `http://localhost:8000/openapi.json` e UI ReDoc em `http://localhost:8000/redoc`

Variáveis: ver [`.env.example`](.env.example) (`DATABASE_URL` com `postgresql+psycopg`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`).

**Postgres no host:** por omissão o Compose publica a porta **5433** no teu PC (`POSTGRES_HOST_PORT`, evita conflito com Postgres local na 5432). Para **Alembic ou API no host**, usa `DATABASE_URL` com `localhost:5433` (como em [`.env.example`](.env.example)). O contentor **backend** usa sempre `postgres:5432` na rede interna, independentemente do `DATABASE_URL` do `.env`.

Mais detalhes: [`doc/README.md`](doc/README.md), [`doc/fases/fase-01-fundacao.md`](doc/fases/fase-01-fundacao.md) e [`doc/fases/fase-00-kickoff.md`](doc/fases/fase-00-kickoff.md).

## Documentação

| O quê | Onde |
|-------|------|
| Índice geral de `doc/` | [`doc/README.md`](doc/README.md) |
| Visão de produto e arquitetura | [`doc/documento_enterprise.md`](doc/documento_enterprise.md) |
| Roadmap Fases 0–4 | [`doc/fases/PLANO-ROADMAP-FASES.md`](doc/fases/PLANO-ROADMAP-FASES.md) |
| Fase 1 (fechada) | [`doc/fases/fase-01-fundacao.md`](doc/fases/fase-01-fundacao.md) |
| Fase 2 (fechada — inventário §10) | [`doc/fases/fase-02-operacao.md`](doc/fases/fase-02-operacao.md) |
| **Fase 3 (concluída — receitas, produção, relatório + painel)** | [`doc/fases/fase-03-gestao.md`](doc/fases/fase-03-gestao.md) **§10** (inventário) |
| OpenAPI offline + ReDoc | [`doc/api/README.md`](doc/api/README.md) |
| Marcos datados | [`doc/execucao/CHANGELOG-FASES.md`](doc/execucao/CHANGELOG-FASES.md) |
| Qualidade vs normas (RNF, testes) | [`doc/projeto/qualidade-e-conformidade.md`](doc/projeto/qualidade-e-conformidade.md) |

Comandos `make`: ver saída de `make help` (inclui `openapi-export`, `migrate`, `lint`, etc.). **Testes:** `make test` (pytest + Vitest). **E2E:** `npx playwright install chromium` uma vez; no `frontend/`, `npm run test:e2e` (sobe `next dev`) ou após `npm run build` usar `CI=true PW_SERVER_ONLY=1 npm run test:e2e` — detalhes em [`frontend/e2e/README.md`](frontend/e2e/README.md).

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `backend/` | FastAPI, Alembic, testes pytest, `scripts/export_openapi.py` |
| `frontend/` | Next.js 14 (App Router), Tailwind, Vitest |
| `doc/` | Normativos, fases, mockups, **api/** (OpenAPI) |
| `.github/workflows/` | **CI** (Ruff + pytest com cobertura `app/services` ≥88% + frontend lint/build) |

## Convenções de branch

- `main` — estável
- `feature/<nome>` — funcionalidades
- `fix/<nome>` — correções
