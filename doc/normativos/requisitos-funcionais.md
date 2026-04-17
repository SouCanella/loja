# Requisitos funcionais

**Origem:** [inicio_planejamento.txt](../../inicio_planejamento.txt) (Planejamentos 1–5), alinhado a [documento_enterprise.md](../documento_enterprise.md).  
**Regras invariantes:** [regras-negocio.md](regras-negocio.md).  
**Decisões:** [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) (DEC-14 … DEC-20).

Legenda de prioridade sugerida: **M** MVP núcleo, **E** evolução/backlog.

---

## RF-Plataforma e Super Admin

Escopo **DEC-15:** fora do MVP núcleo; implementação típica na Fase 4 ou backlog.

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-PL-01 | Gestão de lojas cadastradas (listar, ativar/desativar) pelo operador da plataforma | E | P1 — Super Admin |
| RF-PL-02 | Visão de métricas globais da plataforma | E | P1 |
| RF-PL-03 | Gestão de plano/assinatura/suporte (comercial) | E | P1 |
| RF-PL-04 | Área `(platform) admin` no front separada da loja | E | P2 estrutura pastas |

---

## RF-Auth e sessão

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-AU-01 | Login e-mail/senha para staff loja | M | P1 módulo auth |
| RF-AU-02 | Recuperação de senha | M | P1 |
| RF-AU-03 | Login/cadastro cliente no contexto da loja (slug) | M | P1 |
| RF-AU-04 | Controle de perfil e autorização por papel + tenant | M | P1–P2 |
| RF-AU-05 | Access JWT + refresh token (**DEC-16**); renovação segura no cliente | M | DEC-16 |

---

## RF-Configuração da loja (admin)

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-CF-01 | Cadastrar nome, slogan, descrição, logo, banner, imagem fundo opcional | M | P1 §2 |
| RF-CF-02 | Cores primária/secundária/destaque; logo clara/escura opcional | M | P1 |
| RF-CF-03 | WhatsApp, endereço, horários, texto institucional, mensagem padrão de pedido | M | P1 |
| RF-CF-04 | Links de redes sociais | E | P1 |
| RF-CF-05 | Pré-visualização de tema e fallbacks de imagem | E | P1 |
| RF-CF-06 | Mensagem WhatsApp configurável (template enriquecido: nome cliente, itens, total) | E | P1 sugestões |
| RF-CF-07 | **Avaliações por produto** (nota + comentário): funcionalidade **desligada no padrão inicial**; admin da loja pode **ativar** | E | §7–§8 |
| RF-CF-08 | **Layout da vitrine:** **grade (cards)** ou **lista em linhas** (um produto abaixo do outro); configurável pelo admin; padrão sugerido: grade | E | §7 |
| RF-CF-09 | Configurar quais **modos de recebimento** a vitrine oferece (ex.: retirada, entrega pela loja, **apps de entrega parceiros** como Uber Entregas / 99); labels e visibilidade por opção | E | [mockup vitrine](../mockups/loja-vitrine-layout-sugestao.html) |

---

## RF-Catálogo público (vitrine)

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-CA-01 | Home, catálogo, detalhe produto, carrinho | M | P1 §3 |
| RF-CA-02 | Filtros (categoria, busca); **destaques** (ver RF-CA-11) | M/E | P1 |
| RF-CA-03 | Indicar disponibilidade e preço; imagens otimizadas | M | P1 |
| RF-CA-04 | Produto sem estoque: ocultar ou indisponível (config loja) | M | P1 |
| RF-CA-05 | Status: disponível / sob encomenda / indisponível | E | P1 |
| RF-CA-06 | Variações, peso/volume opcional | E | P1 |
| RF-CA-07 | URL loja: **`/loja/[slug]`** no mesmo domínio (**DEC-19**); subdomínio evolução | M | DEC-19 |
| RF-CA-08 | Entidade `categories` + FK em produtos; filtros no catálogo (**DEC-20**) | M | Fase 2 |
| RF-CA-09 | Renderizar o catálogo conforme **layout** escolhido (**grade** ou **lista**); mesmos dados e CTAs em ambos | E | RF-CF-08 |
| RF-CA-10 | **Avaliações** (média, número de reviews, trechos) só aparecem na vitrine se a loja tiver avaliações **ativas** | E | RF-AV |
| RF-CA-11 | **Destaques:** admin pode marcar produtos com **rótulos** (ex.: “Em destaque”, “Novidade”, “Mais vendido” — conjunto configurável); vitrine pode exibir **secção** (ex.: carrossel ou faixa) e/ou **badge** no card | E | IP-01 → RF |

---

## RF-Avaliações e moderação (por loja)

Funcionalidade **opcional**; **inativa no padrão inicial** (RF-CF-07). Isolamento por `store_id`.

| ID | Requisito | Pri | Ref. |
|----|-----------|-----|------|
| RF-AV-01 | Enquanto avaliações estiverem **desativadas** (inclui o **padrão inicial**): sem envio, listagem nem UI de review na vitrine | E | RN-025 |
| RF-AV-02 | Com avaliações **ativas**: cliente pode enviar **nota** (ex.: 1–5) e **comentário** por produto, conforme regra de autenticação definida na implementação | E | — |
| RF-AV-03 | Submissões entram como **pendentes de moderação**; não são públicas até decisão do admin | E | RN-026 |
| RF-AV-04 | **Admin** da loja: lista de pendentes; ações **aprovar** ou **rejeitar**; opcional motivo interno na rejeição | E | §8 |
| RF-AV-05 | Na vitrine: exibir apenas comentários **aprovados**; opcional média agregada por produto | E | — |

