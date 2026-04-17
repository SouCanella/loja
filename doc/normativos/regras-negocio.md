# Regras de negócio

**Origem:** consolidado a partir de [documento_enterprise.md](../documento_enterprise.md) e [inicio_planejamento.txt](../../inicio_planejamento.txt).  
**Decisões de produto:** [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) (DEC-01 … DEC-20).

---

## RN-Geral — Multi-tenant e isolamento

| ID | Regra |
|----|--------|
| RN-001 | Toda entidade de negócio relevante deve ter vínculo com `store_id` (ou derivar exclusivamente de entidades com `store_id`). |
| RN-002 | Toda consulta ou mutação de dado de negócio deve filtrar pelo tenant da sessão; **nunca** expor dados entre lojas. |
| RN-003 | Usuário staff (lojista) só acessa a loja à qual está vinculado. |
| RN-004 | Cliente final pertence a **uma** loja; não reutilizar cadastro entre lojas sem fluxo explícito (fora do MVP). |
| RN-005 | Super Admin da plataforma (`platform_admin`): **fora do escopo do MVP núcleo**; quando existir, visão global conforme **DEC-15**. |

---

## RN-Auth — Autenticação e autorização

| ID | Regra |
|----|--------|
| RN-010 | Login por e-mail e senha (lojista/staff); recuperação de senha deve existir. |
| RN-011 | Senhas armazenadas com hash seguro (algoritmo moderno). |
| RN-012 | Autorização combina **papel** (RBAC) + **tenant**; permissões por módulo conforme §16 enterprise. |
| RN-013 | Cliente da vitrine autentica apenas no contexto da loja acessada. |
| RN-014 | Sessão staff: **access JWT** (TTL curto) + **refresh token** conforme **DEC-16** (armazenamento seguro no cliente). |

---

## RN-Loja — Configuração e vitrine

| ID | Regra |
|----|--------|
| RN-020 | Identidade visual (logo, cores, imagens, textos) é configurável por loja sem permitir quebrar o layout base (“liberdade com cerca”). |
| RN-021 | Deve existir pré-visualização ou feedback visual ao configurar tema quando possível. |
| RN-022 | Se imagem opcional não for enviada, usar **fallback** do tema base. |
| RN-023 | Comportamento para produto **sem estoque** é configurável: ocultar do catálogo **ou** exibir como indisponível (sem compra). |
| RN-024 | Produto pode ter estados de disponibilidade: disponível, sob encomenda, indisponível (conforme modelagem de catálogo). |
| RN-025 | **Avaliações por produto** só existem se a loja **ativar** explicitamente a funcionalidade; **no padrão inicial está desativada** (nada de review na vitrine até lá). |
| RN-026 | Comentários de avaliação só ficam **visíveis ao público** após **aprovação** por utilizador autorizado da própria loja (moderação obrigatória quando avaliações estiverem ativas). |
| RN-027 | **Layout da vitrine** (grade de cards vs **lista em linhas**) é **configuração da loja**; o conteúdo apresentado deve ser equivalente nos dois modos (preço, disponibilidade, CTA). |

---

## RN-Catalogo — Produtos e categorias

| ID | Regra |
|----|--------|
| RN-030 | Produto pertence a uma loja; preço e disponibilidade são por loja. |
| RN-031 | **Categorias:** cada produto pode referenciar uma categoria da loja (`categories`); filtros no catálogo conforme **DEC-20**. Destaques e variações conforme RF. |
| RN-032 | Histórico de alteração de preço é desejável para gestão (evolução). |
| RN-033 | **Avaliações** (`product_reviews` ou equivalente) pertencem sempre à loja do produto; **nunca** misturar reviews entre tenants. |
| RN-034 | **Modelo MVP (DEC-20):** categorias **planas** por loja (`name`, `slug` **único por `store_id`**); `products.category_id` **opcional** (NULL = sem categoria); filtros mínimos na API (`category_slug` e/ou `category_id`). Hierarquia `parent_id` fica para evolução. |

---

## RN-Cliente

