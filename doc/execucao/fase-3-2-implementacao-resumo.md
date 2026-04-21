# Fase 3.2 — resumo do que foi implementado no repositório

**Marco:** Fase 3.2 (experiência lojista) entregue no código conforme [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md), [plano-implementacao-fase-3-2.md](plano-implementacao-fase-3-2.md) e extensão **analytics de vitrine** alinhada a [relatorios-analytics-roadmap.md](../projeto/relatorios-analytics-roadmap.md).

**Datas de referência:** 2026-04-20 (marco principal); 2026-04-21 (§8 — tabelas, layout, filtros, testes Vitest).

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
| **Landing** | `frontend/app/(public)/page.tsx` — hero, passos, funcionalidades, segmentos, preços “em definição”, FAQ, CTA; componentes em `frontend/components/marketing/`. |
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

**Backend:** `backend/tests/` — 225 testes na última execução completa do `make test`.  
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

## 8. Tabelas, layout, viewport e filtros (encerramento Fase 3.2 — 2026-04-21)

| Área | Ficheiros / notas |
|------|-------------------|
| **Tabelas** | `frontend/lib/painel-table-classes.ts` — classes canónicas para `<table>` do painel; aplicado às páginas com listagens tabulares. |
| **Largura de conteúdo** | `frontend/lib/painel-layout-classes.ts` — `painelPageContentWidthClass` e derivados para alinhar formulários e blocos principais. |
| **Altura / coluna** | `globals.css`, `app/layout.tsx`, `PainelStickyHeading`, `PainelShell` — `min-h-dvh` e estrutura de coluna para evitar saltos de layout. |
| **Filtros** | `frontend/lib/painel-filter-classes.ts` — barra (`painelFilterBarClass`), pesquisa, `select`, datas, checkbox; integrado nas páginas listadas em [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) §8. |
| **Testes frontend** | Vitest: `frontend/__tests__/painel-filter-classes.test.ts` (contrato das *strings* de classe); cobertura configurada em `vitest.config.ts` com `include: ["lib/**/*.ts"]`. |

Documentação de UX: [painel-ux-layout-formularios-precificacao.md](../projeto/painel-ux-layout-formularios-precificacao.md) §1.3.

---

## 9. Refactor painel — FR-01 a FR-06 (backlog técnico)

| FR | Entrega no código |
|----|-------------------|
| **FR-01** | Secções da configuração em `frontend/components/painel/config-loja/` (`ConfigIdentitySection`, `ConfigSocialSection`, `ConfigAppearanceSection`, `ConfigVitrineCheckoutSection`, `ConfigContactMarginSection`, `ConfigPrintSection`); `types.ts`, `constants.ts`. |
| **FR-02** | `frontend/components/painel/PainelDateRangeFields.tsx` — intervalo De/Até (`bare` \| `bar` \| `boxed`); usado em dashboard, financeiro, produção, relatório financeiro, analytics vitrine. |
| **FR-03** | `frontend/types/webusb.d.ts`; `OrderPrintPanel` com guarda se `navigator.usb` ausente. |
| **FR-04** | Clientes: `components/painel/clientes/*`, `lib/painel-clientes-helpers.ts`. Catálogo: `components/painel/catalogo/*`. |
| **FR-05** | Login/registo: `painelBtnPrimaryClass` + `painelAuthInputClass` (`lib/painel-surface-classes.ts`). |
| **FR-06** | `PanelCard`, `painelCardClass` / `painelCardSubtleClass`; uso em dashboard e formulários extraídos. |

Rastreio: [backlog.md](../projeto/backlog.md) — linhas **FR-01…FR-06** com estado **convertido**.

---

## 10. Engenharia (MA/DT) — 2026-04-21

| Tema | Entrega |
|------|---------|
| **MA-08** | `next@14.2.35`, `eslint-config-next@14.2.35`, `@playwright/test` actualizado; **Vitest 3** (`vitest`, `@vitest/coverage-v8`); `overrides.glob@^13` para fechar GHSA do `glob` transitivo; `npm audit` pode ainda listar **Next** até major — ver notas em [backlog.md](../projeto/backlog.md). |
| **MA-01** | `backend/tests/test_ma01_store_isolation.py` — pedidos/produtos v1 e envelope v2 não vazam entre lojas. |
| **MA-04** | Migração `20260426_0013_ma04_composite_indexes.py` + índices em modelos: `orders (store_id, created_at)`, `products (store_id, active, name)`, `stock_movements (store_id, created_at)`. |
| **MA-07** | Route groups Next: `app/(public)/` (landing, login, registo, termos, privacidade, vitrine `loja/`) e `app/(painel)/painel/` — URLs inalteradas. |
| **MA-09** | Vitest 3.x (alinha com ecossistema Vite mais recente; ver `frontend/vitest.config.ts`). |
| **DT-01** | [deploy-docker.md](deploy-docker.md); job **docker-images** em [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml). |
| **DT-02** | `RequestIdMiddleware` — resposta com cabeçalho `X-Request-Id`; testes em `test_request_id_middleware.py`. |
| **DT-03** | Cobertura de serviços mantida pelo gate existente; reforço de confiança multi-tenant via MA-01. |

