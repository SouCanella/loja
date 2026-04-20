# IP-11 — Pedidos iniciados na vitrine (WhatsApp) visíveis no painel

**Estado:** **MVP entregue (2026-04-17)** — `POST /api/v2/public/stores/{slug}/orders` cria `Order` com estado `aguardando_confirmacao`, dados de contacto e `source=vitrine`; vitrine regista antes do WhatsApp e inclui `*Ref. pedido:* #XXXXXXXX` na mensagem. Evoluções: WA Business API, BFF, etc.  
**Origem:** [backlog.md](../projeto/backlog.md) (IP-11), [MVP-03](../projeto/backlog.md).

## Situação actual

- O checkout da vitrine gera mensagem e abre **WhatsApp** (`wa.me`); **não** persiste `Order` na API.
- O painel lista pedidos criados por rotas autenticadas (ex. `POST /orders` no painel) ou fluxos que já gravem na BD.

## Objetivo de produto

Cada encomenda iniciada pelo cliente na vitrine deve **passar a existir** na lista do painel (com estado coerente com **DEC-14**), com possibilidade de reconciliação com a conversa WhatsApp.

## Caminhos possíveis (escolher na especificação)

| Opção | Descrição | Implicações |
|-------|-----------|-------------|
| **(a)** | `POST` público por loja (ex. rascunho / `aguardando_confirmacao`) com validação forte | Rate limit, anti-abuso (honeypot, CAPTCHA opcional), `store_slug` ou token público limitado; contrato OpenAPI e testes HTTP. |
| **(b)** | Integração **WhatsApp Business API** / webhook | Infra externa, assinaturas, idempotência ao criar/atualizar pedido. |
| **(c)** | Passo explícito na vitrine “Confirmar na loja” que grava **rascunho** antes do WA | UX extra; ainda pode combinar com (a) para persistência. |

## Próximos passos técnicos sugeridos

1. Fechar **modelo de dados mínimo** do pedido público (itens, totais, dados de contacto, `store_id`, origem `vitrine`).
2. Definir **transição inicial** DEC-14 (ex. `rascunho` → `aguardando_confirmacao` quando o lojista confirma no painel ou no WA).
3. API: rota pública versionada (`/api/v2/public/stores/{slug}/orders` ou equivalente), testes em `test_http_contracts_*` / `test_coverage_gaps.py`.
4. Painel: lista/filtro a mostrar pedidos com origem vitrine; detalhe alinhado ao fluxo existente.
5. Actualizar [backlog.md](../projeto/backlog.md) e [CHANGELOG-FASES.md](CHANGELOG-FASES.md) quando a primeira fatia estiver entregue.

## Relação com contas de cliente

A existência de **cliente registado** na vitrine (`customers`) pode facilitar identificação e histórico, mas **IP-11** pode ser entregue com ou sem login obrigatório — decisão de produto.
