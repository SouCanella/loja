# Changelog de fases

Registro opcional de marcos por data.

## 2026-04-17 (Documentação — qualidade e conformidade com normas)

- **Novo:** [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md) — checklist **RNF-***, cobertura pytest, lacunas (envelope API, E2E, FieldHelp, refresh), próximos passos.
- **Fase 3:** [fase-03-gestao.md](../fases/fase-03-gestao.md) **§10.8** com ligação a esse ficheiro.

## 2026-04-17 (Painel — pedidos: filtros, novo pedido, WhatsApp)

- **Next.js:** `/painel/pedidos` — filtro por estado (contagens); `/painel/pedidos/novo` — `POST /orders` com linhas e `Idempotency-Key`; detalhe — botão WhatsApp com texto de rascunho (`draftOrderWhatsAppMessage`).
- **API:** `GET /me` inclui **`vitrine_whatsapp`** (derivado de `stores.theme.vitrine.whatsapp`, alinhado à vitrine pública).

## 2026-04-17 (Painel — pedidos)

- **Next.js:** `/painel/pedidos`, `/painel/pedidos/[id]` — lista `GET /orders`, detalhe, itens com nomes via `GET /products`, alteração de estado `PATCH /orders/{id}/status` (confirmação ao cancelar).
- **API:** `OrderOut` inclui `created_at` para ordenação e exibição na lista.

## 2026-04-17 (Painel — receitas, produção, relatório + CSV)

- **API:** `GET /api/v1/inventory-items` (lista insumos para formulários); `GET /api/v1/me` com `store_slug` e `store_name` (link à vitrine).
- **Next.js:** `/painel` (resumo + atalho `/loja/{slug}`); `/painel/receitas` (lista, custo estimado, **Produzir lote** → `POST /production` + header `Idempotency-Key`); `/painel/receitas/nova`; `/painel/relatorio` (`GET /reports/financial` + **CSV** gerado no cliente); `frontend/lib/painel-api.ts`.
- **Documentação:** inventário completo em [fase-03-gestao.md](../fases/fase-03-gestao.md) **§10**.

## 2026-04-17 (Fase 3 — receitas, produção idempotente, relatório financeiro)

- **Migração:** `20260417_0003` — `recipes`, `recipe_items`, `production_runs`; `stock_movements.production_run_id`; tipos de movimento `production_out`, `production_in`.
- **API:** CRUD receitas (1 por produto/loja); `POST /production` com **Idempotency-Key**; `GET /reports/financial` (receita pedidos, custo produção); `ProductOut` inclui `inventory_item_id`.
- **Regras:** baixa insumos **DEC-17** (FEFO); custo unitário acabado = custo total / rendimento (**DEC-09**); estimativa de custo em `GET /recipes` via média ponderada dos lotes.
- **Testes:** `test_phase3_production.py`.

## 2026-04-17 (Encerramento documental Fase 2 → handoff Fase 3)

- **Fase 2:** inventário consolidado em [fase-02-operacao.md](../fases/fase-02-operacao.md) **§10**; estado da execução actualizado (§8); pendências não bloqueantes em §10.4 e [backlog.md](../projeto/backlog.md).
- **Roadmap:** [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) e [README.md](../README.md) — próximo marco **Fase 3** ([fase-03-gestao.md](../fases/fase-03-gestao.md)); kickoff técnico sugerido na **§9** desse ficheiro.

## 2026-04-17 (Fase 2 — vitrine Next alinhada ao mockup)

- **API pública:** `GET /api/v1/public/stores/{slug}` (nome, `theme.vitrine`: emoji, WhatsApp, redes); `GET .../categories`; `GET .../products/{product_id}`; produtos com `category_*` para filtros na vitrine.
- **Frontend:** `/loja/[slug]` — sticky bar, hero, busca, filtros por categoria, grade|lista (RF-CF-08), rail de sugestões, carrinho em `localStorage`, sheet de checkout e link **wa.me**; `/loja/[slug]/p/[id]` detalhe; tema de cores `loja-*` (mockup). Tipografia: pilha sistema + Georgia (sem `next/font` em build offline).
- **Testes:** `test_public_vitrine.py` cobre fluxo público.

## 2026-04-17 (Fase 2 — backend catálogo, pedidos, estoque)

