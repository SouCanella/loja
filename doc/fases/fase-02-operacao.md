# Fase 2 — Operação (planejamento completo)

**Referência:** [documento_enterprise.md](../documento_enterprise.md) §6 (modelagem), §7–§8 (loja/admin), §9 (estoque), §12 (pedidos, concorrência, idempotência), §17 (API), §19 (fluxo pedido), §22 (MVP — catálogo, pedidos, estoque), §15 (UX), §25 (roadmap)  
**Regras detalhadas:** [regras-negocio.md](../normativos/regras-negocio.md) RN-Pedidos, RN-Estoque, RN-Catalogo. **Status de pedido:** **DEC-14**; **categorias:** **DEC-20**; **baixa de lote:** **DEC-17**.

## Documentação normativa (leitura obrigatória para esta fase)

- [regras-negocio.md](../normativos/regras-negocio.md)
- [requisitos-funcionais.md](../normativos/requisitos-funcionais.md)
- [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md)
- [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) — **DEC-14**, **DEC-17**, **DEC-20**

### Gates antes de implementar esta fase

- Migrações e enums de **`orders.status`** alinhados a **DEC-14** (oito estados).
- Modelo **`categories`** + produtos conforme **DEC-20**.
- Serviços de estoque respeitam **DEC-17** ao consumir lotes (FEFO/FIFO físico).

**Políticas MVP registadas (2026-04-17):** ver [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) secção *Decisões de implementação MVP (Fase 2)* e [regras-negocio.md](../normativos/regras-negocio.md) **RN-034**, **RN-058**, **RN-059**, **RN-071**, **RN-072**.

---

## 1. Objetivo

Colocar em produção o **dia a dia da loja**: catálogo de produtos, estoque por item e lotes, registro de pedidos e itens, alinhado ao fluxo **cliente → catálogo → carrinho → WhatsApp → pedido registrado** (§19) — a parte WhatsApp pode ser link/manual no MVP; o **pedido registrado** no sistema é obrigatório. Pedidos devem suportar a máquina de estados **DEC-14** e, quando priorizado nesta fase, **reserva de estoque + timeout** e **`idempotency_key`** (§12).

---

## 2. Escopo planejado

### 2.1 Dados e domínio

- **products:** id, store_id, name, price, active.
- **inventory_items:** id, store_id, name, unit.
- **inventory_batches:** id, item_id, quantity, unit_cost, expiration_date (onde aplicável).
- **orders:** id, store_id, customer_id, status (enum **DEC-14** — oito estados; ver [regras-negocio.md](../normativos/regras-negocio.md)), `idempotency_key` recomendado (§12). Customer pode ser texto/placeholder se não houver entidade cliente ainda.
- **order_items:** id, order_id, product_id, quantity.
- **stock_movements:** id, item_id, type, quantity — pelo menos movimentações necessárias para manter coerência ao registrar consumo/venda simplificada.

Todas as consultas com **store_id** (direto ou via join seguro).

### 2.2 API (§17 — mínimo viável)

Planejado para esta fase (prefixo versionado, envelope `{ success, data, errors }`):

- `GET /api/v1/products` (e CRUD mínimo para gestão interna se necessário)
- `POST /api/v1/orders` (criação de pedido + itens; aceitar `Idempotency-Key` ou campo equivalente quando implementado)
- Endpoints auxiliares: estoque (leitura/ajuste conforme regra de negócio definida na implementação)

`POST /production` e relatórios financeiros: **Fase 3** (exceto stubs documentados no backlog).

### 2.3 Frontend

- Telas mobile-first: catálogo, detalhe, carrinho/checkout simplificado, lista de pedidos.
- **Opcional (evolução):** layout de catálogo em **grade** ou **lista em linhas** conforme config da loja (**RF-CF-08**, **RN-027**); avaliações por produto **desligadas no padrão inicial** — se ativadas, incluir fluxo de moderação no admin (**RF-AV**). Se não couber neste marco, manter como item explícito no [backlog.md](../projeto/backlog.md).
- Feedback visual em ações (§15).

