# Documento enterprise — arquitetura e planejamento

**SaaS — gestão de lojas caseiras**

> **Fonte canônica:** este arquivo consolida a *Proposta V4* (produto, requisitos e engenharia) com modelagem, infra e roadmap do repositório.  
> **Atalho na raiz:** [proposta.md](../proposta.md) aponta para cá — edite preferencialmente este documento para evitar divergência.

**Documentação complementar (detalhamento e rastreabilidade):**

- [normativos/regras-negocio.md](normativos/regras-negocio.md) — invariantes por domínio (`RN-*`)
- [normativos/requisitos-funcionais.md](normativos/requisitos-funcionais.md) — requisitos funcionais (`RF-*`), alinhados ao planejamento em [inicio_planejamento.txt](../inicio_planejamento.txt)
- [normativos/requisitos-nao-funcionais.md](normativos/requisitos-nao-funcionais.md) — RNF (`RNF-*`)
- [projeto/decisoes-e-pendencias.md](projeto/decisoes-e-pendencias.md) — decisões **DEC-01 … DEC-20** e gates por fase
- [projeto/rastreabilidade-fontes.md](projeto/rastreabilidade-fontes.md) — mapa do `.txt` → estes documentos

**Atores:** **Super Admin** (`platform_admin`): **DEC-15** — fora do MVP núcleo; candidato à Fase 4. **Sessão:** access + refresh **DEC-16**. **Vitrine:** rota **`/loja/[slug]`** **DEC-19**. **Custo / baixa de lote:** **DEC-09** (média ponderada para custo) e **DEC-17** (FEFO/FIFO físico).

**Última revisão documental:** 2026-04-17

---

## §1 Visão estratégica e produto

Plataforma SaaS **multi-tenant** para gestão de lojas de produtos caseiros (sacolé, pipoca gourmet, doces), com foco em:

- Operação real (estoque, produção, pedidos)
- Decisão por dados (financeiro, margem, perdas)
- Experiência **mobile-first** (loja e admin)
- Escalabilidade futura para app **sem reescrever regras de negócio** no backend

---

## §2 Princípios de engenharia

- Multi-tenant por `store_id`
- Mobile-first operacional (loja e admin)
- API-first (backend como fonte de verdade)
- Admin autoexplicativo (**ajuda contextual obrigatória** em campos críticos)
- Regras de negócio centralizadas no **service layer**
- Evolução para app nativo reutilizando a mesma API e regras

---

## §3 Arquitetura

### Modelo

- **Monolito modular:** backend único, módulos isolados por domínio
- **Frontend desacoplado** (consome API versionada)

### Justificativa

- Simplicidade operacional e velocidade de entrega
- Testabilidade por módulo
- Possibilidade de extração futura (notificações, relatórios pesados, pagamentos, arquivos)

### Módulos

`auth`, `stores`, `customers`, `products`, `inventory`, `recipes`, `production`, `pricing`, `orders`, `finance`, `reports`, `admin_config`, `audit`

### Estrutura por módulo (backend)

- Router/controller
- Service (regras de negócio)
- Repository (acesso a dados)
- Schemas / validação (Pydantic)

---

## §4 Stack tecnológica

**Frontend**

- Next.js (App Router)
- TypeScript
- Tailwind
- React Query (cache e sincronização com API)

**Backend**

- FastAPI
- SQLAlchemy 2.x
- Alembic (migrações)
- Pydantic v2

**Banco**

- PostgreSQL

**Infra**

- Docker + Docker Compose + Makefile

**Storage de arquivos**

- Supabase Storage (ou compatível S3) para logos, imagens e anexos quando aplicável

**Observabilidade (evolução)**

- Prometheus, Grafana
- Logs estruturados (MVP mínimo: ver §20)

---

## §5 Multi-tenant

- `store_id` em todas as entidades de negócio
- Isolamento lógico por loja; **middleware obrigatório** em rotas autenticadas
- Usuários só acessam dados da própria loja
- Clientes finais pertencem à loja

**Regra crítica:** nunca consultar ou alterar dados de negócio sem `store_id` no contexto da requisição.

---

## §6 Modelagem de dados (resumo)

| Entidade / tabela   | Campos relevantes (resumo) |
|---------------------|----------------------------|
| stores              | id, name, theme, **config** (ex.: `reviews_enabled` **false** no padrão inicial, `catalog_layout`: `grid` \| `list`) |
| users               | id, store_id, role, email |
| products            | id, store_id, name, price, active |
| product_reviews     | id, store_id, product_id, customer_id, rating, texto do comentário, **status** de moderação (`pending` / `approved` / `rejected`), moderado_em, moderado_por (quando avaliações ativas) |
| inventory_items     | id, store_id, name, unit |
| inventory_batches   | id, item_id, quantity, unit_cost, expiration_date |
| recipes             | id, product_id, yield, time_minutes |
| recipe_items        | id, recipe_id, item_id, quantity |
| orders              | id, store_id, customer_id, status, idempotency_key (recomendado) |
| order_items         | id, order_id, product_id, quantity |
| stock_movements     | id, item_id, type, quantity |

