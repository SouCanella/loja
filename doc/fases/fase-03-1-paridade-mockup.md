# Fase 3.1 — Paridade com mockups (painel admin + vitrine)

**Referência visual:** [mockups/admin-painel-layout-sugestao.html](../mockups/admin-painel-layout-sugestao.html), [mockups/loja-vitrine-layout-sugestao.html](../mockups/loja-vitrine-layout-sugestao.html); índice e mapa RF ↔ blocos em [mockups/README.md](../mockups/README.md).  
**Norma:** [requisitos-funcionais.md](../normativos/requisitos-funcionais.md) (secção *Mapa do mockup admin*, RF-FI-*, RF-PR-*, RF-RL-*, RF-CF-*, etc.).  
**Relação:** esta fase **não substitui** a [Fase 3 — Gestão](fase-03-gestao.md) (já concluída nos critérios API/MVP); **estende** o produto até **alinhar UX, navegação e visualizações** ao nível dos mockups, com **gráficos** como prioridade explícita (**RF-FI-05** e tabelas do mapa em `requisitos-funcionais.md`).

---

## 1. Objetivo

Entregar um painel (e, onde aplicável, vitrine) **funcionalmente e visualmente próximo** dos HTML de referência: **shell** (sidebar, grupos de menu), **páginas por módulo**, **FieldHelp** onde o mockup marca **RF-AJ-01**, e **gráficos** (linhas, barras, donuts, matrizes) alimentados por **dados reais** da API — não placeholders estáticos.

---

## 2. O que fica fora do âmbito 3.1 (explícito)

| Item | Motivo |
|------|--------|
| **Super Admin / plataforma** (entrada no menu do mockup) | **DEC-15** — candidato a [Fase 4](fase-04-escala.md) ou backlog; não bloqueia paridade *tenant*. |
| **Substituir** a norma (`doc/normativos`) pelos mockups | Mockups são **referência de UX**; desvios exigem actualização de RF/RN. |

---

## 3. Estado actual vs mockup — resumo

| Dimensão | Actual (Next `/painel`) | Mockup admin |
|----------|-------------------------|--------------|
| Navegação | Barra horizontal: Pedidos, Receitas, Insumos, Definições, Relatório, Sessão | **Sidebar** com grupos: Visão geral, Loja & vitrine, Vendas, Operação, Inteligência, Qualidade, Conta, Plataforma |
| Home `/painel` | Resumo simples | **Dashboard** com KPIs + **gráficos** (receita diária + média 7d; barras por status) |
| Configuração loja | Parcial (`/painel/definicoes` + dados em `/me`) | **Configuração da loja** completa (accordion RF-CF-01…09) |
| Catálogo / categorias | Sem CRUD dedicado no painel (API existe) | **Produtos & catálogo** + **Categorias** com UI rica (fotos RF-CA-03) |
| Clientes | Não há rota | **Clientes** (lista / detalhe) — depende de modelo `customers` + RF-CL |
| Estoque | **Insumos** | **Estoque** (visão lotes/movimentos/alertas RF-ES) além de insumos |
| Produção | Fluxo a partir de **Receitas** | **Produção** como módulo próprio (histórico, filtros) |
| Precificação / Financeiro | Espalhado em Receitas + Definições + Relatório | **Precificação**, **Financeiro**, **Relatórios** como **três** ecrãs com gráficos dedicados |
| Avaliações | — | **Avaliações** (RF-CA-09/10, RN-025–027) — hoje desactivadas por política no normativo |
| Perfil | Só «Sessão» → login | **Perfil & segurança** (RF-AU, palavra-passe, etc.) |

---

## 4. Mapeamento detalhado — painel admin

Legenda: **API** = backend; **UI** = Next.js; **📊** = inclui gráfico principal no mockup.