---

## 3. Critérios de aceite

- [x] CRUD ou leitura gestão de produtos isolado por loja — **API** (`/categories`, `/products`); **vitrine** `/loja/[slug]` + detalhe; **painel** gestão de pedidos na UI — evolução.
- [x] Pedido criado com itens; impossível acessar pedido de outra loja — **API** + testes de isolamento.
- [ ] Reserva de estoque + timeout (§12) — **fora do escopo MVP atual**; `Idempotency-Key` em `POST /orders` (unicidade por loja). Ver [backlog.md](../projeto/backlog.md).
- [x] Estoque reflete movimentações básicas (baixa **DEC-17** ao **confirmar**, reversão ao **cancelar**; FEFO com `expiration_date` null por último).
- [x] Testes de integração dos fluxos principais (`test_phase2_orders.py`).
- [ ] Relatórios HTML de testes — opcional; `make test` na raiz.
- [x] Documentação de fase e changelog (execução) atualizados neste marco; backlog se alterações de escopo.

---

## 4. Dependências

- **Fase 1** concluída (auth + tenant + base).

---

## 5. Testes

- Integração: criar pedido → refletir em estoque/movimentos conforme regra.
- Unitários: serviços de pedido e produto.

---

## 6. MVP (§22) — cobertura nesta fase

| Item | Planejado aqui |
|------|----------------|
| Catálogo | Sim |
| Pedidos | Sim |
| Estoque básico | Sim |
| Autenticação | Herdado Fase 1 |
| Receitas / precificação | Não (Fase 3) |

---

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| customer_id sem entidade Cliente | usar campo texto opcional ou ID externo até Fase posterior |
| Concorrência em estoque | transações DB + lock pessimista/reserva (§12) quando em escopo; senão documentar no backlog |

---

## 8. Estado da execução

| Campo | Valor |
|-------|--------|
| **Status** | `em progresso` — **backend** + **vitrine Next** (catálogo, carrinho, WhatsApp); **painel** com lista/gestão de pedidos na UI ainda por priorizar. |
| **Data de conclusão** | — (fase aberta até UI e critérios restantes) |
| **Dependências** | Fase 1 concluída (auth, tenant, `stores`/`users`, Alembic base). |
| **Notas** | Migração `20260417_0002`; rotas em [README.md](../../README.md) na raiz; OpenAPI em [doc/api/openapi.json](../api/openapi.json). Reserva pessimista / timeout: backlog. Ao fechar a fase: rever secção 3 e [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md). |

---

## 9. Registo de execução e aderência (planejado × realizado)

**Última revisão:** 2026-04-17. Compara o planejamento deste ficheiro e as decisões em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) com o código na `main` (mensagem de commit `feat(phase-2): catálogo, pedidos e estoque`).

### 9.1 Gates DEC-14 / DEC-17 / DEC-20 (checklist pré-Fase 2)

| Gate | Exigência | Aderência | Evidência no código |
|------|-----------|-----------|---------------------|
| **DEC-14** | Oito estados canónicos em migração e enum | **Sim** | `OrderStatus` em `backend/app/models/enums.py`; coluna `orders.status` na revisão `20260417_0002`. |
| **DEC-17** | Consumo de lotes em transação; FEFO/FIFO; não negativo | **Sim** | `allocate_stock_for_order` / `release_stock_for_order` em `backend/app/services/stock.py`; ordenação `expiration_date` ASC + `nulls_last()`, depois `received_at`, depois `id`. |
| **DEC-20** | `categories` + FK opcional em `products` | **Sim** | `categories` com `uq_categories_store_slug`; `products.category_id` nullable; API de categorias e produtos. |

### 9.2 Políticas MVP (tabela em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) — *Decisões de implementação MVP*)

