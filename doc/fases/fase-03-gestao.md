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

- [ ] Cadastro de receitas vinculado a produto e insumos com quantidades.
- [ ] Execução de produção atualiza estoque de forma consistente (transacional) e **idempotente** em `POST …/production` (ou rota equivalente), alinhado a **RNF-Arq-02b**.
- [ ] Precificação: cálculo de sugestão a partir de custos; persistência de preço ajustável.
- [ ] Endpoint de relatório financeiro com conjunto mínimo de métricas acordado na implementação.
- [ ] Testes de integração dos fluxos produção + relatório; HTML conforme padrão do projeto.
- [ ] Documentação e backlog atualizados.

---

## 4. Dependências

- **Fase 2** concluída (produtos, estoque, pedidos).

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
| **Status** | `planejado` |
| **Data de conclusão** | — |
| **Notas** | Preencher ao concluir. |
