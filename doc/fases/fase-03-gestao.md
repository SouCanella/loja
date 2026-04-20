# Fase 3 — Gestão (planejamento completo)

**Referência:** [documento_enterprise.md](../documento_enterprise.md) §6 (modelagem), §10–§11 (receitas e precificação), §12 (idempotência pedidos), §17 (API), §19 (fluxos produção/precificação), §22 (MVP — receitas e precificação), §25 (roadmap)  
**Regras detalhadas:** [regras-negocio.md](../normativos/regras-negocio.md) RN-Receita, RN-Precificação, RN-Financeiro; [requisitos-funcionais.md](../normativos/requisitos-funcionais.md) RF-RE, RF-PR, RF-FI. **Custo MVP:** **DEC-09** (média ponderada). **Consumo de lotes:** **DEC-17**.

## Documentação normativa (leitura obrigatória para esta fase)

- [regras-negocio.md](../normativos/regras-negocio.md)
- [requisitos-funcionais.md](../normativos/requisitos-funcionais.md)
- [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) — **RNF-Arq-02a** (pedidos), **RNF-Arq-02b** (produção nesta fase)
- [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) — **DEC-09**, **DEC-17**

### Gates antes de implementar esta fase

- Fase 2 entregue ou insumos/lotes e pedidos mínimos estáveis.
- Motor de precificação usa **média ponderada** (**DEC-09**) de forma consistente com lotes.
- Produção chama a mesma política de baixa de lote (**DEC-17**) que o restante do estoque.
- **RNF-Arq-02b:** endpoints que executam produção (baixa + entrada de acabado) devem ser **idempotentes** (chave de idempotência ou deduplicação documentada) para evitar dupla movimentação em retry de rede/cliente.

---

## 1. Objetivo

Habilitar **produção a partir de receitas**, **movimentação de insumos** e **precificação informada por custo e margem**, além de relatório financeiro básico para decisão (§13 e fluxos §19).

---

## 2. Escopo planejado

### 2.1 Dados

- **recipes:** id, product_id, yield, time_minutes.
- **recipe_items:** id, recipe_id, item_id, quantity.
- **stock_movements:** consolidar tipos necessários (consumo produção, entrada produto acabado, ajustes).
- Ligação receita → produto final e consumo de **inventory_items**.

### 2.2 Fluxos

- **Produção:** receita → consome insumos (baixa) → gera produto final (entrada) (§19).
- **Precificação:** custo (de lotes/itens) → margem definida → preço sugerido → ajuste manual em `products.price` (§11 e §19).

### 2.3 API (§17)

Planejado:

- `POST /api/v1/production` (ordem de produção / execução de receita — desenho exato na implementação). **Idempotência obrigatória** conforme **RNF-Arq-02b** (mesmo pedido/requisição repetida não duplica baixa nem entrada de acabado).
- `GET /api/v1/reports/financial` (agregações mínimas: receita, custo, margem por período ou por produto — definir escopo na execução).

---

## 3. Critérios de aceite

- [x] Cadastro de receitas vinculado a produto e insumos com quantidades — `GET/POST /api/v1/recipes`, `GET/PATCH /api/v1/recipes/{id}` (uma receita por produto por loja).
- [x] Execução de produção transacional; **idempotência** `Idempotency-Key` em `POST /api/v1/production` (**RNF-Arq-02b**); movimentos `production_out` / `production_in`; baixa insumos **DEC-17**.
- [x] Custo do lote acabado = custo total insumos / rendimento (**DEC-09**); estimativa `estimated_unit_cost` em receita (média ponderada lotes); `products.price` continua editável.
- [x] `GET /api/v1/reports/financial` — receita pedidos (excl. rascunho/cancelado), contagens, custo insumos de produção no período.
- [x] Testes de integração `test_phase3_production.py`; relatório HTML de testes — opcional.
- [x] Documentação e changelog atualizados neste marco.

---

## 4. Dependências

- **Fase 2** concluída nos entregáveis necessários: modelos e API de produtos, insumos/lotes, pedidos e movimentos de stock; vitrine pública. Ver [fase-02-operacao.md](fase-02-operacao.md) **§10** (inventário) e **§10.4** (o que ficou em backlog).

---

## 5. MVP (§22) — fechamento

| Item | Esta fase |
|------|-----------|
| Receitas | Sim |
| Precificação simples | Sim |
| Relatório financeiro básico | Sim (`GET /api/v1/reports/financial`) |

