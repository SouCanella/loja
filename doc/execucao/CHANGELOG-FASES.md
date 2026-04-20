# Changelog de fases

Registro opcional de marcos por data.

## 2026-04-20 (Documentação — relatórios e analytics ampliados)

- **Novo:** [relatorios-analytics-roadmap.md](../projeto/relatorios-analytics-roadmap.md) — vitrine (visitas, vistas, carrinho, geo) vs operação (hora, património, categorias); o que já é derivável do modelo e o que exige eventos ou novos campos (pagamento, cupons, descontos).

## 2026-04-20 (Planeamento — Fase 3.2 impressão de pedidos)

- **Novo:** [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) — marco **3.2** (térmica Bluetooth/USB 58/80 mm, desligado; comprovativos e etiquetas **A4/A6**); sub-fases 3.2-a (PDF/HTML), 3.2-b (USB), 3.2-c (BT); **DEC-21** em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md).
- **Roadmap:** [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) — fluxo 3.1 → **3.2** → 4.

## 2026-04-22 (Fase 3.1 — fecho: perfil, produção API, gráficos precificação/relatório)

- **API v2:** `PATCH /api/v2/me/password` (alterar palavra-passe do lojista); `GET /api/v2/production-runs` (lista corridas de produção com `date_from` / `date_to` / `limit`). Testes em `test_me_password_v2.py`, `test_production_runs_list_v2.py`.
- **Painel:** página **`/painel/conta`** (Perfil e segurança); menu **Conta** no `PainelShell`; **Precificação** — gráfico donut composição custo/margem (`PricingCompositionChart`); **Relatórios** — dispersão **margem × volume** por produto (`MarginVolumeScatter`); **Produção** — tabela de corridas com filtro de datas.
- **Documentação:** [fase-03-1-paridade-mockup.md](../fases/fase-03-1-paridade-mockup.md) (critérios §7, status concluída); `doc/api/openapi.json` regenerado.

## 2026-04-22 (Painel — redes sociais na configuração, filtro em Clientes, dicas e menu)

- **Configuração da loja:** em **`/painel/configuracao`**, secção **Redes sociais (vitrine)** — lista `label` / `url` / `icon` (preset Instagram, Facebook, etc.), persistida em `stores.theme.vitrine.social_networks` (alinhado ao hero `catalog-hero.tsx` e à API pública).
- **Clientes:** filtro por **nome ou telefone** na lista agregada por contacto (`/painel/clientes`).
- **FieldTip:** tooltip de ajuda com **borda roxa**, **barra amarela** e **fundo branco opaco** (legibilidade).
- **Menu lateral:** fundo em gradiente roxo mais próximo do CTA (`PainelShell` + tokens `painel-sidebar-bg` / `painel-sidebar-border` em `tailwind.config.ts`).
- **Relatórios:** botão «Atualizar» com estilo **CTA** (`painel-cta`), coerente com o resto do painel.
- **Documentação:** [vitrine-configuracao-aparencia.md](../projeto/vitrine-configuracao-aparencia.md), [identidade-visual-e-paletas.md](../projeto/identidade-visual-e-paletas.md).

## 2026-04-20 (Refactor vitrine + DRY pedidos + Vitest estável)

- **Backend:** `app/services/order_line_items.py` — `get_product_for_order_line(..., reject_catalog_unavailable)` partilhado entre `handlers/orders.py` (painel) e `services/public_vitrine_order.py` (vitrine bloqueia produto `unavailable` no catálogo).
- **Frontend vitrine:** `CatalogView.tsx` decomposto em `components/vitrine/catalog-*.tsx`, `whatsapp-order-preview-modal.tsx`; lógica de checkout em `hooks/use-vitrine-checkout.ts`; constantes de fallback em `lib/vitrine/catalog-defaults.ts`; `lib/vitrine/vitrine-customer-fetch.ts` (Bearer + refresh em 401); página `/loja/[slug]/conta` com `hooks/use-vitrine-customer-me.ts`.
- **Vitest:** pool `threads` + `singleThread` em `vitest.config.ts`; `package.json` `test` sem flags redundantes — `make test` conclui com exit 0 de forma fiável.
- **Documentação:** `TESTES-E-CI.md`, esta entrada; `paridade-mockup-vitrine.md`; `ip-11-pedidos-vitrine-painel.md` (estrutura de código).

## 2026-04-21 (Vitrine — tema configurável, fundo, logótipo, cache SSR, backlog IP-11)

