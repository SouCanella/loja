# Relatórios e analytics — roadmap ampliado (vitrine + operação)

**Contexto:** o painel já tem **Relatório financeiro** (`/painel/relatorio`) com agregados por produto/categoria/status e gráficos (Pareto, dispersão margem × volume), e o **dashboard** com série de receita e pedidos por estado. Este documento alinha o **pedido de produto** (lista longa de KPIs e secções) com **o que o sistema já pode calcular**, o que exige **novos campos ou tabelas**, e o que é **analytics de vitrine** (eventos), tipicamente noutra camada.

**Definições fechadas (confirmada/pendente, volume, cupons, descontos, PRO):** [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) — **DEC-22**.

**Normas:** pedidos **DEC-14** ([requisitos-funcionais](../normativos/requisitos-funcionais.md)); relatório financeiro alinhado a `financial_report.py` (exclui `rascunho` e `cancelado`).

---

## 1. Duas famílias de dados (não confundir)

| Família | Exemplos | Onde vive |
|--------|-----------|-----------|
| **Operação / pedidos** | Receita, lucro estimado, pedidos por hora, por categoria, ticket médio | PostgreSQL: `orders`, `order_items`, `production_runs`, stock… — **já existe base**. |
| **Analytics de vitrine** | Visitas, visualizações de página, «adicionou ao carrinho», produtos mais vistos, **localização** de visitantes | **Não** está modelado no núcleo actual. Exige **eventos** (ver §4). |

Sem eventos de vitrine, métricas como «página vista» ou «localização» **não aparecem** só a partir de pedidos.

---

## 2. Mapa das métricas pedidas → viabilidade hoje

Legenda: **Já** = derivável com modelo e regras actuais (com possível agregação nova na API). **Novo** = migração / integração / eventos.

### 2.1 Vitrine (analytics)

| Métrica | Viabilidade | Notas |
|---------|-------------|--------|
| Visitas na loja / **Visitantes** | **Novo** | Definir «visita» (sessão? IP? cookie?). Tabela `vitrine_sessions` ou SaaS (Plausible, Umami, GA4) embebido. |
| Visualizações da página | **Novo** | Evento `page_view` por rota (`/loja/[slug]`, produto, etc.). |
| Adicionou ao carrinho | **Novo** | Evento `add_to_cart` no cliente (e opcionalmente servidor). |
| Produtos mais visitados | **Novo** | Agregação de `product_view` por `product_id`. |
| Localização dos visitantes | **Novo** | GeoIP no edge ou no serviço de analytics (privacidade: agregar por país/região, RGPD/LGPD). |

### 2.2 Volume e receita por hora

| Métrica | Viabilidade | Notas |
|---------|-------------|--------|
| Volume de pedidos **por hora** | **Já** | Partir `orders.created_at` (timezone loja — ver `stores.config.general.timezone`), agrupar `date_trunc('hour', …)`. |
| Dividido **pagos** vs **pendentes** | **DEC-22** | Partição por estado: **pendente de confirmação** = `aguardando_confirmacao`; **aceites** = `confirmado`…`entregue`. Liquidação financeira explícita: ver [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) §3. |
| Receita por hora | **Já** | Soma de `order_items` no intervalo hora, mesmos filtros de estado que o relatório. |
| Receita **confirmada** vs **pendente** | **DEC-22** | Fechado em [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) §2.1. **Não** é custo de receita de bolo — é **receita de vendas** (totais líquidos). |
| Lucro confirmado / pendente | **Parcial** | O relatório já estima margem por produto/período; repetir a lógica **por bucket de estado** exige a mesma regra de «confirmado vs pendente» e custos de produção/receita como hoje. |

### 2.3 Património e margem potencial (estoque)

| Métrica | Viabilidade | Notas |
|---------|-------------|--------|
| Valor total do património (estoque) | **Já** | Σ quantidade × custo unitário (lotes / `inventory_batches`) por política já usada na precificação. |
| Potencial de venda após preço de venda | **Já** | Σ quantidade × `products.price` (ou preço efectivo). |
| Margem potencial | **Já** | Diferença entre potencial de venda e custo embutido (definir se usa custo médio ou último lote — alinhar a **DEC-09**). |

### 2.4 Performance por categoria