- **Migração:** `20260417_0002` — `categories`, `products`, `inventory_items`, `inventory_batches`, `orders`, `order_items`, `order_status_history`, `order_stock_allocations`, `stock_movements`; enum pedido alinhado a **DEC-14**; `idempotency_key` único por loja em `orders`.
- **API (Bearer, tenant por token):** `GET/POST /api/v1/categories`, `DELETE /api/v1/categories/{id}`; `GET/POST /api/v1/products`, `GET /api/v1/products/{id}`; `GET/POST /api/v1/orders`, `GET /api/v1/orders/{id}`, `PATCH /api/v1/orders/{id}/status` (header opcional `Idempotency-Key` no POST pedidos).
- **Público (sem auth):** `GET /api/v1/public/stores/{store_slug}/products`.
- **Serviços:** baixa FEFO ao passar para **confirmado**; estorno ao **cancelar** após confirmado; histórico de estado.
- **Testes:** `backend/tests/test_phase2_orders.py` (fluxo confirmar/cancelar, stock insuficiente, isolamento).
- **Pendente nesta fase:** UI Next (catálogo/carrinho/pedidos); reserva+timeout e envelope API global são backlog/evolução.
- **Aderência planejado × código:** [fase-02-operacao.md](../fases/fase-02-operacao.md) secção **9**; [backlog.md](../projeto/backlog.md) (MVP-02/03/04 e índice de entregas).

## 2026-04-17 (DEC-14 / DEC-17 / DEC-20 — políticas MVP para implementação)

- **Decisões de produto:** transições de pedido **manuais e flexíveis** no MVP (sem integração WApp automática); baixa de estoque em **`confirmado`** com reversão ao **cancelar**; categorias **planas** + FK opcional — registado em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) e em [regras-negocio.md](../normativos/regras-negocio.md) (**RN-034**, **RN-058**, **RN-059**, **RN-071**, **RN-072**).
- **Fase 2:** [fase-02-operacao.md](../fases/fase-02-operacao.md) com referência cruzada aos gates.

## 2026-04-17 (documentação consolidada — Fase 1 → Fase 2)

- **OpenAPI:** [doc/api/openapi.json](../api/openapi.json) + [doc/api/index.html](../api/index.html) (ReDoc offline); `make openapi-export`; [doc/api/README.md](../api/README.md) com `python3` no servidor estático.
- **API em execução:** `/openapi.json`, `/redoc`; `/docs` (Swagger UI) desativado.
- **Docker Compose:** porta host omissa **5433** para Postgres; `backend` com `DATABASE_URL` interna para `postgres:5432` (evita `localhost` do `.env` no contentor).
- **Índice:** [doc/README.md](../README.md) — secções «Contrato HTTP», «Estado do roadmap»; [fase-01-fundacao.md](../fases/fase-01-fundacao.md) e [fase-02-operacao.md](../fases/fase-02-operacao.md) atualizados.
- **Próximo marco:** implementação [fase-02-operacao.md](../fases/fase-02-operacao.md) (produtos, estoque, pedidos; gates DEC-14, DEC-17, DEC-20).

## 2026-04-17 (Fase 1 — fundação implementada)

- **Backend:** SQLAlchemy 2 + Alembic + `postgresql+psycopg`; modelos `stores` e `users`; JWT access (HS256); `POST /api/v1/auth/register` (loja + admin), `POST /api/v1/auth/login` (OAuth2 password), `GET /api/v1/me`; `GET /api/v1/health` e `GET /health`; CORS para `localhost:3000`. Passwords com **bcrypt** (sem passlib). Dependência `get_current_user` valida `store_id` no token.
- **Migrações:** `backend/alembic/`, revisão `20260417_0001`; `make migrate` → `alembic upgrade head` (requer Postgres acessível e `DATABASE_URL`).
- **Infra:** `docker-compose.yml` com `DATABASE_URL` sync + `JWT_SECRET`; `backend/Dockerfile` inclui Alembic; [.env.example](../../.env.example) com `JWT_SECRET` e URL sync.
- **Testes:** pytest smoke + auth + isolamento dois tenants (SQLite em memória com override de sessão).
- **Frontend:** rotas `/loja/[slug]`, `/login` (grava token), `/painel` (lê `/api/v1/me`); `NEXT_PUBLIC_API_URL`.
- **Documentação:** [fase-01-fundacao.md](../fases/fase-01-fundacao.md) secção Execução.

## 2026-04-17 (Fase 0 — implementação concluída)

- **Código:** monorepo na raiz com `backend/` (FastAPI, pytest, Ruff, Dockerfile), `frontend/` (Next.js 14, Tailwind, Vitest, Dockerfile standalone), `docker-compose.yml` (Postgres 16-alpine + API + frontend), `Makefile` (`up`, `down`, `test`, `test-report`, `migrate`, `lint`, `backend-venv`), [.env.example](../../.env.example), [.gitignore](../../.gitignore).
- **Testes:** smoke pytest (`GET /health`) e Vitest; `make test` e `make lint` validados; `docker compose build` validado.
- **Documentação:** [fase-00-kickoff.md](../fases/fase-00-kickoff.md) Parte C (entregues, pendências P1–P5); [README.md](../README.md) na raiz do repo para desenvolvedores.
- **Pendências não bloqueantes:** ver tabela em fase-00 Parte C (audit npm, Vitest CJS, Alembic na Fase 1, SQLAlchemy, CI).

## 2026-04-17 (avaliações e layout vitrine)