| Módulo mockup | RF (principal) | Backend / dados | Frontend | Notas |
|---------------|----------------|-----------------|----------|--------|
| **Dashboard** 📊 | RF-FI-04, RF-FI-01, RF-FI-05 | Novo ou extensão: séries **receita por dia**, contagens **pedidos hoje/mês**, **por status** (mês), **estoque abaixo mínimo** (RF-ES-06), **clientes novos** (se existir entidade) | `/painel` ou `/painel/dashboard`; componentes de gráfico (ver §6) | Base do mockup; prioridade máxima. |
| **Configuração da loja** | RF-CF-01…09 | `PATCH /me`, `stores.theme`, slugs, políticas recebimento — avaliar gaps vs accordion | Página dedicada multi-secção | Alinhar com `GET /api/v1/public/stores/{slug}` e tema vitrine. |
| **Produtos & catálogo** | RF-CA-03, 05, 08, 11 | Já: produtos por loja; falta **upload** (MA-03 S3), galeria | Listagem + formulário | Dependência forte **DEC-04** / storage. |
| **Categorias** | RN-034 | Já: API categorias | CRUD UI | Relativamente independente. |
| **Pedidos** | RF-PE | Já: lista, novo, detalhe, estado | Enriquecer filtros / UX mockup | Parcialmente feito. |
| **Clientes** | RF-CL | Possível gap: tabela `customers`, ligação a pedidos | Módulo novo | Decisão de modelo e escopo (MVP vs 3.1 mínimo). |
| **Estoque** | RF-ES | Lotes, movimentos, alertas | Vista além de «Insumos» | Separar **insumo** vs **produto acabado** + movimentos. |
| **Receitas** | RN-Receita | Já | Ajustar a shell | Já existe. |
| **Produção** | RN / produção | `production_runs`, `POST /production` | Lista corridas, filtros, ligação a pedidos | Hoje centrado em «Produzir» na receita. |
| **Precificação** 📊 | RF-PR-01…03 | Custo + margem já calculados | **Calculadora** + composição % (mockup) | Pode reutilizar serviços `pricing.py`. |
| **Financeiro** 📊 | RF-FI-01…03 | Parcial em `reports/financial` | KPIs + **gráficos** (fat × lucro, donut custos) | Estender API se faltar séries/agregados. |
| **Relatórios** 📊 | RF-RL-01, RF-FI-06 | `by_product`, `by_category`, Pareto no relatório actual | **Matriz margem × volume**, quadrantes | Evoluir agregados e visualizações. |
| **Avaliações** | RF-CA-09/10 | Se activar: API + moderação | Módulo | Confirmar com RN-025–027. |
| **Perfil & segurança** | RF-AU | `PATCH` password, dados utilizador | Página conta | Refresh/cookies: ver DEC-16. |
| **Super Admin** | — | — | — | **Fora** (§2). |

---

## 5. Vitrine pública (`loja-vitrine-layout-sugestao.html`)

Objetivo: fechar gaps **RF-CF-08/09**, **RF-CA-11**, **RF-PE-08**, destaques, checkout alinhado ao mockup — sem duplicar a Fase 2 já entregue; esta secção lista **melhorias** até paridade visual/fluxo.

| Área mockup | Trabalho típico |
|-------------|-----------------|
| Hero, grelha, detalhe, carrinho, checkout | Já coberto em grande parte; rever **políticas visíveis**, modos recebimento, **FieldHelp** cliente |
| Gráficos | Menos relevantes na vitrine; foco **consistência** com config admin |

---

## 6. Gráficos — prioridade e entregáveis técnicos

Os mockups usam SVG estático; na app real convém biblioteca **leve e acessível** (candidatas: **Recharts**, **Visx**, **uPlot** — escolha formal na implementação, preferência por bundle controlado e SSR onde possível).

**Conjunto mínimo sugerido (Fase 3.1):**

1. **Dashboard:** série temporal **receita/dia** + linha **média móvel 7d**; barras **pedidos por status** (DEC-14).
2. **Financeiro:** evolução **faturamento vs lucro** (mensal ou intervalo); **donut** composição de custos (se dados disponíveis).
3. **Relatórios:** **Pareto** (já há base tabular); **scatter ou matriz** margem × volume (RF-FI-06).
4. **Precificação:** **gráfico de composição 100%** do preço (mockup).

**API:** onde não existir agregação, adicionar endpoints `GET /api/v…/reports/…` ou estender `financial` / novo `dashboard` **com período, timezone da loja, e testes** (seguir padrão v1/v2 e OpenAPI).

---

## 7. Critérios de aceite (macro)