| Métrica | Viabilidade | Notas |
|---------|-------------|--------|
| Total de pedidos / valor total por categoria | **Já** | Mesma linha que `by_category` no relatório financeiro; pode expor-se também como «performance» com período e ordenação. |

### 2.5 Resumo tipo dashboard (lista do utilizador)

| Bloco | Viabilidade | Notas |
|-------|-------------|--------|
| Ticket médio | **Já** | Já no dashboard (`ticket_avg`); replicar no relatório com período. |
| Descontos — total concedido | **DEC-22** | Modelo: `list_unit_price` em linha + `coupon_discount_amount` no pedido; ver [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) §4 — **migração** a implementar. |
| Distribuição de vendas | **Já** | Pode ser série temporal ou por estado — dados existem. |
| Métodos de pagamento — total / valor | **Parcial** | Existe `payment_method_id` no pedido (string); falta taxonomia estável e UI de configuração se for livre. Agregação **possível** se os valores forem consistentes. |
| Condições de pagamento | **Parcial** | Idem; depende de normalização. |
| Top produtos | **Já** | Já há ranking por receita no relatório. |
| Top clientes | **Parcial** | Há `customer_id`, `contact_phone` / agregação (ver Fase **3.1-b** em [fase-03-1-paridade-mockup.md](../fases/fase-03-1-paridade-mockup.md)); requer dados estáveis por cliente. |
| Balanço de estoque | **Já** | Movimentos e saldos já existem; relatório dedicado ou secção nova. |
| Uso de cupons | **DEC-22** | Entidade `store_coupons` + campos no pedido — ver [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) §4. |

### 2.6 Já pedido noutros sítios (confirmar como primeira página)

| Relatório | Viabilidade | Notas |
|-----------|-------------|--------|
| Vendas por itens | **Já** | `by_product` no relatório financeiro. |
| Resumo diário de vendas | **Já** | Dashboard tem receita por dia; pode alargar-se tabela «por dia» no relatório. |
| Estoque por item | **Já** | Página ou API de inventário; agregar no painel. |

---

## 3. O que mais podemos ter (ideias)

- **Funil vitrine:** visualização → carrinho → checkout iniciado → pedido criado (exige eventos + eventualmente `order_id` no último passo).
- **Taxa de conversão** = pedidos / sessões (precisa de denominador de sessões).
- **SLA:** tempo médio entre `confirmado` e `entregue`.
- **Sazonalidade:** heatmap dia da semana × hora (só pedidos).
- **Alertas:** stock baixo (já referenciado no dashboard) com limiares por produto.
- **Export CSV** por cada bloco novo (paridade com relatório actual).

---

## 4. Arquitectura recomendada para analytics de vitrine

1. **Mínimo:** integrar ferramenta **self-hosted ou SaaS** (privacidade e cookies conforme LGPD) e mostrar no painel **iframe ou link** «Ver analytics» — **zero** mudança de schema.
2. **Próprio:** tabela `analytics_events (store_id, event_type, path, product_id?, session_id, occurred_at, meta jsonb)` + ingestão via `POST` público com rate limit e **sem** PII obrigatório; agregações por job ou materialized view.
3. **Geo:** só no pipeline de eventos (IP → região) com política de retenção clara.

---

## 5. Ordem de implementação sugerida (engenharia)

1. **Definir** «confirmado vs pendente» e eventualmente «pago» com **DEC** ou extensão de DEC-14 (campos de pagamento).
2. **API + UI:** série **hora** (pedidos e receita) e património/margem potencial no relatório ou endpoint dedicado.
3. **Secções** no mesmo ecrã de relatórios: reutilizar componentes de gráfico; tabelas Top N já existentes.
4. **Eventos vitrine** (fase própria ou **Fase 4** + backlog) antes de «produtos mais visitados» e «localização».

---

## 6. Ligações

| Documento | Papel |
|-----------|--------|
| [fase-03-1-paridade-mockup.md](../fases/fase-03-1-paridade-mockup.md) | Gráficos e relatórios §6 (já entregues no âmbito 3.1). |
| [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) | Onde encaixa trabalho pós-3.1 (paralelo à Fase 4). |
| [backlog.md](backlog.md) | Itens **Novo** devem virar linhas MVP-/DT- quando priorizados. |

---

*Última revisão: 2026-04-20 — alinhamento ao modelo; **DEC-22** e [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md).*
