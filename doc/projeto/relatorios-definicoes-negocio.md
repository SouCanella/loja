# Definições de negócio — painel de relatórios (fechadas)

**Objectivo:** texto único para alinhar produto, API e UI ao exemplo de **painel de relatórios** (cartões Visitas, Volume, Receita, Lucro, períodos, eventual PRO).  
**Relação:** complementa [relatorios-analytics-roadmap.md](relatorios-analytics-roadmap.md); decisão normativa **DEC-22** em [decisoes-e-pendencias.md](decisoes-e-pendencias.md).

**Timezone:** todos os agrupamentos **por dia** ou **por hora** usam o **fuso da loja** (`stores.config.general.timezone` ou equivalente), não UTC cru — mesmo critério sugerido para dashboard e relatório financeiro.

---

## 1. Vocabulário (evitar ambiguidade)

| Termo no UI | Significado fechado |
|-------------|---------------------|
| **Receita** | Soma dos **totais líquidos** dos pedidos no período (após descontos em linha e cupom no pedido). Não é custo de receita de bolo (produção); é **receita de vendas**. |
| **Lucro (estimado)** | Mesma lógica já usada no relatório financeiro: receita de vendas − custo de insumos atribuível (produção / política actual). Arredondamentos documentados no serviço. |
| **Confirmada** / **Pendente** (receita e lucro) | Partem da **máquina de estados do pedido (DEC-14)**, não de “pagamento bancário” até existir campo explícito (§3). |
| **Pagos** / **Pendentes** (volume de pedidos) | **Primeira versão:** mesmo critério que receita/lucro por baldes (§2), com **rótulos de UI** que não impliquem “dinheiro no banco” — ver §2.2. |
| **Visitas / visualizações** | **Analytics de vitrine** (eventos); não deriváveis só de `orders`. |

---

## 2. Baldes operacionais (DEC-14)

Excluem-se sempre do relatório: `rascunho`, `cancelado` (como hoje em `financial_report`).

### 2.1 Receita e lucro — «Confirmada» vs «Pendente»

| Balde | Estados incluídos | Interpretação de negócio |
|-------|-------------------|---------------------------|
| **Pendente** | `aguardando_confirmacao` | Pedido **ainda não aceite** pela loja (equivalente a “na fila do WhatsApp”). |
| **Confirmada** | `confirmado`, `em_producao`, `pronto`, `saiu_entrega`, `entregue` | Pedido **já aceite** e em execução ou concluído. |

**Receita confirmada** = soma dos totais líquidos dos pedidos **Confirmada**.  
**Receita pendente** = soma dos totais líquidos dos pedidos **Pendente**.

**Lucro confirmado / pendente** = mesma partição, aplicando a fórmula de margem já definida ao conjunto de pedidos de cada balde.

### 2.2 Volume de pedidos — «Pagos» vs «Pendentes» (rótulos honestos)

Sem campo de **pagamento liquidado**, o ecrã tipo referência mistura “pago” com “confirmado”. Para o negócio **artesanal / WhatsApp**, sugerimos:

| Rótulo sugerido (UI) | Contagem | Estados |
|----------------------|----------|---------|
| **Pendentes de confirmação** | Pedidos em `aguardando_confirmacao` | Igual balde **Pendente** acima. |
| **Aceites (em produção / entrega)** | Pedidos em `confirmado` … `entregue` | Igual balde **Confirmada**. |

**Nota de produto:** Se quiser manter literalmente **«Pagos»** e **«Pendentes»** no mock, tratar **«Pagos»** como sinónimo de **«Aceites»** até existir **DEC-22 §3** (pagamento explícito), ou mostrar tooltip: *«Aceites pela loja; registo de pagamento em evolução»*.

### 2.3 Série por hora

Para cada hora *H* no fuso da loja:

- **Volume:** contagens por balde (pendente de confirmação vs aceites) conforme §2.2.
- **Receita / lucro:** somas por hora de `created_at` do pedido (ou, se no futuro se adoptar **hora de confirmação**, passar a essa data — fora deste fecho).

