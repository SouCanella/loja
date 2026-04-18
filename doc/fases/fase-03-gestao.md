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
| **Notas** | Migração `20260417_0003`; contrato em [`doc/api/openapi.json`](../api/openapi.json); marcos em [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md). Insumos “puros” (sem produto de venda): listagem via `GET /inventory-items`; criação continua a depender de produto com inventário ou evolução futura de API. Margem sugerida na UI (~30%) é **indicativa**, não persistida. |

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

### 9.1 Próximos incrementos (backlog / não bloqueantes)

- **Painel — pedidos:** listagem e gestão de estados (API Fase 2 já existe).
- **Insumos:** `POST`/`PATCH` em `inventory_items` ou fluxo dedicado + UI mínima (além do `GET` actual).
- **Margem configurável** por loja ou receita (substituir percentagem fixa na UI).
- Endpoint opcional de **preço sugerido** explícito ou sincronização com `products.price`.
- Relatório: mais métricas (ex.: margem por produto) além do CSV já disponível no cliente.

---

## 10. Inventário do que foi entregue (referência única)

### 10.1 Persistência e migração

- **Ficheiro:** `backend/alembic/versions/20260417_0003_phase3_recipes_production.py`.
- **Tabelas / alterações:** `recipes`, `recipe_items`, `production_runs`; coluna `stock_movements.production_run_id`; enum de tipos de movimento alargado.

### 10.2 Backend — módulos principais

| Área | Localização (indicativa) |
|------|---------------------------|
| Modelos | `backend/app/models/recipe.py`, `production_run.py`; `StockMovement` / enum em `order.py`, `enums.py` (tipos `production_*`, FK `production_run_id`) |
| Schemas Fase 3 | `backend/app/schemas/phase3.py`; `backend/app/schemas/inventory_items.py`; `UserMeResponse` em `backend/app/schemas/user.py` |
| Serviços | `backend/app/services/production_service.py`, `backend/app/services/pricing.py` |
| Rotas | `backend/app/api/v1/endpoints/recipes.py`, `production.py`, `reports_financial.py`, `inventory_items.py`, `me.py` |
| Registo no router | `backend/app/api/v1/router.py` |

### 10.3 Endpoints HTTP (prefixo `/api/v1`, autenticação Bearer salvo indicação)

| Método | Caminho | Notas |
|--------|---------|--------|
| GET | `/recipes` | Lista receitas da loja; inclui `estimated_unit_cost`. |
| POST | `/recipes` | Cria receita (uma por produto por loja). |
| GET | `/recipes/{recipe_id}` | Detalhe. |
| PATCH | `/recipes/{recipe_id}` | Actualiza receita e linhas. |
| POST | `/production` | Corpo: receita, quantidade produzida; header **`Idempotency-Key`** recomendado. |
| GET | `/reports/financial` | Query: `date_from`, `date_to` (ISO date). |
| GET | `/inventory-items` | Lista `id`, `name`, `unit` dos insumos da loja (para formulários de receita). |
| GET | `/me` | Resposta inclui `store_slug` e `store_name` (atalho à vitrine no painel). |

### 10.4 Testes automatizados

- `backend/tests/test_phase3_production.py` — produção, idempotência, validações relevantes.

### 10.5 Frontend (Next.js — App Router)

| Rota | Ficheiro | Função |
|------|----------|--------|
| `/painel` | `frontend/app/painel/page.tsx` | Resumo, dados de `/me`, link para `/loja/{store_slug}`. |
| `/painel/receitas` | `frontend/app/painel/receitas/page.tsx` | Lista receitas, custo estimado, sugestão de preço indicativa, **Produzir lote** (`POST /production` + `Idempotency-Key`). |
| `/painel/receitas/nova` | `frontend/app/painel/receitas/nova/page.tsx` | Criação de receita com dropdown de insumos (`GET /inventory-items`). |
| `/painel/relatorio` | `frontend/app/painel/relatorio/page.tsx` | `GET /reports/financial` por intervalo; botão **Descarregar CSV** (gerado no browser). |
| Layout painel | `frontend/app/painel/layout.tsx` | Navegação Painel / Receitas / Relatório / Sessão. |
| Cliente API | `frontend/lib/painel-api.ts` | `apiPainelJson`, token em `localStorage`, `formatBRL`, erros tipados. |

### 10.6 Documentação de contrato e raiz do repositório

- **OpenAPI:** [`doc/api/openapi.json`](../api/openapi.json) (regenerar com `make openapi-export` após alterações na API).
- **README raiz:** [`README.md`](../../README.md) — comandos `make`, URLs locais, lista resumida de rotas e páginas do painel.

### 10.7 Operação

- Aplicar migrações antes de usar receitas em ambiente real: `make migrate` (serviços no ar; `DATABASE_URL` em `.env`).
- Variáveis: ver [`.env.example`](../../.env.example) (`NEXT_PUBLIC_API_URL`, etc.).
