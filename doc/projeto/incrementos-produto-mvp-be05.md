# Incrementos futuros — ideias IP, MVP, BE-05

Documento de **planeamento**: critérios mínimos sugeridos antes de implementação completa. Itens grandes ficam fora de escopo até promoção no [backlog.md](backlog.md).

## IP-02 (produção) — entregue neste pacote (parcial)

- **Agrupar por dia** na página `/painel/producao` (vista por dia civil local).
- Evolução futura: planeamento por dia (capacidade, lotes previstos) — ver [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) §8.1.

## IP-03 — Promoções (combos, desconto por quantidade)

| Critério | Notas |
|----------|--------|
| Modelo de dados | Tabelas `promotions`, regras JSON ou colunas tipadas; impacto em `order_items` (preço efectivo). |
| Vitrine vs painel | Onde se configura; se aplica só vitrine ou também pedidos do painel. |
| Testes | Cálculo de total com promoção + edge cases (stock, mínimos). |

## IP-04 — Disponibilidade por dia/horário

| Critério | Notas |
|----------|--------|
| Granularidade | Por loja global vs por produto; fusos (`stores.config` já tem timezone). |
| Checkout | Mensagem quando fora do horário; bloquear ou só avisar. |

## IP-06 — Recompra, inactivos, frequência

| Critério | Notas |
|----------|--------|
| Dados | **`GET /api/v2/dashboard/customer-order-stats`** devolve `registered_accounts_count`, `accounts_with_orders_in_period`, `accounts_without_orders_in_period` (sem pedidos no intervalo seleccionado). |
| UI | **Clientes** — bloco «Resumo no período» acima da tabela. **Pendente:** recompra, frequência, segmentos exportáveis. |

## IP-09 / IP-10 — Avaliações (media + resposta do lojista)

Dependem de **RF-AV** (avaliações base) e moderação; requerem storage (MA-03) para fotos/vídeo.

## MVP-02 … MVP-06 — lacunas no modelo actual

Encerramento incremental sem integrações novas (pagamentos externos, etc.):

- **Catálogo / imagens:** fluxo S3 + CDN documentado em código existente.
- **Stock:** ajustes e leituras dedicadas na UI onde ainda faltar.
- **Preço vs sugestão:** alinhar métricas em precificação com `products.price`.

## BE-05 — Multi-utilizador / RBAC (parcial neste pacote)

- **Entregue:** enum `UserRole` alargado com `store_operator` e `store_viewer` (`backend/app/models/user.py`) — valores persistidos como string (`native_enum=False`).
- **Pendente:** convites, atribuição de papel no registo, decoradores de permissão por rota, UI em **Perfil** para ver papel (leitura).

## Relação com documentação normativa

- [painel-ux-layout-formularios-precificacao.md](painel-ux-layout-formularios-precificacao.md) — consistência de UI.
- [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) — DEC-22 se tocar em pedidos/receita.
