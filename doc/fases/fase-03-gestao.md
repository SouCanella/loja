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

Após esta fase, revisar [backlog.md](../projeto/backlog.md): marcar MVP como completo ou listar gaps.

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
| **Status** | `em progresso` — **backend** + **painel Next** (receitas, produzir lote, relatório + CSV); insumos só via produtos ou `GET /inventory-items`. |
| **Data de conclusão** | — |
| **Notas** | Migração `20260417_0003`; rotas em [README.md](../../README.md); `/me` com `store_slug` para atalho à vitrine. |

---

## 9. Próximo passo imediato (kickoff técnico sugerido)

Ordem sugerida para a primeira iteração (ajustar ao desenho fino dos schemas):

1. **Modelagem** `recipes` e `recipe_items` (FK a `products` e `inventory_items`), migração Alembic.
2. **Tipos de movimento** em `stock_movements` (ou extensão de `StockMovementType`) para consumo de produção e entrada de acabado.
3. **Serviço** de execução de receita: uma transação que baixa insumos (DEC-17) e credita produto final / lote.
4. **Endpoint** `POST /api/v1/production` com corpo idempotente (header `Idempotency-Key` ou campo único por loja) — alinhar a **RNF-Arq-02b**.
5. **Motor de precificação** (média ponderada DEC-09) e persistência opcional de “preço sugerido” vs `products.price`.
6. **`GET /api/v1/reports/financial`** com agregações mínimas acordadas (período, receita/custo/margem).
7. **Testes** de integração (produção feliz, retry idempotente, falha de stock insuficiente).
8. **OpenAPI** + entrada em [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) — feito para o backend inicial.

### 9.1 Próximos incrementos sugeridos

- UI no **painel** para cadastrar receitas e disparar produção.
- Relatório financeiro com export CSV ou mais métricas (margem por produto).
- Endpoint dedicado de **sugestão de preço** ou sincronização automática opcional com `products.price`.