---

## 3. Pagamento liquidado (evolução — recomendado)

Para relatórios que distingam **dinheiro já recebido** vs **a receber**, acrescentar no pedido (migração futura):

- `payment_status`: `pending` | `partial` | `paid` (ou `paid_at` + valor recebido).
- Regras por defeito sugeridas: ao passar a `entregue`, sugerir `paid` se método for dinheiro/PIX na entrega; sempre editável pelo lojista.

Enquanto não existir, **não** usar a palavra «Pago» como sinónimo de liquidação financeira nos relatórios oficiais — usar **«Aceite»** / **«Confirmado (operacional)»**.

---

## 4. Cupons e desconto em linha (modelagem)

### 4.1 Princípios

1. **`order_items.unit_price`** passa a ser o **preço unitário efectivo** (já líquido de desconto de linha).
2. Desconto de linha fica explícito para auditoria e totais de «descontos concedidos»:
   - `order_items.list_unit_price` (opcional, nullable): preço de catálogo antes de desconto nesta linha.
   - **Desconto da linha** = `quantity * (list_unit_price - unit_price)` quando `list_unit_price` preenchido; senão **0** (ou só cupom ao nível do pedido).
3. **Cupom ao nível do pedido:** redução aplicada sobre o subtotal após linhas (percentual ou valor fixo), armazenada em:
   - `orders.coupon_id` (FK opcional) ou `orders.coupon_code` snapshot,
   - `orders.coupon_discount_amount` (≥ 0).

**Total líquido do pedido** = soma `quantity * unit_price` nas linhas − `coupon_discount_amount` (≥ 0).

### 4.2 Entidade `store_coupons` (por loja)

Campos mínimos sugeridos:

| Campo | Descrição |
|-------|-----------|
| `store_id` | Tenant |
| `code` | Código único por loja (case-insensitive normalizado) |
| `discount_type` | `percent` \| `fixed_amount` |
| `discount_value` | Percentagem ou valor em moeda da loja |
| `min_order_total` | Opcional — pedido mínimo para aplicar |
| `starts_at` / `ends_at` | Validade |
| `max_uses` | Opcional; contador `uses_count` |
| `active` | Liga/desliga |

Validação na criação do pedido (vitrine ou painel); gravar `coupon_discount_amount` e referência ao cupom aplicado.

### 4.3 Relatórios

- **Total de descontos concedidos** = soma dos descontos de linha (derivados de `list_unit_price`) + soma de `coupon_discount_amount` no período.
- **Uso de cupons** = agrupar por `coupon_id` / código snapshot com contagem e valor descontado.

---

## 5. Conteúdo «PRO» (produto)

O exemplo mostra faixa **PRO** para métricas avançadas. Definição coerente:

- **Núcleo (sempre):** agregados de **pedidos** do §2 (volume, receita, lucro por balde, séries por hora/dia), categorias, top produtos, estoque/património quando a API existir.
- **PRO ou add-on:** **analytics de vitrine** (visitas, funil, geo), exportações avançadas, comparativos 12 meses, ou **múltiplos utilizadores** — conforme estratégia comercial; deve ser uma **flag de plano** (`stores` ou `billing`) e não só esconder UI.

*(A implementação técnica de billing fica fora deste documento.)*

---

## 6. Resumo para implementação

1. Relatórios e cartões **Confirmada/Pendente** usam **§2.1**.
2. Cartões **Pagos/Pendentes** (volume) usam **§2.2** ou aguardam **§3** para significado financeiro real.
3. Cupons + desconto em linha seguem **§4** na primeira migração de schema.
4. Visitas/visitantes seguem [relatorios-analytics-roadmap.md](relatorios-analytics-roadmap.md) §4 (eventos ou SaaS).

---

*Última revisão: 2026-04-20 — definições fechadas + modelo cupom/desconto.*