- [x] Menu lateral equivalente ao mockup (**sem** item Plataforma/DEC-15, ou com estado «em breve» desactivado).
- [x] **Dashboard** com KPIs reais + **dois** gráficos mínimos (§6.1).
- [x] **Financeiro** e **Relatórios** com pelo menos **um gráfico cada** além de tabelas.
- [x] **Precificação** com ecrã dedicado e visualização de composição (gráfico donut custo vs margem bruta aprox.).
- [x] **Relatórios:** matriz **margem × volume** (dispersão por produto) — RF-FI-06.
- [ ] **Configuração da loja** com accordion formal RF-CF (secções colapsáveis); hoje página multi-secção com FieldTips.
- [x] **Produtos** com caminho claro para **imagens** (URL https no catálogo; upload S3 = MA-03).
- [x] **Perfil** — `/painel/conta` + `PATCH /api/v2/me/password`.
- [x] **Produção** — listagem de corridas `GET /api/v2/production-runs`.
- [x] OpenAPI e testes actualizados para novos endpoints; **FieldTip** em campos críticos (alinhado a DEC-10 / RF-AJ-01).

---

## 8. Dependências e ordem sugerida

1. **Dados para gráficos** (backend + contrato) antes ou em paralelo ao front.
2. **Shell** (layout sidebar) para não refazer páginas duas vezes.
3. **Dashboard** → **Financeiro/Relatórios** (reutilizar agregados).
4. **Config loja** + **catálogo/categorias**.
5. Módulos **Clientes**, **Avaliações**, **Produção** listagem — conforme capacidade e prioridade de negócio.

---

## 9. Documentação a manter sincronizada

- [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) — posição da 3.1 no fluxo.
- [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) — marcos ao fechar sub-lotes.
- [backlog.md](../projeto/backlog.md) — MVP-* parciais a actualizar quando 3.1 fechar itens.

---

## 10. Estado da execução

| Campo | Valor |
|-------|--------|
| **Status** | `concluída` (âmbito normativo 3.1; ver §2 fora de âmbito) |
| **Data de início** | 2026-04-19 |
| **Data de fecho** | 2026-04-22 |
| **Notas** | Inclui: **GET /api/v2/production-runs**, **PATCH /api/v2/me/password**, **Perfil** no menu, **Precificação** com composição (donut), **Relatórios** com dispersão margem × volume, **Produção** com tabela de corridas. **Avaliações** permanecem desactivadas (§11.6). **Accordion** RF-CF completo = melhoria opcional pós-3.1. Ver [CHANGELOG-FASES](../execucao/CHANGELOG-FASES.md). |

---

## 11. Decisões de arranque (defaults para fechar o plano e codificar)

Estas opções são **coerentes com o código actual** (Next 14, App Router, API v2 com envelope, sem modelo `customers` dedicado). Ajustar por ADR se algo divergir.

### 11.1 Biblioteca de gráficos (frontend)

| Decisão | **Recharts** (`recharts`) |
|---------|---------------------------|
| Porquê | API declarativa em React, cobre linha/área, barras, pie/donut, scatter; documentação estável; uso comum com Tailwind. |
| Como | Componentes de gráfico em **Client Components** (`'use client'`), dados via props; evitar SSR do canvas onde o Recharts exigir DOM. |
| Alternativa se peso for problema | **uPlot** + wrapper React (menos DX, bundle menor) — só trocar se medição o justificar. |

### 11.2 Contrato API — Dashboard (novo agregado)

| Decisão | Um endpoint dedicado sob **`/api/v2`** com envelope DEC-06. |
|---------|------------------------------------------------------------|
| Caminho sugerido | `GET /api/v2/dashboard/summary` |
| Query | `date_from`, `date_to` (ISO date), inclusivo; período máximo (ex. 366 dias) validado no backend. |
| Corpo `data` (campos mínimos) | `kpis`: pedidos hoje, pedidos no intervalo, ticket médio (receita ÷ pedidos elegíveis), contagens **estoque baixo** (insumos/produtos com regra já existente ou `min_quantity`); `revenue_by_day[]` `{ date, amount }` para gráfico; `orders_by_status[]` `{ status, count }` no intervalo; opcional `moving_avg_7d[]` calculado no **servidor** ou no cliente (definir um só lugar — preferência **servidor** para um único critério). |
| Regras de receita | Alinhar ao relatório financeiro: mesmos pedidos que contam como receita (excl. `rascunho` / `cancelado` — confirmar paridade com `financial_report.py`). |
| Testes | Pelo menos um teste de integração que fixa datas e totais esperados. |

