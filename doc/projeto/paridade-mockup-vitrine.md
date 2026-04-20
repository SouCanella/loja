# Paridade: vitrine implementada ↔ mockup HTML

Referência visual e normativa: [`doc/mockups/loja-vitrine-layout-sugestao.html`](../mockups/loja-vitrine-layout-sugestao.html), [`doc/normativos/requisitos-funcionais.md`](../normativos/requisitos-funcionais.md).

**Última verificação:** 2026-04-17 — inclui tema visual (cores, logo, fundo, véu), cache SSR, contrato público alargado, link **Conta** (auth cliente); síntese em [vitrine-configuracao-aparencia.md](vitrine-configuracao-aparencia.md).

## Mapa mockup → implementação

| Mockup / RF | Comportamento | Onde está |
|-------------|---------------|-----------|
| RF-CF-08 / RF-CA-09 | Grade \| lista; padrão configurável (`catalog_layout_default`) | `theme.vitrine.catalog_layout_default`; estado inicial na vitrine |
| RF-CA-11 | Secção «Em destaque & novidades»; fitas (destaque, novidade, mais vendido, sob encomenda) | `products.catalog_spotlight`, `catalog_sale_mode`; UI em cards e detalhe |
| RF-CA-05 | Disponível / sob encomenda / indisponível | `catalog_sale_mode`; overlay «Indisponível»; bloqueio de quantidade |
| RF-CA-04 | Ocultar indisponíveis na listagem | `theme.vitrine.hide_unavailable_products` → filtro em `public_list_products` |
| RF-CF-09 / RF-PE-08 | Modos de recebimento (retirada, loja, Uber, 99); texto extra no WhatsApp para parceiros | `delivery_option_ids` + `DeliveryOptionPublic` na API; `formatOrderText` + `deliveryOptionId` |
| RF-CF-04 | Redes sociais | `social_networks` no hero + secção dedicada |
| RF-CF-06 | Saudação configurável no pedido | `order_greeting` em `theme.vitrine` |
| Checkout | Formas de pagamento habilitáveis | `payment_methods` em `theme.vitrine` |
| Checkout | Registo do pedido no painel antes do WhatsApp | `POST /api/v2/public/stores/{slug}/orders` + referência `#XXXXXXXX` na mensagem |
| Pré-visualização WhatsApp | Modal antes de `wa.me` | Estado `waPreviewOpen` na vitrine |
| Secção «Entrega e retirada» | Texto explicativo Uber/99 | Bloco `#entrega-info` |
| Navegação | Âncoras Destaques, Cardápio, Entrega, Redes, Sobre | Links no header sticky |
| Conta (cliente vitrine) | Registo/login por loja | Link **Conta** no header → `/loja/[slug]/conta` (sessão separada do painel) |

## Diferenças aceites (UX)

- **Detalhe do produto:** mockup usava modal na mesma página; a app usa rota `/loja/[slug]/p/[productId]` com os mesmos dados e fitas — equivalente funcional.
- **Ícones de redes no hero:** mockup com SVG por rede; a app usa emoji/atalho simples por `icon` — evolução possível sem mudar contrato.

## Contrato API (vitrine pública)

- `ProductPublicOut`: inclui `catalog_spotlight`, `catalog_sale_mode`.
- `StorePublicOut`: inclui `catalog_layout_default`, `order_greeting`, `hide_unavailable_products`, `delivery_options[]`, `payment_methods[]`, **`primary_color`**, **`accent_color`**, **`hero_image_url`** (fundo), **`logo_image_url`** (logótipo no hero), **`background_overlay_percent`** (véu sobre o fundo, 15–97).

Fonte canónica dos esquemas: `doc/api/openapi.json` (gerar com `make openapi-export`).

## Aparência (painel → vitrine)

Configuração em **`/painel/configuracao`** (`theme.vitrine`): cores principais/destaque, URL do logótipo, URL do fundo, slider de suavização do fundo. Implementação técnica (Tailwind, variáveis CSS, layout com fundo, `fetch` sem cache na vitrine): ver **[vitrine-configuracao-aparencia.md](vitrine-configuracao-aparencia.md)**.

## Checklist ao alterar UI ou fluxo da vitrine (qualidade)

Use esta lista antes de abrir PR ou fechar tarefa; cruza com **DEC-12** ([qualidade-e-conformidade.md](qualidade-e-conformidade.md)).

1. **Mapa acima** — actualizar a tabela *Mockup / RF → implementação* se o comportamento ou o ficheiro mudarem.
2. **Contrato público** — campos novos em `StorePublicOut` / `ProductPublicOut`: `make openapi-export` e referência em `doc/api/openapi.json`.
3. **SSR** — `fetchStorePublic` / `server-fetch.ts`: erros não devem derrubar páginas sem necessidade; tema degradado é aceitável se a API falhar em dev.
4. **Testes** — smoke Playwright em `frontend/e2e/` para rotas públicas tocadas; Vitest se adicionar helpers em `lib/vitrine/` ou `lib/api-v2.ts`.
5. **Acessibilidade / mobile** — header sticky, modais e carrinho usáveis em viewport estreita (norma **DEC-11**).