| ID | Regra |
|----|--------|
| RN-040 | Cadastro pode ser feito pelo cliente na vitrine ou manualmente pelo admin da loja. |
| RN-041 | Endereço e contato são dados da loja; observações internas não devem vazar para o cliente. |
| RN-042 | Tags (VIP, atacado, revendedor, inadimplente, etc.) são opcionais e por loja. |

---

## RN-Pedidos

| ID | Regra |
|----|--------|
| RN-050 | Pedido pertence a uma loja e opcionalmente a um cliente; itens consomem produtos da mesma loja. |
| RN-051 | Fluxo inicial: intenção de compra registrada; finalização externa via WhatsApp conforme configuração; mensagem pode ser montada pelo sistema. |
| RN-052 | Pedido manual pelo lojista deve ser suportado: cliente (opcional), itens, quantidades, desconto, observação, **origem** (balcão, WhatsApp, Instagram, telefone, manual, etc.). |
| RN-053 | Pedido deve manter **histórico de status** (auditoria de transições). |
| RN-054 | Registro de forma de **entrega** e **retirada** quando aplicável à operação. |
| RN-055 | **Concorrência:** reserva de estoque com lock pessimista + timeout; ver enterprise §12. |
| RN-056 | **Idempotência:** `idempotency_key` (ou header equivalente) na criação de pedido para evitar duplicidade. |
| RN-057 | **Status canônicos** (string estável internamente, ex.: `snake_case`): ver tabela abaixo (**DEC-14**). |
| RN-058 | **MVP sem integração automática WhatsApp ↔ sistema:** o staff pode **alterar manualmente** o status do pedido entre os oito valores canónicos (saltos e ordem livres, ex.: ir direto de `rascunho` a `em_producao`), desde que cada mudança fique em **histórico** (RN-053). Estados **terminais:** `entregue` e `cancelado` não devem transitar para estados operacionais pelo fluxo normal (correções extraordinárias ficam fora do fluxo padrão / backlog). |
| RN-059 | **Evolução (pós-integração/orquestração):** passar a validar transições contra a **matriz restrita** (fluxo feliz abaixo + política de cancelamento explícita); o código deve permitir configurar ou aplicar essa matriz sem mudar o enum persistido. |

### Estados e transições (DEC-14)

**Estados:** `rascunho` | `aguardando_confirmacao` | `confirmado` | `em_producao` | `pronto` | `saiu_entrega` | `entregue` | `cancelado`

**Fluxo feliz típico (referência para relatórios e evolução — pedido web + WhatsApp):**  
`rascunho` → `aguardando_confirmacao` (após registrar e abrir WhatsApp, se aplicável) → `confirmado` → `em_producao` → `pronto` → `saiu_entrega` → `entregue`

**Cancelamento (referência para evolução):** transição para `cancelado` a partir dos estados operacionais até `pronto` inclusive; **não** pelo fluxo padrão a partir de `saiu_entrega` ou `entregue` (ver ajuste em RN-058 para terminais).

**Pedido manual/balcão:** pode entrar já em `confirmado` ou `em_producao` conforme operação.

**Política MVP vs evolução:** ver **RN-058** e **RN-059**.

Relatórios podem agrupar estados em fases macro (ex.: “em andamento” = `confirmado` … `saiu_entrega`) sem alterar o enum persistido.

---

## RN-Estoque — Insumos, lotes e produto final