Após esta fase, revisar [backlog.md](../projeto/backlog.md): MVP-05/MVP-06 mantidos como **parcial** (UI e margem indicativa; ver tabela e §9.1).

---

## 6. Testes

- Integração: produção consome quantidades corretas; método de custo (FIFO / média / último — §9) — documentar escolha na execução.
- Unitários: motor de precificação e validações de receita.

---

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| Custo médio vs lote | definir política única no MVP; alternativas no backlog |
| Relatório “financeiro” amplo | limitar a MVP: período fixo ou totais simples |

---

## 8. Estado da execução

| Campo | Valor |
|-------|--------|
| **Status** | `concluída` (MVP Fase 3 — **API** receitas/produção/relatório + **painel Next** para receitas, produção e relatório com CSV). |
| **Data de conclusão** | 2026-04-17 |
| **Notas** | Migrações `20260417_0003`, `20260418_0004` (`recipes.target_margin_percent`); contrato em [`doc/api/openapi.json`](../api/openapi.json); marcos em [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md). **2026-04-19:** CRUD de insumos, margem loja/receita, refresh JWT. **2026-04-17:** frontend em **`/api/v2`** (envelope DEC-06); relatório com `by_category`, `by_order_status`, `period_margin_percent` e UI alargada — ver **§9.2–9.3**. **2026-04-17 (UX vitrine):** contentor `max-w-screen-2xl`, cards em coluna até `xl`, padding `#sobre` para barra fixa do carrinho, sheet do carrinho `max-w-xl`/`sm:max-w-2xl`, remoção de `max-w-vitrine` no Tailwind — registo em [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) (secção «2026-04-17 (Vitrine — largura, mobile e barra fixa do carrinho)»). |

---

## 9. Kickoff técnico (iteração 1) — concluído

A sequência planejada na redacção inicial desta fase foi implementada:

1. Modelagem `recipes`, `recipe_items`, `production_runs`; migração Alembic `20260417_0003_phase3_recipes_production.py`.
2. Tipos de movimento `production_out` e `production_in`; `stock_movements.production_run_id`.
3. Serviço `execute_production` — transação com baixa FEFO (**DEC-17**) e entrada de acabado; custo unitário (**DEC-09**).
4. `POST /api/v1/production` com header **`Idempotency-Key`** (**RNF-Arq-02b**).
5. Estimativa `estimated_unit_cost` em receitas via `app/services/pricing.py` (média ponderada).
6. `GET /api/v1/reports/financial?date_from=&date_to=` — receita de pedidos, custo de insumos em produção, contagens.
7. Testes `backend/tests/test_phase3_production.py`.
8. OpenAPI exportado e entrada no [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md).

### 9.1 Incrementos entregues (2026-04-19)

- **Insumos:** `POST`/`GET`/`PATCH`/`DELETE /api/v1/inventory-items` (lote inicial opcional no POST); UI **`/painel/insumos`**.
- **Margem:** `stores.config.pricing.target_margin_percent`; `GET /me` expõe `store_target_margin_percent`; **`PATCH /me/store-pricing`**; receitas com `target_margin_percent` opcional, `effective_margin_percent` e **`suggested_unit_price`**; UI **`/painel/definicoes`** e formulário de nova receita.
- **Auth (DEC-16 parcial):** `refresh_token` no login/registo; **`POST /auth/refresh`**; cliente renova access após 401; **rate limit** configurável no `POST /auth/login`.

### 9.2 Entregue após o fecho mínimo (2026-04-17)

- **Cliente API v2:** aplicação Next.js (painel, login, `server-fetch` da vitrine) usa **`/api/v2`** com envelope DEC-06; helpers em `frontend/lib/api-v2.ts` e `painel-api.ts` (*unwrap*, erros, *refresh*). Documentação: [api-v1-v2-deprecacao.md](../execucao/api-v1-v2-deprecacao.md) §5.
- **Relatório financeiro:** `FinancialReportOut` com `period_margin_percent`, `by_category[]`, `by_order_status[]`; painel `/painel/relatorio` com atalhos de período, tabelas, Pareto %, CSV UTF-8, impressão.

### 9.3 Próximo marco sugerido

