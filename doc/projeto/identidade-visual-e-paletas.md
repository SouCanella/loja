# Identidade visual, paletas e bases para arte / logótipo

Documento de referência para **design de marca**, **logótipo**, **ilustração** e **UI** do produto. Descreve o que está **implementado no código** (Tailwind, variáveis CSS, gráficos) e separa **identidade da plataforma (painel)** da **identidade por loja (vitrine pública)**.

**Última actualização:** 2026-04-22 (menu lateral alinhado ao CTA; dicas `FieldTip` com fundo opaco).

---

## 1. Dois contextos visuais

| Contexto | Quem define a cor | Onde aparece |
|----------|-------------------|--------------|
| **Plataforma (painel de administração)** | Produto — paleta fixa no código | `/painel/*`, login do lojista |
| **Loja pública (vitrine)** | Cada loja — `primary_color` / `accent_color` na configuração | `/loja/[slug]`, checkout |

Para a **vitrine**, o lojista pode sobrepor cores via API/tema; os valores por defeito e o mecanismo estão em [vitrine-configuracao-aparencia.md](vitrine-configuracao-aparencia.md).

Para **marca da plataforma** (site de marketing, login, documentação, ícone da app do painel), usar a **paleta painel** da secção 2 como base — é a que o utilizador vê ao gerir o negócio.

---

## 2. Paleta do painel (plataforma / admin)

Definida em `frontend/tailwind.config.ts` no objecto `colors.painel`. Classes Tailwind: `bg-painel-primary`, `text-painel-sidebar-muted`, etc.

### 2.1 Cores de marca (primária e secundária)

| Token Tailwind | Hex | Uso recomendado |
|----------------|-----|-----------------|
| `painel-primary` | **#8A05BE** | Marca, links, item activo no menu, ênfase em tabelas (não obrigatório em botões sólidos) |
| `painel-primary-hover` | #7311a3 | Hover quando se usa `painel-primary` como fundo |
| `painel-cta` | **#5c0d73** | **Botões preenchidos** (Guardar, Novo pedido, Entrar, etc.) — roxo mais escuro para **contraste com texto branco** (WCAG) |
| `painel-cta-hover` | #4a0a5e | Hover dos botões CTA |
| `painel-primary-strong` | #4a0d5c | Texto escuro sobre fundo claro, títulos de ênfase |
| `painel-soft` | #f4e9fb | Fundos de cartões / destaques suaves |
| `painel-soft-hover` | #ebd4f7 | Hover em superfícies suaves |
| `painel-border` | #e4c7f2 | Bordas decorativas na linha da marca |
| `painel-secondary` | **#FFDE21** | Botões secundários, badges de destaque (com texto escuro) |
| `painel-secondary-hover` | #e6c81e | Hover do secundário |
| `painel-secondary-soft` | #fff9d6 | Fundos amarelos muito leves |
| `painel-on-secondary` | #1a1512 | Texto sobre amarelo (contraste) |

**Direcção para arte / logótipo:** o par **roxo #8A05BE + amarelo #FFDE21** é o eixo reconhecível do painel. O roxo transmite produto digital / gestão; o amarelo funciona como **acento** (não como fundo dominante em grandes áreas). Para logótipo, considerar versões **monocromáticas** (roxo escuro ou preto suave) e **sobre fundo escuro** (texto claro + detalhe em amarelo opcional).

### 2.2 Menu lateral (shell do painel)

Gradiente em **roxo escuro** próximo do tom dos botões CTA (`#5c0d73`), mais claro que o preto-roxo inicial — base **`#301a3e`**, transição para **`#24142f`**, topo **`#452252`**. Cartões com **primary** translúcido, rótulos **lavanda** (`nav-label`), item activo **#8A05BE** com **acento amarelo** (#FFDE21) em sombra interior; links inactivos em **violeta claro**.

| Token | Hex | Uso |
|-------|-----|-----|
| `painel-sidebar-bg` (referência) | **#301a3e** | Fallback `SIDEBAR_SOLID` + gradiente `SIDEBAR_GRADIENT` em `PainelShell` |
| `painel-sidebar-border` | **#4a3560** | Borda exterior do painel |
| `painel-nav-label` | #c9b3dd | Títulos de grupo e subtítulo “Gestão da loja” |
| `painel-sidebar-text` | #f4f1f8 | (legado / outros usos) |
| `painel-sidebar-muted` | #9488a3 | (legado / outros usos) |

Ficheiro principal: `frontend/components/painel/PainelShell.tsx`.

### 2.3 Dicas contextuais (`FieldTip`)

Componente **`frontend/components/painel/FieldTip.tsx`:** botão «?» abre tooltip em portal (fixo ao ecrã). Estilo de marca: **borda roxa** (`border-painel-primary`), **barra amarela** à esquerda (`border-painel-secondary`), **fundo branco opaco** — evita transparências que prejudiquem a leitura sobre o formulário.

### 2.4 Outras páginas do painel (referência rápida)

- **Clientes** (`/painel/clientes`): filtro local por **nome ou telefone** (texto; telefone com ≥2 dígitos após normalização).
- **Relatórios** (`/painel/relatorio`): botão «Atualizar» usa o mesmo CTA roxo (`painel-cta`) que o resto do painel.

---

## 3. Gráficos do painel (dados)

Constantes centralizadas em `frontend/lib/painel-chart-colors.ts`, usadas por `DashboardCharts.tsx` e `FinancialReportCharts.tsx`.

### 3.1 Núcleo `PAINEL_CHART`