- **Produto:** o lojista configura em **`/painel/configuracao`** a aparência da loja pública: cores principal/destaque, **URL do logótipo** (`logo_image_url`), **URL da imagem de fundo** (`hero_image_url`), **suavização do fundo** (`background_overlay_percent`, 15–97). Secção do painel renomeada/contextualizada («Aparência da vitrine»).
- **API pública:** `StorePublicOut` expõe `primary_color`, `accent_color`, `hero_image_url`, `logo_image_url`, `background_overlay_percent` (validação https e limites no handler `public_get_store`).
- **Frontend vitrine:** Tailwind com variáveis CSS (`--loja-*-rgb`); `getStorePublicCached` + **`cache: "no-store"`** nos `fetch` públicos para refletir alterações ao recarregar; layout com camadas de fundo + véu dinâmico; hero com imagem de logótipo ou emoji; uso consistente de `loja-primary` / `loja-accent` na UI.
- **Documentação:** [vitrine-configuracao-aparencia.md](../projeto/vitrine-configuracao-aparencia.md); actualizações em [paridade-mockup-vitrine.md](../projeto/paridade-mockup-vitrine.md), [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md).
- **Backlog:** [IP-11](../projeto/backlog.md) — pedidos iniciados só pelo WhatsApp ainda **não** criam `Order` no sistema; referência cruzada em **MVP-03**.

## 2026-04-19 (Fase 3.1 — dashboard API, sidebar, Recharts, imagens produto)

- **Backend:** migração `20260417_0005` — `products.image_url`; `GET /api/v2/dashboard/summary`; `PATCH /api/v2/products/{id}`; `PATCH /api/v2/me/store-settings` (merge `theme.vitrine` e `config.general`); `ProductPublicOut.image_url`.
- **Frontend:** `recharts`; `PainelShell` (menu lateral); `/painel` = dashboard com KPIs + gráficos; `/painel/financeiro`, `/painel/configuracao`, `/painel/catalogo`, `/painel/precificacao`, `/painel/clientes`, `/painel/producao`, `/painel/categorias`; gráficos no relatório; vitrine usa `image_url` quando definido; `/painel/definicoes` → `/painel/configuracao`.
- **Testes:** `tests/test_dashboard_v2.py` (dashboard, patch produto, settings, slug).
- **Contrato:** `make openapi-export`.

## 2026-04-17 (Planeamento — Fase 3.1 paridade mockup)

- **Novo:** [fase-03-1-paridade-mockup.md](../fases/fase-03-1-paridade-mockup.md) — mapa mockup admin (e vitrine) ↔ código ↔ RF; prioridade **gráficos** (dashboard, financeiro, relatórios, precificação); **DEC-15** fora do âmbito; [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) actualizado (fluxo F3 → **3.1** → F4).

## 2026-04-17 (Vitrine — largura, mobile e barra fixa do carrinho)

- **Next.js (vitrine pública):** contentor **`max-w-screen-2xl`** (alinhado ao painel); grelha com colunas responsivas; **ProductCard** em modo grelha: **`flex-col` até `xl`**, depois **`xl:flex-row`** — preço + «/ un» e controlos ± deixam de partir em ecrãs estreitos; bloco do cardápio com padding inferior ajustado.
- **Secção Redes e contato** (`#sobre`): **`pb-32 sm:pb-36`** para não ficar tapada pela barra fixa **Total / Ver carrinho** (DEC-11 mobile-first).
- **Carrinho (sheet lateral):** **`max-w-xl sm:max-w-2xl`** em vez de largura total do ecrã.
- **Tailwind:** removido token custom `maxWidth.vitrine` em `frontend/tailwind.config.ts`; uso de **`max-w-screen-2xl`** nas páginas/componentes.
- **Ficheiros:** `CatalogView.tsx`, `ProductDetail.tsx`, `app/loja/[slug]/p/[productId]/page.tsx`, `app/painel/layout.tsx`, `app/login/page.tsx`.
- **Git:** commit `fix(front): vitrine mais larga, cards mobile e barra do carrinho`.

## 2026-04-17 (Script `seed_demo_mass` — massa 30 dias para QA manual)

- **`backend/scripts/seed_demo_mass.py`** + **`make seed-demo-massa`**: loja demo, ~187 pedidos, ~38 produções, datas repartidas em 30 dias; doc [seed-demo-massa.md](seed-demo-massa.md).

## 2026-04-17 (Frontend em `/api/v2` + relatório financeiro alargado)

