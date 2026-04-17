# Mockups HTML (referência de UX)

Protótipos **estáticos e navegáveis** usados para alinhar interface, fluxos e rastreio com os requisitos (**RF-***) antes ou em paralelo à implementação. Não substituem a especificação normativa em [`doc/normativos/`](../normativos/); servem de **material de apoio** visual e de demo.

## Ficheiros

| Ficheiro | Público-alvo | Conteúdo (resumo) |
|----------|----------------|-------------------|
| [loja-vitrine-layout-sugestao.html](loja-vitrine-layout-sugestao.html) | Cliente final da loja | Home, catálogo, detalhe de produto, carrinho, checkout com modos de recebimento (**RF-CF-09**, **RF-PE-08**), elementos de destaque (**RF-CA-11**), etc. |
| [admin-painel-layout-sugestao.html](admin-painel-layout-sugestao.html) | Staff da loja (tenant) | Login simulado, shell com navegação por âncoras, secções por módulo (configuração, catálogo, pedidos, clientes, estoque, receitas, produção, precificação, financeiro, relatórios, …) |

## Como abrir

Abra o ficheiro `.html` diretamente no navegador ou sirva a pasta com um servidor HTTP simples, por exemplo:

```bash
cd doc/mockups && python -m http.server 8080
```

Depois aceda a `http://localhost:8080/admin-painel-layout-sugestao.html` (ou o nome do ficheiro pretendido).

## Painel admin — o que está coberto no mockup

| Área | Destaques | RFs (referência) |
|------|-----------|------------------|
| **Dashboard** | KPIs; gráfico de faturamento diário + média móvel; pedidos por status (**DEC-14**) | RF-FI-04, RF-FI-01, RF-FI-05; mapa em `<details>` no próprio ecrã |
| **Configuração da loja** | Accordion por grupo (identidade, tema, vitrine, recebimento, …) | RF-CF-01…09 |
| **Produtos & catálogo** | Tabela com coluna **Foto** (miniatura); formulário com **importação de imagens**, capa, recomendação de resolução para detalhe na vitrine | RF-CA-03, RF-CA-05, RF-CA-08, RF-CA-11; **RF-AJ-01** nos tooltips |
| **Pedidos / Clientes / Estoque / …** | Layout tipo CRUD (listagem + formulário ou blocos) alinhado aos RF correspondentes | RF-PE, RF-CL, RF-ES, … |
| **Precificação** | Calculadora + gráfico de composição 100% do preço | RF-PR-01…02 |
| **Financeiro** | KPIs; gráficos agrupados em secções; consumo de insumos (valor); mapa RF em `<details>` | RF-FI-01…03, RF-FI-05; ver tabela abaixo |
| **Relatórios** | Pareto por receita; margem por categoria; matriz margem × volume | RF-RL-01, RF-FI-06 |

### Gráficos e inteligência (painel admin)

As visualizações estão **organizadas por secções** (`.chart-section`), com tags RF, bloco textual **«Dados / Cálculo»** (`.chart-meta`) e ícones de ajuda (**RF-AJ-01**). O mapa canónico **gráfico ↔ RF ↔ dados** está em [`doc/normativos/requisitos-funcionais.md`](../normativos/requisitos-funcionais.md), na secção **RF-Financeiro e dashboard**, tabela *«Mapa do mockup admin»*.

### Catálogo admin — imagens

- **Listagem:** miniatura pequena na tabela; o texto do mockup explica que é **variante** gerada a partir do mesmo upload usado na vitrine.
- **Formulário:** zona de ficheiros (`multiple`, formatos típicos), ordem/capa, recomendação **≥ 1200 px** no maior lado para qualidade no **detalhe do produto** (zoom / hero), alinhado a **RF-CA-03**.
- As fotos de exemplo na listagem usam serviço externo (**picsum.photos**); sem rede, as imagens podem não carregar — apenas demo.

## Vitrine — nota cruzada

O mockup da vitrine ilustra fluxo de compra e políticas visíveis ao cliente. Detalhe de produto e imagens devem ser **coerentes** com o que o admin configura (mesma ideia de capa + galeria em boa resolução).

## Documentação relacionada

| Documento | Ligação aos mockups |
|-----------|---------------------|
| [`requisitos-funcionais.md`](../normativos/requisitos-funcionais.md) | Tabela do mapa admin (gráficos); referências inline a `admin-painel` e `loja-vitrine` |
| [`requisitos-funcionais.md`](../normativos/requisitos-funcionais.md) **RF-AR-01** | Rota `painel` ↔ mockup admin |
| [`documento_enterprise.md`](../documento_enterprise.md) | Visão de produto e módulos (contexto) |

---

*Última revisão deste README: alinhada ao conteúdo dos mockups (painel com gráficos por RF, catálogo com fotos e import de imagens).*