| ID | Regra |
|----|--------|
| RN-060 | **Separar** estoque de **insumo** e de **produto final**; não misturar quantidades conceituais. |
| RN-061 | Insumo tem **cadastro mestre**; custo e quantidade operacional vêm de **entradas/lotes**, não de um único preço fixo eterno. |
| RN-062 | Mesmo insumo pode ter várias entradas com custos e validades diferentes por lote. |
| RN-063 | Validade é opcional **por lote**; insumo pode declarar se controla validade. |
| RN-064 | Quantidade disponível por lote deve ser rastreável (`quantity_available` ou equivalente). |
| RN-065 | Estoque **nunca** fica negativo sem regra explícita de negócio (ajuste autorizado). |
| RN-066 | Movimentações (entrada, consumo, ajuste, perda, venda, produção) geram registro auditável. |
| RN-067 | **Custo para precificação (MVP):** **média ponderada** por insumo (**DEC-09**). FIFO e último custo: evolução configurável. |
| RN-068 | **Ordem de consumo físico de lotes:** **DEC-17** — FEFO quando houver `expiration_date`; senão FIFO por data de entrada do lote; sempre em transação consistente. |
| RN-069 | Ajustes manuais e perdas impactam movimentações e relatórios financeiros. |
| RN-070 | Embalagens entram como insumo quando a operação exigir. |
| RN-071 | **MVP — momento da baixa em venda (DEC-17):** a **primeira baixa física** de lotes (produto final ou item vendível conforme modelagem da Fase 2) ocorre na transição do pedido para **`confirmado`** (incluindo quando se salta directamente para `confirmado`). Empates na ordenação de lotes: `expiration_date` ASC (lotes sem validade tratados após os com data, dentro da política FEFO/FIFO); depois data de entrada do lote; depois `id` do lote. |
| RN-072 | **MVP — cancelamento e estoque:** se o pedido for para `cancelado` **depois** de já ter consumido stock (estado tinha sido `confirmado` ou posterior), **reverter** na mesma transação de BD as movimentações de baixa associadas a esse pedido, mantendo estoque não negativo. |

---

## RN-Receita e produção

| ID | Regra |
|----|--------|
| RN-080 | Receita vincula produto final, rendimento e lista de insumos com quantidades e unidades compatíveis. |
| RN-081 | Não permitir produção se **insumos insuficientes** (validação prévia). |
| RN-082 | Produção gera: baixa de insumos (por lote conforme RN-068) e entrada de produto final. |
| RN-083 | Receita pode ter opcionais: tempo de produção, perda esperada %, custo indireto adicional, observação de processo (P4). |
| RN-084 | Produção deve gerar rastreabilidade (histórico). |
| RN-085 | Receita pode estar ativa/inativa. |

---

## RN-Precificação

| ID | Regra |
|----|--------|
| RN-090 | Custo total considera insumos (via lotes e **média ponderada** no MVP), embalagem, mão de obra quando aplicável, custos indiretos rateados. |
| RN-091 | Preço sugerido deriva de custo e margem/markup; **arredondamento comercial** permitido. |
| RN-092 | Lojista pode **ajustar manualmente** margem, preço final e parâmetros; sistema recalcula indicadores (lucro, margem real). |
| RN-093 | **Simulador** pode operar sem persistir imediatamente o preço oficial do produto (dois fluxos: oficial vs simulação). |
| RN-094 | Custos indiretos da loja são cadastráveis; rateio configurável (por produto, produção, tempo, quantidade — evolução). |

---

## RN-Financeiro e relatórios

| ID | Regra |
|----|--------|
| RN-100 | Exibir faturamento, custo estimado vendido, lucro bruto, perdas totais, ticket médio onde houver dados. |
| RN-101 | **Perdas** devem ser quantificáveis por período (vencimento, quebra, produção, ajuste, etc.). |
| RN-102 | Comparativos: mês anterior, mesmo mês ano anterior, intervalos customizados; comparações por **evento sazonal** (Páscoa, etc.) como evolução (enterprise §23). |
| RN-103 | Relatórios analíticos (margem por produto, produtos mais vendidos, insumos críticos) alimentam decisão. |

---

## RN-Auditoria e conformidade

| ID | Regra |
|----|--------|
| RN-110 | Alterações críticas em estoque, pedido, preço e produção devem ser auditáveis (quem, quando; evolução before/after). |
| RN-111 | Soft delete pode aplicar-se a produto, cliente, receita quando fizer sentido (reduzir perda acidental de histórico). |

---

## RN-Ajuda e UX admin

| ID | Regra |
|----|--------|
| RN-120 | Campos que afetam cálculo, preço, estoque, lucro ou aparência da loja devem ter ajuda contextual (ver §15 enterprise). |