1. **Fase 3.1 — paridade com mockups** (shell, **gráficos**, módulos em falta): [fase-03-1-paridade-mockup.md](fase-03-1-paridade-mockup.md) — **concluída** (ver §7–§10 desse ficheiro).
2. **Fase 3.2 — impressão de pedidos** (térmica USB/Bluetooth, A4/A6): [fase-03-2-impressao-termica.md](fase-03-2-impressao-termica.md); **DEC-21**.
3. **Relatório / stock:** **COGS por lote** ou comparação de períodos — ver [api-v1-v2-deprecacao.md](../execucao/api-v1-v2-deprecacao.md) §4 e [backlog.md](../projeto/backlog.md).
4. **Sessão:** refresh em **cookie httpOnly** (alternativa ao `localStorage`) — **DEC-16**.
5. **Fase 4 / plataforma:** [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) — escala, **DEC-15** se priorizado, observabilidade (**RNF-Ops-01**).
6. **UX:** **DEC-10** FieldHelp em campos críticos; E2E no CI com credenciais de teste (`E2E_EMAIL` / `E2E_PASSWORD`).

---

## 10. Inventário do que foi entregue (referência única)

### 10.1 Persistência e migração

- **Ficheiros:** `backend/alembic/versions/20260417_0003_phase3_recipes_production.py`; `backend/alembic/versions/20260418_0004_recipe_target_margin.py` (`recipes.target_margin_percent`, JSON `stores.config.pricing` usado em runtime).
- **Tabelas / alterações:** `recipes`, `recipe_items`, `production_runs`; coluna `stock_movements.production_run_id`; enum de tipos de movimento alargado.

### 10.2 Backend — módulos principais

| Área | Localização (indicativa) |
|------|---------------------------|
| Modelos | `backend/app/models/recipe.py`, `production_run.py`; `StockMovement` / enum em `order.py`, `enums.py` (tipos `production_*`, FK `production_run_id`) |
| Schemas Fase 3 | `backend/app/schemas/phase3.py`; `backend/app/schemas/inventory_items.py`; `UserMeResponse` em `backend/app/schemas/user.py` |
| Serviços | `production_service.py`, `pricing.py`, `financial_report.py` |
| Rotas | `api/v1/endpoints/…`; `api/v2/endpoints/` (piloto DEC-06) |
| Registo | `api/v1/router.py`; `api/v2/router.py` + `main.py` |

### 10.3 Endpoints HTTP (prefixo `/api/v1`, autenticação Bearer salvo indicação)

| Método | Caminho | Notas |
|--------|---------|--------|
| GET | `/recipes` | Lista receitas; `estimated_unit_cost`, `target_margin_percent`, `effective_margin_percent`, `suggested_unit_price`. |
| POST | `/recipes` | Cria receita (uma por produto por loja). |
| GET | `/recipes/{recipe_id}` | Detalhe. |
| PATCH | `/recipes/{recipe_id}` | Actualiza receita e linhas. |
| POST | `/production` | Corpo: receita, quantidade produzida; header **`Idempotency-Key`** recomendado. |
| GET | `/reports/financial` | Query: `date_from`, `date_to` (ISO date). Totais + `period_margin_estimate` + `period_margin_percent` + `by_product[]` + `by_category[]` + `by_order_status[]`. |
| GET | `/inventory-items` | Lista insumos com `has_sale_product`. |
| POST | `/inventory-items` | Cria insumo; `initial_batch` opcional (quantidade, custo, validade). |
| GET | `/inventory-items/{id}` | Detalhe. |
| PATCH | `/inventory-items/{id}` | Nome/unidade. |
| DELETE | `/inventory-items/{id}` | Bloqueado se houver produto de venda ou linha de receita. |
| GET | `/me` | `store_slug`, `store_name`, **`vitrine_whatsapp`**, **`store_target_margin_percent`**. |
| PATCH | `/me/store-pricing` | `target_margin_percent` (0–100) → `stores.config.pricing`. |
| POST | `/auth/refresh` | Corpo `{"refresh_token"}` → novo par access/refresh. |

**API v2 (prefixo `/api/v2`, envelope DEC-06):** `GET /health`; `POST /auth/register`, `/auth/login`, `/auth/refresh`; `GET /reports/financial`; `GET /orders`; `GET /inventory-items` — ver [api-v1-v2-deprecacao.md](../execucao/api-v1-v2-deprecacao.md). Implementação: `backend/app/api/v2/`, `app/schemas/envelope.py`, handlers em `app/main.py`.

**Pedidos (API Fase 2, usados no painel):** `GET` / `POST` `/orders`, `GET` `/orders/{order_id}`, `PATCH` `/orders/{order_id}/status`. O `GET` lista inclui **`created_at`** em cada `OrderOut`.