Detalhamento e novos campos (reservas, auditoria) evoluem com as fases; ver [fases/](fases/).

---

## §7 Loja (cliente)

- Catálogo com produtos e disponibilidade (estoque)
- **Destaques** (rótulos e/ou secção), conforme **RF-CA-11**
- **Layout do catálogo** configurável pelo admin da loja (opcional): **grade de cards** (padrão sugerido) **ou lista em linhas** (um produto abaixo do outro), mantendo a mesma informação em ambos (**RF-CF-08**, **RF-CA-09**)
- **Modos de recebimento** na vitrine (retirada, entrega, apps parceiros, etc.) conforme configuração da loja (**RF-CF-09**, **RF-PE-08**)
- **Avaliações por produto** (nota + comentário): **desligadas no padrão inicial**; quando a loja ativar, comentários passam por **moderação** antes de públicos (ver RF-AV, RN-025+)
- Carrinho simples
- Pedido via WhatsApp do lojista (link/comunicação)
- Cadastro de cliente
- Filtros (drawer/modal)
- CTA destacado (WhatsApp)
- Carregamento rápido e imagens otimizadas

---

## §8 Admin (lojista)

### Configuração

- Logo, cores, imagem de fundo
- Textos da loja
- WhatsApp
- Horário de funcionamento
- **Opções de recebimento** visíveis na vitrine (retirada, entrega própria, parceiros de entrega, etc.) — **RF-CF-09**
- Comportamento sem estoque: ocultar produto **ou** exibir sem permitir compra
- **Avaliações por produto:** ligar/desligar (**estado inicial: desligado**); fila de **moderação** (aprovar / rejeitar comentários antes da vitrine)
- **Layout da vitrine:** grade (cards) ou **lista em linhas** (opcional; escolha do admin)
- **Destaques / rótulos** de produto (ex.: em destaque, novidade) — **RF-CA-11**

### Clientes

- Cadastro manual; listagem e histórico

### Pedidos

- Criação manual
- Gestão por status com **oito estados canônicos** (**DEC-14**; detalhe em [normativos/regras-negocio.md](normativos/regras-negocio.md)):  
  `rascunho` → `aguardando_confirmacao` → `confirmado` → `em_producao` → `pronto` → `saiu_entrega` → `entregue`; `cancelado` conforme política.
- Evolução: pagamento integrado e impressão

---

## §9 Estoque

### Funcionalidades

- CRUD de produtos finais
- Cadastro de insumos
- Mesmo insumo com preços diferentes ao longo do tempo (histórico)
- Validade opcional; controle por lote
- Estoque mínimo; unidade de medida

### Regras

- Quantidade **nunca negativa**
- **Custo para precificação (MVP):** **média ponderada** por insumo (**DEC-09**); FIFO e último custo como evolução configurável
- **Consumo físico de lotes:** **DEC-17** — FEFO quando houver validade; senão FIFO por data de entrada; transacional

---

## §10 Receitas

- Consumo de insumos e geração de produto acabado
- Rendimento; perda esperada
- Tempo de produção; mão de obra
- Custos indiretos opcionais

---

## §11 Precificação

### Cálculo (referência)

- `custo_total = insumos + embalagem + mão de obra + custos indiretos`
- `preço_sugerido = custo_total * (1 + margem)`

### Funcionalidades

- Margem configurável; markup; preço manual
- Simulador em tempo real; arredondamento; histórico de preço

### Rateio de custos indiretos (configurável)

- Por produto, por produção, por tempo ou por quantidade

---

## §12 Pedidos, concorrência e idempotência

### Concorrência de estoque

- **Lock pessimista** na reserva de estoque + **reserva** explícita
- **Timeout** de reserva (liberar estoque se o pedido não confirmar no prazo)

### Idempotência

- `idempotency_key` por criação de pedido (evitar duplicidade em retries)
- **Produção (Fase 3):** operações que disparam baixa de insumos e entrada de produto acabado (ex.: `POST /api/v1/production`) devem ser idempotentes — ver [normativos/requisitos-nao-funcionais.md](normativos/requisitos-nao-funcionais.md) **RNF-Arq-02b**

### Status

- Alinhar a **DEC-14** e [normativos/regras-negocio.md](normativos/regras-negocio.md) RN-Pedidos

---

## §13 Financeiro

- Registros de venda, custo e perdas
- Indicadores: lucro bruto, margem real, perdas totais
- Comparações: mês anterior, ano anterior, datas sazonais (ex.: Páscoa)

---

## §14 Relatórios

- Produtos mais vendidos; margem por produto
- Tendência de lucro; análise de perdas
- Gráficos financeiros

---

## §15 UX, mobile e ajuda contextual

### Regras de interface