| Norma | Política acordada | Aderência | Notas |
|-------|-------------------|-----------|--------|
| **RN-058** | Transições manuais flexíveis; histórico obrigatório; terminais `entregue` / `cancelado` | **Sim** | `PATCH /orders/{id}/status` + `OrderStatusHistory`; `is_transition_allowed_mvp` bloqueia saída de terminais (`order_flow.py`). |
| **RN-059** | Matriz restrita só na evolução | **N/A no MVP** | Comportamento flexível mantido. |
| **RN-071** | Primeira baixa física ao atingir `confirmado` (ou saltar para ≥ confirmado) | **Sim** | `needs_stock_commit` + `allocate_stock_for_order` quando o novo índice cruza `confirmado` sem já ter stock comprometido. |
| **RN-072** | Reverter baixas ao cancelar após consumo | **Sim** | `release_stock_for_order` quando `cancelado` e `stock_committed`. |
| **RN-034** | Categorias planas; `slug` único por loja; `category_id` opcional; filtros mínimos | **Sim** | Filtro `category_slug` em listagens autenticada e pública; `category_id` opcional na criação de produto. *Melhoria opcional:* aceitar também `category_id` como query param nas listagens (norma diz «e/ou»). |

### 9.3 Escopo §2.1 (dados) e §2.2 (API)

| Item planejado | Situação | Comentário |
|----------------|----------|------------|
| `products`, `inventory_*`, `orders`, `order_items`, `stock_movements` | **Implementado** | Inclui campos extra úteis (`unit_price` em linha, `stock_committed`, alocações por lote). |
| `customer_id` ou texto | **Texto** | `orders.customer_note` (opcional); sem entidade Cliente — alinhado ao risco §7. |
| `idempotency_key` | **Sim** | Coluna + `UniqueConstraint(store_id, idempotency_key)`; header opcional no `POST /orders`. |
| API §17 com envelope **DEC-06** `{ success, data, errors }` | **Não** | Respostas «cruas» como na Fase 1; **DEC-06** continua débito de produto — evolução transversal ou Fase posterior. |
| Endpoints auxiliares de estoque (leitura/ajuste) | **Parcial** | Estoque entra via criação de produto (lote inicial) e movimentos de venda/reversão; **sem** `GET /inventory` ou ajuste manual dedicado neste marco. |
| `GET /api/v1/products`, `POST /api/v1/orders` + idempotência | **Sim** | Inclui `categories`, `GET /products/{id}`, `PATCH` status, catálogo público por `store_slug`. |

### 9.4 Escopo §2.3 (frontend) e critérios §3

| Entrega | Aderência |
|---------|-----------|
| Catálogo, detalhe, carrinho (mobile-first), alinhado ao mockup `doc/mockups/loja-vitrine-layout-sugestao.html` | **Vitrine** — `/loja/[slug]`, `/loja/[slug]/p/[id]`; tema de cores e layout grade/lista; carrinho em `localStorage`; finalização via **WhatsApp** (`store.theme.vitrine.whatsapp`). **Destaques RF-CA-11** (fitas) e imagens reais: não modelados na API — emojis como placeholder. |
| Lista de pedidos (cliente / staff no painel) | **Parcial** — pedidos na API; **UI painel** ainda stub. |
| Relatórios HTML de testes (critério opcional) | **Opcional** — `make test` (pytest + Vitest) sem relatório HTML obrigatório. |
| Reserva + timeout §12 | **Fora do escopo** explícito do MVP atual; documentado como backlog (secção 3). |

### 9.5 Síntese

- **Normas DEC-14 / DEC-17 / DEC-20 e RN citadas para a Fase 2:** o backend entregue está **aderente** às políticas MVP acordadas.
- **Desvios conscientes:** envelope **DEC-06**, leitura/ajuste explícito de inventário, reserva pessimista, UI vitrine/painel — registados acima e/ou no [backlog.md](../projeto/backlog.md).
- **Próximo passo de aderência plena ao capítulo §2 da fase:** **painel** (pedidos/stock) na UI, APIs de inventário se necessário, envelope **DEC-06** se priorizado.
