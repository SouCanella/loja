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

- [ ] CRUD ou leitura gestão de produtos isolado por loja.
- [ ] Pedido criado com itens; impossível acessar pedido de outra loja.
- [ ] Se reserva/idempotência forem escopo desta fase: transações cobrindo lock/reserva/timeout (§12); caso contrário, documentar limitação e item no [backlog.md](../projeto/backlog.md).
- [ ] Estoque reflete movimentações básicas (venda/baixa) sem quebrar invariantes (quantidade não negativa — §9).
- [ ] Testes de integração dos fluxos principais; relatórios HTML atualizados.
- [ ] Documentação de fase e backlog atualizados.

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
| **Status** | `planejado` |
| **Data de conclusão** | — |
| **Notas** | Preencher ao concluir. |