- **Produto:** avaliações por produto **desativadas no padrão inicial**, ativação e **moderação** (aprovar/rejeitar) pelo admin; **layout** catálogo grade vs **lista em linhas** — [requisitos-funcionais.md](../normativos/requisitos-funcionais.md) RF-CF-07/08, RF-CA-09/10, RF-AV; [regras-negocio.md](../normativos/regras-negocio.md) RN-025–027, RN-033; [documento_enterprise.md](../documento_enterprise.md) §6–§8; RNF-SEC-09, RNF-UX-05.

## 2026-04-17 (estrutura `doc/`)

- **Reorganização:** pastas **[normativos/](../normativos/)** (regras de negócio, RF, RNF, matriz RN→testes) e **[projeto/](../projeto/)** (decisões DEC, backlog, rastreabilidade, proposta legada); `documento_enterprise.md` e `README.md` permanecem na raiz de `doc/`. Links internos e [proposta.md](../../proposta.md) atualizados.
- **Referência:** primeira linha de [inicio_planejamento.txt](../../inicio_planejamento.txt) alinhada à nova árvore.

## 2026-04-17 (continuação)

- **Melhorias não bloqueantes incorporadas:** ADR leve com **parágrafo (contexto + consequência) por DEC-01 … DEC-20** em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md); tabela «Melhorias sugeridas» substituída por «incorporadas» com referências cruzadas.
- **OpenAPI / Fase 1:** [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) **RNF-DevEx-08**; [fase-01-fundacao.md](../fases/fase-01-fundacao.md) (gates, escopo backend, critérios de aceite).
- **PostgreSQL:** pin de imagem no §20 do [documento_enterprise.md](../documento_enterprise.md); critério na Fase 1.
- **Idempotência:** [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) **RNF-Arq-02a** / **RNF-Arq-02b**; [fase-03-gestao.md](../fases/fase-03-gestao.md) (produção).
- **Matriz RN → teste:** [matriz-rn-testes.md](../normativos/matriz-rn-testes.md); **RNF-QA-06**; §21 enterprise e [README.md](../README.md).
- **Roadmap:** [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) — linhas Fase 1 / Fase 3 alinhadas a OpenAPI, pin Postgres e idempotência de produção.

## 2026-04-18 (tarde)

- **Fechamento DOC-P01–P07:** convertidos em **DEC-14 … DEC-20**; corrigido **DEC-09** (média ponderada vs FEFO em DEC-17); [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) com gates por fase e histórico de pendências.
- **Propagação:** [regras-negocio.md](../normativos/regras-negocio.md) (máquina de estados, RN atualizados), [documento_enterprise.md](../documento_enterprise.md) §8/§9, [requisitos-funcionais.md](../normativos/requisitos-funcionais.md), [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md), [rastreabilidade-fontes.md](../projeto/rastreabilidade-fontes.md).
- **Fases:** [fase-00-kickoff.md](../fases/fase-00-kickoff.md) a [fase-04-escala.md](../fases/fase-04-escala.md) com bloco «Documentação normativa» + gates; [README.md](../README.md) checklist pré-desenvolvimento; [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) nota DEC-14–20.

## 2026-04-18

- **Requisitos a partir de `inicio_planejamento.txt`:** criados [regras-negocio.md](../normativos/regras-negocio.md), [requisitos-funcionais.md](../normativos/requisitos-funcionais.md), [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md), [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md), [rastreabilidade-fontes.md](../projeto/rastreabilidade-fontes.md); [README.md](../README.md) e [documento_enterprise.md](../documento_enterprise.md) atualizados; [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) com equivalência MVP txt vs Fases 0–4; [backlog.md](../projeto/backlog.md) com ideias IP-*; [fase-02](../fases/fase-02-operacao.md)/[fase-03](../fases/fase-03-gestao.md) com referências a RN e DOC-P01/P04; primeira linha de [inicio_planejamento.txt](../../inicio_planejamento.txt) aponta para `doc/`.

## 2026-04-17

- **Documentação:** [documento_enterprise.md](../documento_enterprise.md) consolidado com a Proposta V4 (stack, pedidos/concorrência/idempotência, RBAC, API, FieldHelp, backlog §23, etc.); [proposta.md](../../proposta.md) na raiz virou atalho canônico; [proposta_plataforma_loja.md](../projeto/proposta_plataforma_loja.md) marcado como substituído; [README.md](../README.md), [backlog.md](../projeto/backlog.md), [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) e fases 0–4 atualizados para novas referências de seção (§3–§25).

## 2026-04-16

- **Planejamento roadmap:** criados [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) e planejamentos completos das Fases 1 a 4 (`fase-01` … `fase-04`); [fase-00-kickoff.md](../fases/fase-00-kickoff.md) atualizado (Parte A planejamento / Parte B execução).
- **Fase 0 (implementação):** ~~pendente~~ **concluída** em 2026-04-17 — ver entrada acima e [fase-00-kickoff.md](../fases/fase-00-kickoff.md) Parte C.
