# Fase 3.2 — resumo do que foi implementado no repositório

**Marco:** Fase 3.2 (experiência lojista) entregue no código conforme [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md), [plano-implementacao-fase-3-2.md](plano-implementacao-fase-3-2.md) e extensão **analytics de vitrine** alinhada a [relatorios-analytics-roadmap.md](../projeto/relatorios-analytics-roadmap.md).

**Data de referência:** 2026-04-20.

---

## 1. Impressão de pedidos

| Área | Entrega |
|------|---------|
| **API** | `GET /api/v2/orders/{order_id}/print` → `OrderPrintOut` (loja, linhas, total, `print_config` efectivo). |
| **Perfil / loja** | `UserMeResponse.print_config`; merge de `config.print` em `PATCH /api/v2/me/store-settings` (junto com `general`). |
| **Painel** | Secção **Impressão de pedidos** em `/painel/configuracao`; no detalhe do pedido, `OrderPrintPanel` (pré-visualização, impressão via janela do sistema, Web USB + ESC/POS **experimental**). |
| **Código** | `app/api/handlers/order_print.py`, `app/schemas/print.py`, `OrderPrintEnvelope`. |
| **Testes** | `backend/tests/test_order_print_v2.py`. |

---

## 2. Site institucional (marketing)

| Área | Entrega |
|------|---------|
| **Landing** | `frontend/app/page.tsx` — hero, passos, funcionalidades, segmentos, preços “em definição”, FAQ, CTA; componentes em `frontend/components/marketing/`. |
| **Legal** | `/termos`, `/privacidade` — texto placeholder com aviso de revisão jurídica. |
| **SEO** | `metadata` na home; `NEXT_PUBLIC_SITE_URL` opcional para OG (ver `.env.example` e README raiz). |
| **E2E** | `frontend/e2e/smoke.spec.ts` — smoke para `/`, `/termos`, `/privacidade`. |

---

## 3. Analytics de vitrine (eventos próprios)

| Área | Entrega |
|------|---------|
| **Base de dados** | Tabela `vitrine_analytics_events` — migração Alembic `20260424_0011_vitrine_analytics_events`. |
| **Ingestão pública** | `POST /api/v2/public/stores/{store_slug}/analytics/events` — até 50 eventos por pedido; tipos: `page_view`, `product_view`, `add_to_cart`, `checkout_open`; rate limit `public_analytics_rate_limit_*` (chave `analytics\|IP\|store_id`). |
| **Painel** | `GET /api/v2/analytics/vitrine/summary?date_from=&date_to=` — sessões distintas, contagens por tipo, top produtos por `product_view`. UI: **`/painel/analytics-vitrine`** (menu Inteligência). |
| **Vitrine (cliente)** | `lib/vitrine/analytics.ts` — `session_id` anónimo em `localStorage`, fila com flush; `VitrineAnalyticsBridge` no layout `/loja/[slug]`; eventos no catálogo, página de produto e carrinho. |
| **Geo opcional** | País em dois caracteres se o edge enviar `CF-IPCountry` ou `X-Country-Code`. |
| **Testes** | `backend/tests/test_vitrine_analytics_v2.py`. |

**Fora deste MVP:** mapas detalhados, funil com `order_id`, integração SaaS (Plausible/GA) — ver §4–§5 do roadmap de analytics.

---

## 4. Contrato e decisões

| Artefacto | Notas |
|-----------|--------|
| **OpenAPI** | `doc/api/openapi.json` — regenerar com `make openapi-export` após alterações de rotas. |
| **DEC-21** | Estratégia de impressão documentada em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) (HTML + USB experimental). |
| **Índice de gaps** | [indice-documentacao-e-gaps.md](../projeto/indice-documentacao-e-gaps.md) actualizado. |

---

## 5. Como validar localmente

Na raiz do monorepo:

```bash
make migrate          # aplica migrações (inclui vitrine_analytics_events)
make test             # pytest (backend) + Vitest (frontend)
make openapi-export   # actualiza doc/api/openapi.json
```

**Backend:** `backend/tests/` — 179+ testes na última execução completa do `make test`.  
**Frontend:** Vitest em `frontend/__tests__/` (inclui `escpos.test.ts`).

---

## 6. Ligações

| Documento | Papel |
|-----------|--------|
| [CHANGELOG-FASES.md](CHANGELOG-FASES.md) | Entradas datadas (impressão, landing, analytics). |
| [TESTES-E-CI.md](TESTES-E-CI.md) | Comandos e referência a ficheiros de teste da Fase 3.2. |

---

## 7. Incrementos de UX do painel (Fase 3.2 — iteração de consistência)

**Objectivo:** alinhar comportamento e aparência do painel após o marco principal (impressão, landing, analytics), documentado também em [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) **§8** e em [painel-ux-layout-formularios-precificacao.md](../projeto/painel-ux-layout-formularios-precificacao.md).

| Área | Ficheiros / notas |
|------|-------------------|
| **Classes de botão** | `frontend/lib/painel-button-classes.ts` — `painelBtnPrimaryClass`, `Secondary`, `Danger`, `Link` (+ variantes `Compact` onde aplicável). Uso em páginas do painel, `PainelFormSaveBar`, `ImageUploadButton`, `OrderPrintPanel`, etc. |
| **Ajuda «?»** | `frontend/components/painel/FieldTip.tsx` — clique para abrir; `stopPropagation` em `pointerdown`/`click` (evita fechar/abrir `<details>` ao tocar no ícone); cálculo de posição (`computeTipBox`); portal em `document.body`; `FilterBarFieldTip` para alinhar o «?» aos filtros de período (Relatórios, Financeiro). |
| **Cabeçalho sticky global** | `PainelStickyHeading` — suporta `title` + `description` **ou** `children` (layouts com `PainelTitleHelp`, filtros, CTAs). Aplicado às rotas sob `/painel/*` (dashboard, vendas, operação, relatórios, conta, etc.), alinhado a [painel-ux-layout-formularios-precificacao.md](../projeto/painel-ux-layout-formularios-precificacao.md) §1. |
| **Configuração — ordem das secções** | `frontend/app/painel/configuracao/page.tsx` — **Identidade da loja** → **Redes sociais** → **Aparência da vitrine** (demais secções inalteradas). Dados: `social_networks` dentro de `theme.vitrine` como antes. |
| **Vitrine (doc)** | [vitrine-configuracao-aparencia.md](../projeto/vitrine-configuracao-aparencia.md) — referência à ordem no painel e ao contrato público. |

---

*Documento de arquivo técnico; critérios normativos completos continuam nos ficheiros de fase e roadmap citados.*