- **Next.js (painel, login, vitrine SSR):** chamadas passam a **`/api/v2/...`** com envelope DEC-06; `frontend/lib/api-v2.ts` (`unwrapV2Success`, `messageFromV2Error`, `toApiV2Path` para compat. legada); `painel-api.ts` faz *unwrap* em sucesso, mensagens de erro a partir de `errors[]` ou `detail`, e **`POST /api/v2/auth/refresh`**; login em **`POST /api/v2/auth/login`**; `server-fetch` da vitrine em **`/api/v2/public/...`**. Vitest ajustado ao envelope.
- **Relatório financeiro (`GET /api/v1|v2/reports/financial`):** resposta com **`period_margin_percent`**, **`by_category[]`**, **`by_order_status[]`** (agregados no `financial_report.py`); painel com atalhos de período, tabelas por estado/categoria/produto, coluna Pareto %, CSV UTF-8 com BOM, impressão; *layout* do painel `max-w-6xl`.
- **Contrato:** `make openapi-export`; testes pytest actualizados (`test_phase3_production`, `test_api_v2_envelope`).

## 2026-04-19 (v2 alargado: auth, pedidos, insumos; `make dev`; doc deprecação)

- **`/api/v2`:** `auth/register`, `auth/login`, `auth/refresh`, `GET /orders`, `GET /inventory-items` (envelope); serviços `auth_session`, `order_queries`, `inventory_queries`.
- **`make dev`:** [`scripts/dev-local.sh`](../../scripts/dev-local.sh) — Postgres Docker + uvicorn reload + Next dev.
- **Doc:** [api-v1-v2-deprecacao.md](api-v1-v2-deprecacao.md) (política v1/v2, COGS futuro).

## 2026-04-19 (Relatório por produto + `/api/v2` envelope DEC-06)

- **Relatório:** `GET /api/v1/reports/financial` — `period_margin_estimate`, `by_product[]` (receita, custo produção, margem, %); serviço `app/services/financial_report.py`; painel tabela + CSV alargado.
- **API v2:** `GET /api/v2/health`, `GET /api/v2/reports/financial`; handlers globais para `HTTPException` e `RequestValidationError` em rotas `/api/v2`; schemas `app/schemas/envelope.py`.
- **Testes:** `test_api_v2_envelope.py`; extensão `test_financial_report_orders_revenue` (**38** casos).

## 2026-04-19 (Insumos CRUD, margem, auth refresh, documentação)

- **API:** `POST/GET/PATCH/DELETE /inventory-items`; `GET/PATCH /me` com `store_target_margin_percent`; `PATCH /me/store-pricing`; `POST /auth/refresh`; `refresh_token` no login/registo; rate limit em `POST /auth/login`; receitas com `target_margin_percent`, `suggested_unit_price` (migração `20260418_0004`).
- **Painel:** `/painel/insumos`, `/painel/definicoes`; receitas com margem da API; `painel-api` renova sessão após 401.
- **Testes:** `test_inventory_items_crud.py`; extensões em `test_services_production.py`, `test_auth.py`; **35** casos pytest; E2E opcional `login-painel.spec.ts` (`E2E_EMAIL` / `E2E_PASSWORD`).
- **Documentação:** [fase-03-gestao.md §9.1–9.2](../fases/fase-03-gestao.md), [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md), [TESTES-E-CI.md](TESTES-E-CI.md), [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) (DEC-16 parcial).

## 2026-04-18 (Documentação — hub TESTES-E-CI)

- **Novo:** [TESTES-E-CI.md](TESTES-E-CI.md) — visão única (pytest, Vitest, Playwright, `.github/workflows/ci.yml`, artefactos ignorados).
- **Índices:** [doc/README.md](../README.md), [README.md](../../README.md), [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md) §7, [fase-03-gestao.md](../fases/fase-03-gestao.md) §10.8, [backlog.md](../projeto/backlog.md).

## 2026-04-18 (Produção serviço, Vitest painel-api, E2E Playwright)

- **Pytest:** `test_services_production.py` — stock insuficiente, validações `execute_production`; cobertura `app/services` ~94%, CI **≥90%**.
- **Vitest:** `__tests__/painel-api.test.ts`; `vitest.config` com alias `@/`.
- **Playwright:** `e2e/smoke.spec.ts`, `playwright.config.ts` (standalone + `PW_SERVER_ONLY`); CI frontend alargado.

## 2026-04-17 (Testes serviço + CI GitHub Actions)

- **Pytest:** `test_services_order_flow.py`, `test_services_pricing.py`, `test_me_vitrine_whatsapp.py`; total **25** casos; cobertura **`app/services`** ~90% (gate **≥88%**).
- **CI:** `.github/workflows/ci.yml` — Ruff, pytest com `--cov=app/services --cov-fail-under=88`, frontend `npm ci` + lint + build.

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