---

## RF-Clientes

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-CL-01 | CRUD/listagem; busca nome/telefone/e-mail | M | P1 §4 |
| RF-CL-02 | Campos: nome, telefone, WhatsApp, e-mail, nascimento opcional, endereço completo | M | P1 |
| RF-CL-03 | Observações internas; histórico de pedidos por cliente | M | P1 |
| RF-CL-04 | Tags (VIP, atacado, revendedor, inadimplente); aniversário do mês | E | P1 extras |

---

## RF-Pedidos

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-PE-01 | Carrinho → dados básicos → montar mensagem → abrir WhatsApp → registrar pedido | M | P1 §5 |
| RF-PE-02 | Status e transições conforme **DEC-14** / [regras-negocio.md](regras-negocio.md) | M | DEC-14 |
| RF-PE-03 | Listar/filtrar pedidos; edição e cancelamento conforme regras | M | P1 |
| RF-PE-04 | Pedido manual: cliente, itens, quantidades, desconto, observação, origem | M | P1 |
| RF-PE-05 | Registrar entrega/retirada | E | P1 |
| RF-PE-06 | Reserva de estoque + timeout + idempotência | M | Enterprise §12 |
| RF-PE-07 | Impressão pedido físico; pagamento integrado | E | P1 futuro |
| RF-PE-08 | Checkout na vitrine: cliente escolhe **recebimento** entre opções habilitadas (**RF-CF-09**); para entrega via **app parceiro** sem integração API, **combinar** endereço, link do app, taxa e horário via **WhatsApp** na mensagem do pedido | E | RF-CF-09; mockup |

---

## RF-Estoque

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-ES-01 | CRUD insumos (mestre) com unidade, mínimo, controla validade | M | P3 |
| RF-ES-02 | Registro de entradas/lotes: quantidade, custos, fornecedor, datas, lote opcional | M | P3 |
| RF-ES-03 | Tela de histórico do insumo: entradas, saldos por lote, consumo, médias | E | P3 |
| RF-ES-04 | CRUD produto final; estoque atual e mínimo | M | P1 §6 |
| RF-ES-05 | Movimentações: entrada manual, ajuste, consumo receita, baixa venda, perda | M | P1 |
| RF-ES-06 | Alerta estoque baixo | E | P1 |

---

## RF-Receitas e produção

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-RE-01 | CRUD receitas; vincular produto final; rendimento; ingredientes | M | P1 §7 |
| RF-RE-02 | Executar produção: baixa insumos, entrada produto final | M | P1 |
| RF-RE-03 | Opcionais: tempo produção, perda %, custo indireto adicional, observação processo | M/E | P4 |
| RF-RE-04 | Ficha técnica: custo receita, custo/unidade, margem sugerida (visão) | E | P1 §7 |

---

## RF-Precificação e custos indiretos

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-PR-01 | Cálculo assistido: insumos, embalagem, indiretos, mão de obra, margem/markup | M | P1 §8, P4 |
| RF-PR-02 | Modo automático + modo ajuste manual com indicadores em tempo real | M | P4 |
| RF-PR-03 | Calculadora/simulador **sem** obrigar gravar preço oficial | M | P4 |
| RF-PR-04 | Cadastro custos indiretos loja: nome, categoria, valor, periodicidade, rateio | M/E | P4 |
| RF-PR-05 | Arredondamento comercial; histórico de preço | E | P1 |

---

## RF-Financeiro e dashboard

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-FI-01 | Visão faturamento, custo vendido, lucro bruto, ticket médio, pedidos por período | M | P1 §9 |
| RF-FI-02 | Total de perdas no período; lucro ajustado após perdas | M | P4 |
| RF-FI-03 | Comparativos mês/mês, ano/ano, intervalo; evolução sazonal (entidade eventos) | E | P4 |
| RF-FI-04 | Dashboard: pedidos hoje/mês, estoque baixo, clientes novos, ranking produtos | M | P1 §10 |
| RF-FI-05 | Gráficos: vendas, lucro, consumo insumos, margem, sazonalidade | E | P1 §10 |
| RF-FI-06 | Análises: alta margem baixa saída, alta saída baixa margem | E | P1 |

---

## RF-Relatórios e inteligência

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-RL-01 | Relatórios conforme enterprise §14 + indicadores P1 | M | Enterprise |

---

## RF-Ajuda contextual (FieldHelp)

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-AJ-01 | Campos críticos com tooltip, texto auxiliar, “saiba mais”, impacto dinâmico | M | P5 |
| RF-AJ-02 | Metadados reutilizáveis (field_id, módulo, usado em, impactos) | E | P5 |

---

## RF-Arquitetura de entrega (referência)

| ID | Requisito | Pri | Ref. origem |
|----|-----------|-----|-------------|
| RF-AR-01 | Frontend: rotas públicas `loja/[slug]`, admin `painel`, platform `admin` | E | P2; [mockup admin](../mockups/admin-painel-layout-sugestao.html) |
| RF-AR-02 | Backend: módulos alinhados a `documento_enterprise` §3 | M | P2 |

---

## Ideias fora do núcleo (viram backlog IP)

Promoções, agenda de produção, disponibilidade por dia/horário, métricas de recompra, cupons, integração WhatsApp oficial: ver [backlog.md](../projeto/backlog.md) seção **Ideias de produto**.
