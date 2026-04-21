# Painel — layout de páginas, formulários longos, precificação e stock

**Objectivo:** documentar o comportamento de UX acordado para o painel (títulos, botão «Guardar»), a regra de negócio de **precificação com mão de obra**, e os campos de **validade** em insumos e receitas.

---

## 1. Título da página (sticky) — onde implementar

- O título principal de cada ecrã (`<h1>` + subtítulo) deve ficar **no componente da página**, não no menu lateral nem nos rótulos de grupo do drawer móvel.
- O componente reutilizável é **`PainelStickyHeading`** (`frontend/components/painel/PainelStickyHeading.tsx`):
  - Em **mobile**, usa `position: sticky` com `top-14` para ficar **abaixo** da barra fixa «Menu / Painel» do `PainelShell`.
  - Em **`md+`**, o offset extra não é necessário (`md:top-0`); o bloco mantém o fundo e a borda inferior como cabeçalho da coluna principal (`md:mb-6`).
  - Em **impressão**, `print:static` evita comportamento estranho do bloco fixo.
- Propriedades úteis:
  - **`title` + `description`**: título e subtítulo simples (texto ou JSX em `description`).
  - **`leading`**: ligação opcional (ex.: «← Receitas») acima do título.
  - **`children`**: bloco livre quando o cabeçalho inclui **`PainelTitleHelp`**, filtros de datas, botões ou outras linhas — **todas as rotas principais do painel** devem usar este padrão para o topo da página se comportar como em **Configuração da loja**.

**Não** colocar `sticky` nos títulos de secção do menu (`NavGroup` em `PainelShell.tsx`); isso gerava a sensação errada de «travar» o menu em vez do conteúdo.

### 1.1 Botões canónicos (painel)

- Ficheiro: **`frontend/lib/painel-button-classes.ts`** — exporta classes Tailwind para **primário** (CTA), **secundário** (contorno), **perigo** (remover / destrutivo) e **link** (+ linha, texto de acção), com variantes **compactas** para tabelas.
- Objectivo: o mesmo aspeto e estados (`hover`, `focus-visible`, `disabled`) em **Guardar**, **Remover**, **Exportar**, links de navegação secundária, etc.

### 1.2 Ajuda contextual («?»)

- Componente base: **`FieldTip`** (`frontend/components/painel/FieldTip.tsx`) — ícone «?» que abre texto num painel (portal); **`FieldTipBeside`** para rótulos de campo; **`PainelTitleHelp`** para títulos de página/secção; **`FilterBarFieldTip`** para o «?» alinhado a filtros de **De/Até** (Relatórios, Financeiro).
- Comportamento unificado: propagação interrompida dentro de **acordeões** (`<details>` / `<summary>`) para o clique não alternar a secção ao abrir a ajuda; posicionamento do painel com ajuste vertical; `z-index` elevado para ficar acima do overlay móvel do menu.

---

## 2. Botão «Guardar» sempre visível

- Formulários longos (ex.: **Configuração da loja**, **Nova / Editar receita**) usam **`PainelFormSaveBar`** (`frontend/components/painel/PainelFormSaveBar.tsx`):
  - Barra **fixa** no fundo do ecrã (`fixed bottom-0`), com `md:left-60` para alinhar à **coluna principal** (à direita da sidebar em desktop).
  - O `<form>` tem um **`id`**; o botão usa o atributo HTML **`form={id}`** para submeter mesmo estando **fora** do `<form>` no DOM.
  - O conteúdo do formulário leva **`padding-bottom`** generoso (`pb-28` / `pb-32`) para o último campo não ficar tapado pela barra.
  - Respeita **`safe-area-inset-bottom`** em dispositivos com barra de gestos.
- Impressão: a barra leva `print:hidden`.

---

## 3. Precificação (loja + receita)

### 3.1 Configuração da loja (`stores.config.pricing`)

| Chave | Significado |
|-------|-------------|
| `target_margin_percent` | Margem alvo % (padrão 30 se ausente). |
| `labor_rate_per_hour` | Custo de **mão de obra em R$ por hora** (opcional; `0` ou ausente = não contabilizar MO na sugestão). |

- Exposto em **`GET/PATCH /api/v1|v2/me`** e **`PATCH .../me/store-pricing`**.
- O painel edita margem e taxa horária na página **Configuração da loja** (secção de contacto / margem / MO).

### 3.2 Receita

- **`time_minutes`** (opcional): tempo do lote em minutos.
- **`output_shelf_life_days`** (opcional): dias até à validade do **produto acabado** após cada produção; usado na criação do lote de saída.

### 3.3 Cálculo do custo unitário sugerido

- **Matéria-prima (MP):** média ponderada dos custos em stock dos insumos da receita ÷ **rendimento** (`estimate_recipe_unit_cost`).
- **Mão de obra (MO) por unidade:** `(labor_rate_per_hour × (time_minutes / 60)) ÷ yield_quantity` (se taxa e tempo forem &gt; 0).
- **Custo total para margem:** `MP + MO` → **`estimated_unit_cost`** na API.
- **Preço sugerido:** `estimated_unit_cost × (1 + margem_efectiva / 100)` (margem da receita ou da loja).

Resposta **`RecipeOut`** inclui ainda `estimated_material_unit_cost` e `estimated_labor_unit_cost` para transparência na UI (Receitas, Precificação, gráfico de composição).

---

## 4. Insumos e lotes — validade

- Cada **lote** (`inventory_batches`) pode ter **`expiration_date`** (opcional).
- No painel **Insumos**, ao criar insumo com lote inicial, pode indicar-se **validade do lote**; enviado como `initial_batch.expiration_date` (ISO data).
- Consumo de stock segue **FEFO** (validade crescente; sem data por último), conforme serviços de produção / pedidos.

---

## 5. Referências de código

| Tema | Local |
|------|--------|
| Shell do painel (sidebar, header móvel) | `frontend/components/painel/PainelShell.tsx` |
| Título sticky + barra guardar | `PainelStickyHeading.tsx`, `PainelFormSaveBar.tsx` |
| Taxa MO + margem (serviço) | `backend/app/services/store_pricing.py` |
| Custo MP + MO | `backend/app/services/pricing.py`, `backend/app/api/handlers/recipes.py` |
| `PATCH` precificação loja | `backend/app/api/handlers/me.py` (`StorePricingPatch`) |
| Migração validade produto (receita) | `backend/alembic/versions/20260425_0012_recipe_output_shelf_life.py` |

---

## 6. Contrato OpenAPI

- Alterações de API: regenerar com `make openapi-export` na raiz do repositório → `doc/api/openapi.json`.