*Nota:* `clientes novos` no mockup exige **identidade de cliente** nos dados; ver §11.4 — até lá, o KPI pode vir **omitido** ou como `null` com tooltip «em breve».

### 11.3 Fuso horário e «dia»

| Decisão | Usar **`America/Sao_Paulo`** como default da loja até existir campo explícito. |
|---------|--------------------------------------------------------------------------------|
| Onde | `stores.config.general.timezone` (JSON) ou chave equivalente; migração leve se necessário. |
| Agrupamento `revenue_by_day` | `date_trunc` em UTC convertido para o fuso da loja **ou** armazenar `business_date` — preferência: **uma função utilitária** partilhada com relatório financeiro para não divergir. |

### 11.4 Módulo «Clientes» (RF-CL)

| Decisão | **Duas sub-fases**, para não bloquear o resto da 3.1. |
|---------|--------------------------------------------------------|
| **3.1-a (imediato)** | Menu **Clientes** pode abrir página **«Pedidos como proxy»**: lista de pedidos com filtros (já existente) + texto de ajuda — **sem** entidade nova. KPI «clientes novos» **não** aparece no dashboard ou aparece desactivado. |
| **3.1-b (incremento)** | Migração: campos opcionais no pedido ou entidade mínima — **proposta mínima:** `orders.customer_name`, `orders.customer_phone` (nullable, índice por loja+telefone) preenchidos no checkout da vitrine e no «novo pedido» do painel; lista **Clientes** = agregação por telefone (ou email se acrescentarem depois). |
| O que **não** fazer na 3.1 | CRM completo, segmentação, marketing — ficam no [backlog](../projeto/backlog.md). |

### 11.5 Imagens e catálogo (RF-CA-03)

| Decisão | **Fase útil em duas camadas.** |
|---------|--------------------------------|
| **3.1 — rápido** | Campo **`image_url`** (ou lista JSON de URLs) em produto **editável no painel** (URLs absolutas https) — sem upload de ficheiro; permite mockup visual com imagens reais. |
| **3.1+ / MA-03** | Upload para **S3-compatível** (presigned POST) quando infra estiver definida; não bloquear gráficos e shell. |

### 11.6 Avaliações (menu mockup)

| Decisão | **Fora do primeiro incremento da 3.1.** |
|---------|------------------------------------------|
| UI | Item de menu **visível mas desactivado** + tooltip: «Avaliações — previsto em backlog (RN-025–027)». |
| Motivo | Requer modelo, moderação e API; desvio grande face ao ganho dos gráficos e dashboard. |

### 11.7 Ecrã «Precificação» (RF-PR)

| Decisão | **Composição a partir do que já existe**: custo estimado da receita (`estimated_unit_cost`), `effective_margin_percent`, `suggested_unit_price`, preço actual do produto — apresentados numa **calculadora** visual (tabela + um gráfico de composição **mock** ou % texto). |
|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Fora do âmbito 3.1 | **RF-PR-04** custos indirectos, rateio, histórico de preço — backlog. |

### 11.8 Super Admin (DEC-15)

| Decisão | **Inalterado:** não implementar; entrada no menu **omitida** ou igual às avaliações (desactivada + legenda DEC-15). |

### 11.9 Ordem de implementação sugerida (para sequência de PRs)

1. Dependências: `npm install recharts` (e tipos se necessário).  
2. **API** `GET /api/v2/dashboard/summary` + testes.  
3. **Layout** painel: sidebar + rotas espelhando o mockup (podem ser páginas vazias com título).  
4. **Dashboard** página com KPIs + 2 gráficos (linha receita, barras status).  
5. **Financeiro** / **Relatórios**: reutilizar dados existentes, acrescentar gráficos onde já há agregados.  
6. **Precificação** ecrã com dados de receitas/produtos.  
7. **Config loja** / **catálogo** / URLs de imagem.  
8. **Clientes** 3.1-a; depois migração 3.1-b se prioridade de negócio.  

---

*Última revisão: 2026-04-22 — fecho do âmbito 3.1 (perfil, produção listagem, gráficos precificação/relatório, API).*
