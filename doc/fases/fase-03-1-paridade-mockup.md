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

- [ ] Menu lateral equivalente ao mockup (**sem** item Plataforma/DEC-15, ou com estado «em breve» desactivado).
- [ ] **Dashboard** com KPIs reais + **dois** gráficos mínimos (§6.1).
- [ ] **Financeiro** e **Relatórios** com pelo menos **um gráfico cada** além de tabelas.
- [ ] **Precificação** com ecrã dedicado e visualização de composição (mesmo que custos parciais no MVP).
- [ ] **Configuração da loja** com cobertura RF-CF acordada (checklist por sub-secção).
- [ ] **Produtos** com caminho claro para **imagens** (upload ou integração storage quando MA-03 estiver pronto).
- [ ] OpenAPI e testes actualizados para novos endpoints; **DEC-10** FieldHelp em campos críticos (alinhado a [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md)).

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
| **Status** | `planeada` |
| **Data de início** | — |
| **Notas** | Primeira versão deste documento: 2026-04-17 — mapa único mockup ↔ código ↔ RF. |

---

*Última revisão: 2026-04-17.*