**Fora deste incremento (rastreado no backlog):** **MA-05** (RLS Postgres); meta global de cobertura em todo o `app`; push de imagens e CD — ver [backlog.md](../projeto/backlog.md).

---

## 11. Demandas de produto IP-02 … IP-14 (2026-04-21)

| ID | Entrega no código / produto |
|----|-----------------------------|
| **IP-02** | Atalhos de datas **Hoje** / **Últimos 7 dias** em `/painel/producao` (filtro do histórico de corridas). |
| **IP-05** | `line_note` em itens; persistência API pública e painel; impressão e WhatsApp. Migração `20260427_0014` (entre outras alterações de modelo). |
| **IP-06** | `GET /api/v2/dashboard/customer-order-stats`; UI em `/painel/clientes` — tabela por e-mail (pedidos no período, último pedido). |
| **IP-07** | Texto de pedido / WhatsApp com blocos por linha e observações (`cart-context`, checkout, `painel-api` rascunho). |
| **IP-11** | Mantido **parcial** — ver [ip-11-pedidos-vitrine-painel.md](ip-11-pedidos-vitrine-painel.md) (MVP + notificações). |
| **IP-12** | `ShareStoreBar` no dashboard; `frontend/lib/painel-share-store.ts`. |
| **IP-13** | `buildMenuCatalogText` + acção no catálogo do painel. |
| **IP-14** | `track_inventory` + stock opcional; coluna **Stock** na tabela de produtos; serviços de stock/receita/produção alinhados. |
| **IP-03, IP-04, IP-08, IP-09, IP-10** | Não implementados; especificação e priorização no [backlog.md](../projeto/backlog.md). |

**Testes:** `backend/tests/test_ip_demands_product.py`; `frontend/__tests__/painel-menu-catalog-text.test.ts`, `frontend/__tests__/painel-share-store.test.ts`. Síntese normativa: [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) **§8.1**.

---

## 12. E2E Playwright, Tailwind `lib/` e regressão de cor do CTA (2026-04-21)

| Tema | Entrega |
|------|---------|
| **Tailwind JIT** | `frontend/tailwind.config.ts` — `content` inclui `./lib/**/*.{js,ts,jsx,tsx,mdx}` para gerar utilitários referenciados só em `lib/painel-button-classes.ts` (corrige botões primários «invisíveis» / branco sobre branco). |
| **PainelFormSaveBar** | Portal em `document.body`, `useLayoutEffect`, `z-[280]`; em **Configuração** existe também botão **Guardar alterações** no fim do formulário. |
| **Catálogo (painel)** | Carregamento com `Promise.allSettled` e mensagens separadas (produtos vs categorias). |
| **Playwright** | `frontend/e2e/helpers/auth.ts`, `painel-routes.ts`, `cta-contrast.ts` (`getComputedStyle` — fundo do botão ≠ branco); specs `painel-routes-smoke.spec.ts`, `painel-config-save.spec.ts`, `painel-regression.spec.ts`, `vitrine-loja-smoke.spec.ts`; `login-painel.spec.ts` alinhado ao heading **Dashboard**. |
| **Plano E2E** | [plano-e2e-mapeamento-implementacao.md](plano-e2e-mapeamento-implementacao.md); variáveis: `frontend/e2e/README.md` e [TESTES-E-CI.md](TESTES-E-CI.md) §4. |

---

## 13. Paginação do painel, barra Guardar alinhada, WhatsApp na pré-visualização (2026-04-21)

| Tema | Entrega |
|------|---------|
| **Paginação** | `frontend/lib/painel-pagination.ts`, `PainelPaginationBar.tsx`; listagens principais do painel com 20 linhas por página (cliente); ver [CHANGELOG-FASES.md](CHANGELOG-FASES.md) entrada **2026-04-21** e [painel-ux-layout-formularios-precificacao.md](../projeto/painel-ux-layout-formularios-precificacao.md) §1.4. |
| **PainelFormSaveBar** | `.painel-form-save-bar-inset` em `globals.css` — alinhamento ao contentor `max-w-[1600px]` + aside; §2 do mesmo documento UX. |
| **VitrinePreviewCard** | Botão **WhatsApp** (`wa.me/?text=`) em Dashboard e Configuração; `shareStoreMessage` / `whatsAppShareUrl`. |
| **Configuração** | Removido parágrafo duplicado sobre a barra Guardar; mantidos botão inline e `PainelFormSaveBar`. |

---

*Documento de arquivo técnico; critérios normativos completos continuam nos ficheiros de fase e roadmap citados.*
