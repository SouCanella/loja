# Vitrine pública — configuração de aparência e contrato público

Documento de **síntese** do que está implementado (painel do lojista → loja pública `/loja/[slug]`), alinhado a [paridade-mockup-vitrine.md](paridade-mockup-vitrine.md) e ao [backlog](backlog.md).

**Última actualização:** 2026-04-20.

Para a **paleta da plataforma (painel de administração)** e **gráficos**, ver [identidade-visual-e-paletas.md](identidade-visual-e-paletas.md).

---

## 1. Onde se configura

| Área | Rota no painel | Persistência |
|------|----------------|--------------|
| Identidade, redes sociais, tema, WhatsApp da vitrine, checkout | `/painel/configuracao` | `PATCH /api/v2/me/store-settings` → `stores.theme.vitrine` (merge profundo do objecto `vitrine`). No painel: **Identidade da loja** → **Redes sociais** → **Aparência da vitrine** (e demais secções). |

Campos relevantes em **`theme.vitrine`** (não exaustivo — ver código em `backend/app/api/handlers/me.py` e schemas):

| Campo | Tipo | Uso |
|-------|------|-----|
| `whatsapp` | string | Número/link da vitrine (também exposto em `GET /api/v2/me` como `vitrine_whatsapp`) |
| `tagline` | string | Slogan abaixo do nome na vitrine |
| `logo_image_url` | string (https) | **Logótipo** no hero; se vazio, usa-se `logo_emoji` da API pública |
| `hero_image_url` | string (https) | **Imagem de fundo** a ecrã inteiro (atrás do conteúdo) |
| `background_overlay_percent` | número 15–97 | Opacidade do **véu** na cor de fundo da app (`#faf6f2`) sobre a foto — maior = fundo mais discreto e texto mais legível |
| `primary_color` | hex | Identidade visual (classes Tailwind `loja-primary`) |
| `accent_color` | hex | Destaques, links, estados seleccionados (`loja-accent`, `loja-accentSoft` derivado) |
| `catalog_layout_default` | `grid` \| `list` | Layout inicial do catálogo |
| `order_greeting` | string | Texto opcional no início da mensagem de pedido (WhatsApp) |
| `hide_unavailable_products` | boolean | Ocultar produtos indisponíveis na listagem pública |
| `delivery_option_ids` | string[] | Modos de entrega mostrados no checkout |
| `payment_methods` | `{ id, label, enabled }[]` | Formas de pagamento no checkout |
| `social_networks` | `{ label, url, icon }[]` | Links no hero da vitrine (ícones por palavra-chave em `icon`, ex.: `instagram`); configurável no painel na secção **Redes sociais** (após **Identidade da loja**) |

**Limpar imagens:** o painel envia `null` em `logo_image_url` / `hero_image_url` quando o campo é apagado, para remover valores antigos no merge do tema.

---

## 2. API pública da loja (`GET /api/v1|v2/public/stores/{slug}`)

O handler partilhado (`app/api/handlers/public_catalog.py`) devolve `StorePublicOut` com, entre outros:

- Dados de negócio: `name`, `slug`, `tagline`, `logo_emoji`, `whatsapp`, `social_networks`, `catalog_layout_default`, `order_greeting`, `hide_unavailable_products`, `delivery_options`, `payment_methods`.
- **Aparência:** `primary_color`, `accent_color`, `hero_image_url`, `logo_image_url`, `background_overlay_percent`.
- Validação: URLs de imagem **só `https://`**. O overlay é limitado a **15–97** (omissão **88**).

A documentação OpenAPI canónica está em `doc/api/openapi.json` — regenerar com `make openapi-export` após alterar schemas.

---

## 3. Frontend (Next.js)

### 3.1 Dados e cache

- **`frontend/lib/vitrine/server-fetch.ts`:** `fetch` à API pública com **`cache: "no-store"`** para a vitrine não servir dados obsoletos da Data Cache do Next após o lojista guardar no painel.
- **`frontend/lib/vitrine/cache-store-public.ts`:** `getStorePublicCached` (React `cache`) para deduplicar a leitura da mesma loja entre **layout** e **página** no mesmo pedido.

### 3.2 Tema visual (cores)

- **`frontend/lib/vitrine/vitrine-theme-vars.ts`:** converte hex em canais RGB para Tailwind (`--loja-primary-rgb`, `--loja-accent-rgb`, soft derivado do accent).
- **`frontend/tailwind.config.ts`:** cores `loja.primary`, `loja.accent`, `loja.accentSoft` baseadas nessas variáveis (com opacidade `/10`, `/20`, etc.).

### 3.3 Fundo da página

- **`frontend/app/loja/[slug]/layout.tsx`:** camada fixa com `background-image` quando `hero_image_url` é válido; véu com cor de fundo e opacidade de acordo com `background_overlay_percent` (**`frontend/lib/vitrine/vitrine-background-overlay.ts`**). Com overlay mais baixo, aplica-se um **blur** muito ligeiro para suavizar texturas.

### 3.4 Logótipo no hero

- **`frontend/components/vitrine/CatalogView.tsx`:** se `logo_image_url` (https) existir, mostra-se `<img object-contain>`; caso contrário, o emoji `logo_emoji`.

### 3.5 Redes sociais no hero

- **`frontend/components/vitrine/catalog-hero.tsx`:** se `social_networks` tiver entradas com `url` válido, mostram-se botões com emoji conforme `icon` (ex.: texto que contenha `instagram`, `facebook`, `tiktok`, `youtube`; caso contrário ícone de link genérico).
- **Painel:** `frontend/app/painel/configuracao/page.tsx` — secção dedicada **Redes sociais**; lista editável (tipo + URL https + rótulo opcional); persiste em `theme.vitrine.social_networks` via `PATCH /api/v2/me/store-settings` (merge no objecto `vitrine`).

### 3.6 Uso das cores na UI

A cor **principal** aplica-se a navegação, títulos de secção, alternador grade/lista activo, pills de categoria, bordas suaves do hero, etc. A cor de **destaque** mantém-se para links de acção, badge do carrinho, estados seleccionados no checkout, etc.

---

## 4. O que **não** está integrado (referência futura)

- **Pedidos apenas via WhatsApp** não criam registo `orders` na base de dados: o cliente abre `wa.me` com texto pré-gerado. O painel só lista pedidos criados pela API autenticada (ex.: `/painel/pedidos/novo`). Evolução registada no backlog como **[IP-11](backlog.md)** (MVP-03 aponta para este item).

---

## 5. Ficheiros principais (rastreio)

| Camada | Ficheiros |
|--------|-----------|
| Backend | `app/schemas/public_catalog.py`, `app/api/handlers/public_catalog.py` |
| Frontend vitrine | `app/loja/[slug]/layout.tsx`, `app/loja/[slug]/page.tsx`, `components/vitrine/CatalogView.tsx`, `components/vitrine/catalog-hero.tsx`, `lib/vitrine/*.ts` |
| Painel | `app/painel/configuracao/page.tsx` |

---

## 6. Próximo passo operacional

Após alterações de API ou contrato, executar na raiz do monorepo: **`make openapi-export`** e incluir `doc/api/openapi.json` no commit quando fizer sentido.