- Sem dependência de hover para ações essenciais
- Evitar tabelas grandes em mobile; preferir **cards**
- Formulários por etapas quando necessário; botões grandes; navegação simples

### Loja

- Scroll fluido; CTA visível; carrinho acessível

### Admin

- Navegação otimizada; ações rápidas; tabelas → cards em telas pequenas

### Ajuda contextual (obrigatória)

Cada campo crítico deve informar: o que é; onde é usado; impacto; exemplo.

Tipos: tooltip; texto auxiliar; “saiba mais”; impacto dinâmico.

### Metadados sugeridos (`FieldHelp`)

- `field_id`, `title`, `short_description`, `long_description`, `module`, `used_in`, `impacts`, `example`

---

## §16 Segurança, RBAC e auditoria

### Autenticação e API

- JWT; validação de entrada (schemas)
- Isolamento por tenant; logs auditáveis para ações sensíveis

### RBAC (papéis)

- **Admin**, **Operador**, **Leitura**  
- Permissões por módulo (CRUD configurável onde fizer sentido)

### Auditoria

**MVP:** log de ações relevantes.

**Evolução:** before/after, usuário, timestamp, origem (IP/client).

---

## §17 API

- **Versionamento:** prefixos `/api/v1/`, `/api/v2/`, …
- **Envelope de resposta padrão:** `{ "success", "data", "errors" }`
- **Contrato OpenAPI:** o FastAPI deve expor especificação **OpenAPI 3** gerada automaticamente (`/openapi.json` ou equivalente), mantida versionada com a API na **Fase 1** em diante — uso: cliente TS, testes de contrato e paralelismo front/back (ver [normativos/requisitos-nao-funcionais.md](normativos/requisitos-nao-funcionais.md) RNF-DevEx-08).

### Exemplos de endpoints (referência)

- `GET /api/v1/products`
- `POST /api/v1/orders`
- `POST /api/v1/production`
- `GET /api/v1/reports/financial`

---

## §18 Tratamento de erros

- **Cliente (loja):** mensagens simples e acionáveis
- **Lojista (admin):** detalhamento técnico legível + sugestão de ação quando possível

---

## §19 Fluxos principais

### Pedido

Cliente → catálogo → carrinho → WhatsApp → pedido registrado (com reserva/idempotência conforme §12)

### Produção

Receita → consome insumos (baixa) → gera produto final (entrada)

### Precificação

Custo → margem → preço sugerido → ajuste manual

---

## §20 Infraestrutura: Docker, Makefile, migrações, observabilidade

### Docker (padrão)

Serviços: `frontend`, `backend`, `postgres`

**PostgreSQL — reprodutibilidade:** pinar a imagem major em todo `docker-compose` do repositório (ex.: **`postgres:16-alpine`**). Subir major (ex.: 18) só após testes de compatibilidade e migração Alembic. Documentar alteração no changelog técnico.

### Makefile (raiz)

Comandos típicos: `up`, `down`, `test`, `migrate`, `lint`

### Migração de schema

- Alembic; versionamento de revisões; rollback suportado

### Observabilidade

**MVP:** logs estruturados (correlação request id, `store_id` quando aplicável).

**Evolução:** métricas e tracing distribuído.

---

## §21 Testes e qualidade

- Testes unitários (camada de serviço) e de integração (fluxos)
- **Meta de cobertura:** ≥ 90% — aplicar de forma progressiva por fase
- Documentação de testes obrigatória onde o time definir
- HTMLs de referência para UI quando adotados no projeto
- **Rastreabilidade RN → testes:** matriz evolutiva em [normativos/matriz-rn-testes.md](normativos/matriz-rn-testes.md) (preencher por fase conforme casos forem implementados)

---

## §22 MVP (escopo fechado inicial)

Inclui:

- Autenticação
- Catálogo
- Pedidos (com evolução de reserva/idempotência conforme priorização da Fase 2)
- Estoque básico
- Receitas
- Precificação simples

---

## §23 Backlog enterprise e evolução

Lista operacional e ideias: [projeto/backlog.md](projeto/backlog.md).

Itens típicos fora do núcleo MVP (priorizar no roadmap):

- Cache de catálogo
- App mobile dedicado
- Pagamentos
- Offline mode
- Multi-moeda
- Limite por plano SaaS / assinatura
- Eventos sazonais (reforço em relatórios/comparações)
- BI avançado
- Multi-usuário por loja (refino de RBAC, convites)

---

## §24 CI/CD (futuro)

- Pipeline em Git: lint + testes + build Docker
- Deploy automático (staging/produção conforme decisão)

---

## §25 Roadmap por fases

- **Fase 1:** fundação  
- **Fase 2:** operação  
- **Fase 3:** gestão  
- **Fase 4:** escala  

Detalhes: [fases/PLANO-ROADMAP-FASES.md](fases/PLANO-ROADMAP-FASES.md).

---

## Fim
