# IP-11 — Pedidos iniciados na vitrine (WhatsApp) visíveis no painel

**Estado:** **MVP entregue (2026-04-17)** — `POST /api/v2/public/stores/{slug}/orders` cria `Order` com estado `aguardando_confirmacao`, dados de contacto e `source=vitrine`; vitrine regista antes do WhatsApp e inclui `*Ref. pedido:* #XXXXXXXX` na mensagem. Evoluções: WA Business API, BFF, etc.  
**Origem:** [backlog.md](../projeto/backlog.md) (IP-11), [MVP-03](../projeto/backlog.md).

## Situação actual (pós-MVP)

- O checkout da vitrine pode **registar** o pedido via `POST /api/v2/public/stores/{slug}/orders` antes do WhatsApp; a mensagem inclui referência `#XXXXXXXX`; o painel lista pedidos com `source=vitrine`.
- Evoluções possíveis: WhatsApp Business API, notificações ao lojista, endurecimento anti-abuso.

## Objetivo de produto

Cada encomenda iniciada pelo cliente na vitrine deve **passar a existir** na lista do painel (com estado coerente com **DEC-14**), com possibilidade de reconciliação com a conversa WhatsApp.

## Caminhos possíveis (escolher na especificação)

| Opção | Descrição | Implicações |
|-------|-----------|-------------|
| **(a)** | `POST` público por loja (ex. rascunho / `aguardando_confirmacao`) com validação forte | Rate limit, anti-abuso (honeypot, CAPTCHA opcional), `store_slug` ou token público limitado; contrato OpenAPI e testes HTTP. |
| **(b)** | Integração **WhatsApp Business API** / webhook | Infra externa, assinaturas, idempotência ao criar/atualizar pedido. |
| **(c)** | Passo explícito na vitrine “Confirmar na loja” que grava **rascunho** antes do WA | UX extra; ainda pode combinar com (a) para persistência. |

## Próximos passos técnicos sugeridos

1. ~~Fechar **modelo de dados mínimo** do pedido público~~ (feito).
2. Evoluções **DEC-14** / UX se quiserem matriz de transições mais restrita (hoje saltos flexíveis no MVP).
3. ~~API pública + testes~~ — rota e testes em `test_public_vitrine_orders.py` / cobertura.
4. ~~Painel: lista com filtro por origem~~ — `/painel/pedidos` com filtro **Origem** (Todas / Vitrine / Painel) e crachá «Vitrine» na linha; detalhe em `/painel/pedidos/[id]` com contacto e origem.
5. Evoluções produto: notificações ao lojista, WA Business API, CAPTCHA opcional no `POST` público.

## Relação com contas de cliente

A existência de **cliente registado** na vitrine (`customers`) pode facilitar identificação e histórico, mas **IP-11** pode ser entregue com ou sem login obrigatório — decisão de produto.

## Estrutura de código (manutenção)

| Área | Ficheiros principais |
|------|----------------------|
| API pedido público | `backend/app/services/public_vitrine_order.py`, `backend/app/api/v2/endpoints/public_vitrine_orders.py` |
| Validação de linhas (partilhada com painel) | `backend/app/services/order_line_items.py` (`get_product_for_order_line`) |
| UI catálogo / checkout | `frontend/components/vitrine/CatalogView.tsx`, `catalog-*.tsx`, `whatsapp-order-preview-modal.tsx` |
| Estado checkout + mensagem WhatsApp | `frontend/hooks/use-vitrine-checkout.ts` |
| Sessão cliente (fetch com refresh) | `frontend/lib/vitrine/vitrine-customer-fetch.ts`, `frontend/hooks/use-vitrine-customer-me.ts` |