| Chave | Hex | Função |
|-------|-----|--------|
| `primary` | #8A05BE | Barras principais, série dominante |
| `primaryDeep` | #6D28D9 | Variação mais escura (séries alternadas, se necessário) |
| `primarySoft` | #B565D8 | Tons mais claros |
| `line` | #6B5575 | Linhas de tendência / média móvel (discreto sobre fundo claro) |
| `secondary` | #FFDE21 | Uso pontual (marca secundária) |
| `secondarySoft` | #D4BC3A | Ouro mais suave para áreas grandes ou “sucesso” sem saturar |
| `grid` | #e7e5e4 | Grelha dos gráficos |

### 3.2 Sequência para pizza / múltiplas séries — `PAINEL_CHART_SEQUENCE`

Ordem cíclica (índice `i % length`):

1. #8A05BE  
2. #9333EA  
3. #A855D7  
4. #C084FC  
5. #B8950C  
6. #D4BC3A  
7. #6D28D9  

Roxos coerentes + toques de ouro; evita-se arco-íris genérico.

### 3.3 Estados de pedido em gráficos — `PAINEL_ORDER_STATUS_COLORS`

Mapeamento por `status` da API (fluxo aproximado do pedido → concluído):

| Estado (chave) | Hex | Nota |
|----------------|-----|------|
| `aguardando_confirmacao` | #D8B4E8 | Lavanda claro |
| `confirmado` | #C084FC | |
| `em_producao` | #A855D7 | |
| `pronto` | #9333EA | |
| `saiu_entrega` | #8A05BE | Marca primária |
| `entregue` | #D4BC3A | “Sucesso” em ouro suave (ligado ao secundário sem amarelo puro em barra larga) |
| `cancelado` | #A8A29E | Neutro |
| `rascunho` | #D6D3D1 | Neutro claro |

---

## 4. Vitrine pública (`loja.*` — por loja)

Definido em `frontend/tailwind.config.ts` e sobrescrito por **variáveis CSS** geradas a partir de `primary_color` e `accent_color` (ver `frontend/lib/vitrine/vitrine-theme-vars.ts`).

### 4.1 Superfícies fixas (não por loja)

| Token | Hex | Uso |
|-------|-----|-----|
| `loja-bg` | #faf6f2 | Fundo geral da página |
| `loja-surface` | #ffffff | Cartões / superfícies |
| `loja-ink` | #1a1512 | Texto principal |
| `loja-muted` | #5c4d42 | Texto secundário |
| `loja-whatsapp` | #128c7e | Botões / CTAs WhatsApp (identidade Meta, não misturar com marca plataforma) |

### 4.2 Cores dinâmicas (tema da loja)

- **`loja-primary`:** `rgb(var(--loja-primary-rgb, …))` — por defeito no Tailwind **15 118 110** (teal), substituível pelo lojista.
- **`loja-accent`** / **`loja-accentSoft`:** idem com `--loja-accent-rgb` (por defeito acento terroso).

Ou seja: a **marca visual da loja do cliente** é independente da paleta **painel**; o documento de configuração detalhada é [vitrine-configuracao-aparencia.md](vitrine-configuracao-aparencia.md).

---

## 5. Tipografia e sombras (frontend)

| Recurso | Configuração | Ficheiro |
|---------|--------------|----------|
| Sans | `font-sans` → DM Sans (`--font-dm-sans`) + fallbacks | `tailwind.config.ts` |
| Display | `font-display` → Fraunces + Georgia | idem |
| Sombras loja | `shadow-loja`, `shadow-loja-bar` | idem |

---

## 6. Onde alterar no código (checklist técnico)

| Alteração | Onde |
|-----------|------|
| Cores do painel / menu | `frontend/tailwind.config.ts` → `painel.*` |
| Gráficos (hex duplicados) | Preferir editar `frontend/lib/painel-chart-colors.ts` e componentes que o importam |
| Tema vitrine por loja | `vitrine-theme-vars.ts`, `tailwind.config.ts` (`loja.*`), handlers de `store-settings` |
| Shell navegação | `PainelShell.tsx` |
| Dicas «?» em formulários | `FieldTip.tsx` |

Após mudar tokens Tailwind, validar contraste (WCAG) em botões **secundários** (`on-secondary` sobre amarelo) e texto sobre o fundo do menu lateral (`painel-sidebar-bg` / gradiente em `PainelShell`).

---

## 7. Notas para evolução (arte, logo, manual de marca)

1. **Proporção roxo : amarelo:** no UI actual, o amarelo é **secundário** (chamadas pontuais); um logótipo pode equilibrar os dois sem usar 50/50 em área.
2. **Sidebar escura:** qualquer ícone ou marca reduzida no canto do painel deve funcionar sobre o fundo **roxo escuro** actual (**~#24142f–#452252** no gradiente) ou em branco/#f4f1f8.
3. **Vitrine:** o logótipo da **plataforma** não deve ser confundido com o **logótipo uploadado pela loja** (hero da vitrine); são duas camadas de identidade.
4. **Favicon / PWA:** derivar do roxo **#8A05BE** ou monograma sobre fundo **#151016** mantém coerência com o painel.
5. **Documentação viva:** quando fecharem cores definitivas de marca (com nomes Pantone/HEX oficiais), actualizar **este ficheiro** e `tailwind.config.ts` para manter uma única fonte de verdade.

---

## 8. Documentos relacionados

- [vitrine-configuracao-aparencia.md](vitrine-configuracao-aparencia.md) — tema público, API, variáveis.
- [paridade-mockup-vitrine.md](paridade-mockup-vitrine.md) — alinhamento UX vitrine.
- [README.md](../README.md) — índice geral de `doc/`.