### 10.4 Testes automatizados

- `backend/tests/test_phase3_production.py` — produção, idempotência, relatório.
- `backend/tests/test_services_production.py` — FEFO multi-lote, receita removida, validações.
- `backend/tests/test_inventory_items_crud.py` — CRUD insumos e regras de delete.
- `backend/tests/test_auth.py` — refresh, `PATCH /me/store-pricing`, `store_target_margin_percent` em `/me`.

### 10.5 Frontend (Next.js — App Router)

| Rota | Ficheiro | Função |
|------|----------|--------|
| `/painel` | `frontend/app/painel/page.tsx` | Resumo, dados de `/me`, link para `/loja/{store_slug}`. |
| `/painel/pedidos` | `frontend/app/painel/pedidos/page.tsx` | Lista `GET /orders`; **filtro por estado**; botão **Novo pedido**. |
| `/painel/pedidos/novo` | `frontend/app/painel/pedidos/novo/page.tsx` | `POST /orders` (linhas de produto + nota); `Idempotency-Key`; redirecciona ao detalhe. |
| `/painel/pedidos/[id]` | `frontend/app/painel/pedidos/[id]/page.tsx` | Itens + total; `PATCH /orders/{id}/status`; produtos via `GET /products`; **WhatsApp** se `/me.vitrine_whatsapp` existir (`draftOrderWhatsAppMessage`, `whatsAppUrl`). |
| `/painel/receitas` | `frontend/app/painel/receitas/page.tsx` | Lista receitas, custo, margem efectiva, **suggested_unit_price**, **Produzir lote**. |
| `/painel/receitas/nova` | `frontend/app/painel/receitas/nova/page.tsx` | Criação de receita; insumos via `GET /inventory-items`; margem % opcional por receita. |
| `/painel/relatorio` | `frontend/app/painel/relatorio/page.tsx` | `GET /api/v2/reports/financial` por intervalo; resumo + por estado + por categoria + por produto (ordenação, Pareto %); **CSV UTF-8** e **imprimir/PDF**. |
| `/painel/insumos` | `frontend/app/painel/insumos/page.tsx` | CRUD mínimo de insumos. |
| `/painel/definicoes` | `frontend/app/painel/definicoes/page.tsx` | Margem alvo da loja. |
| Layout painel | `frontend/app/painel/layout.tsx` | Navegação Painel / Pedidos / Receitas / Insumos / Definições / Relatório / Sessão; `max-w-6xl`. |
| Cliente API | `frontend/lib/painel-api.ts` | Chamadas **`/api/v2`** com *unwrap* DEC-06; `POST /api/v2/auth/refresh` após 401; `setSessionTokens`, `formatBRL`, helpers pedido/WhatsApp. |
| Envelope v2 | `frontend/lib/api-v2.ts` | `unwrapV2Success`, `messageFromV2Error`, `toApiV2Path`. |
| Vitrine SSR | `frontend/lib/vitrine/server-fetch.ts` | `GET /api/v2/public/...` + *unwrap*. |
| Login | `frontend/app/login/page.tsx` | `POST /api/v2/auth/login`, tokens em `data`. |

### 10.6 Documentação de contrato e raiz do repositório

- **OpenAPI:** [`doc/api/openapi.json`](../api/openapi.json) (regenerar com `make openapi-export` após alterações na API).
- **README raiz:** [`README.md`](../../README.md) — comandos `make`, URLs locais, lista resumida de rotas e páginas do painel.

### 10.7 Operação

- Aplicar migrações antes de usar receitas em ambiente real: `make migrate` (serviços no ar; `DATABASE_URL` em `.env`).
- Variáveis: ver [`.env.example`](../../.env.example) (`NEXT_PUBLIC_API_URL`, etc.).

### 10.8 Qualidade e conformidade com normas

- Auditoria face a **RNF-*** (testes, idempotência, DevEx) e desvios conhecidos (envelope API, FieldHelp, E2E): [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md).
- Hub único de **comandos, pastas e CI** (pytest, Vitest, Playwright): [TESTES-E-CI.md](../execucao/TESTES-E-CI.md).
- **Resumo:** `make lint`, `pytest` (**39** casos), `make dev` (Postgres Docker + reload), `npm run test` (Vitest), `npm run test:e2e`; pacote **`app/services`** ~**94%** com gate CI ≥**90%**. Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml).
