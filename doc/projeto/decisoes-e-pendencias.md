# Decisões arquiteturais e pendências de produto

Referência cruzada: [documento enterprise](../documento_enterprise.md), [inicio_planejamento.txt](../../inicio_planejamento.txt), [regras de negócio](../normativos/regras-negocio.md).

**Última atualização:** 2026-04-17 — ADR leve para **DEC-01 … DEC-20**; melhorias não bloqueantes (OpenAPI, pin Postgres, idempotência produção, matriz RN→testes) incorporadas à documentação normativa. **Secção «Decisões de implementação MVP (Fase 2)»** com políticas DEC-14/17/20 para codificação.

---

## Decisões já tomadas (fechadas)

| ID | Decisão | Fonte |
|----|---------|--------|
| DEC-01 | SaaS **multi-tenant** por `store_id`; isolamento lógico; middleware obrigatório | Enterprise §5; P1/P2 |
| DEC-02 | **Monolito modular** (FastAPI) + **frontend desacoplado** (Next.js); não microsserviços no estágio inicial | Enterprise §3; P5 |
| DEC-03 | Stack: Next.js App Router, TypeScript, Tailwind, React Query; FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2; PostgreSQL; Docker Compose; Makefile | Enterprise §4; P2 |
| DEC-04 | Armazenamento de mídia em **S3 compatível** ou Supabase Storage | Enterprise §4; P2 |
| DEC-05 | Backend organizado por **módulos de domínio**, cada um com router, service, repository, schemas, models | Enterprise §3; P2 |
| DEC-06 | API **versionada** (`/api/v1/…`) com envelope `{ success, data, errors }` | Enterprise §17 |
| DEC-07 | Regras de negócio na **camada de serviço**; repositório sem decisão de negócio | P2 |
| DEC-08 | **Insumo mestre** (`inventory_items`) + **lotes/entradas** (`inventory_batches`) com custo e validade por lote | P3; Enterprise §6 |
| DEC-09 | **Método de custo padrão para precificação no MVP:** **média ponderada** por insumo (derivada dos lotes). **FIFO** e **último custo** ficam como configuração futura por loja ou pós-MVP. *(Nota: eixo distinto de **ordem de baixa física** — ver DEC-17.)* | P3; Enterprise §9 |
| DEC-10 | Ajuda contextual (**FieldHelp**) como requisito de produto, não opcional de UI | Enterprise §15; P5 |
| DEC-11 | **Mobile-first** para loja pública e admin | Enterprise §15; P5 |
| DEC-12 | Meta de **cobertura de testes** ≥ 90% de forma progressiva | Enterprise §21; P1 |
| DEC-13 | Autenticação com **JWT** para API; autorização por papel + tenant | Enterprise §16; P2 |
| **DEC-14** | **Status de pedido (canônico):** oito valores — `rascunho` → `aguardando_confirmacao` → `confirmado` → `em_producao` → `pronto` → `saiu_entrega` → `entregue`; `cancelado` em qualquer etapa permitida por política. Transições detalhadas em [regras de negócio](../normativos/regras-negocio.md) RN-Pedidos. *(Antigo DOC-P01.)* | Planejamento 1 |
| **DEC-15** | **Super Admin da plataforma:** **fora do MVP núcleo**; escopo descrito em RF-Plataforma; **implementação candidata na Fase 4** com monetização/RBAC global, salvo priorização explícita no [backlog.md](backlog.md). *(Antigo DOC-P02.)* | P1 |
| **DEC-16** | **Sessão:** **access JWT** (TTL curto) + **refresh token** (ex.: cookie httpOnly ou endpoint dedicado de renovação). *(Antigo DOC-P03.)* | P2 |
| **DEC-17** | **Consumo físico de lotes:** transações garantindo estoque não negativo; **FEFO** quando `expiration_date` existir nos lotes elegíveis; se não houver validade, **FIFO por data de entrada** do lote. Refinar algoritmo depois sem bloquear MVP. *(Antigo DOC-P04 — distinto de DEC-09.)* | P3 |
| **DEC-18** | **ORM:** apenas **SQLAlchemy 2.x** no MVP; sem SQLModel no núcleo. *(Antigo DOC-P05.)* | Enterprise §4 |
| **DEC-19** | **URL da vitrine:** prioridade **`/loja/[slug]`** no mesmo domínio; **subdomínio** como evolução (Fase 4 / backlog). *(Antigo DOC-P06.)* | P2 |
| **DEC-20** | **Categorias:** entidade `categories` + FK em `products` na **Fase 2**, com filtros mínimos no catálogo. *(Antigo DOC-P07.)* | RF-Catalogo |

### ADR leve (contexto + consequência — revisão sugerida em ~6 meses)

Cada decisão abaixo resume **por que** foi escolhida e **o que isso obriga** no produto e no código.

- **DEC-01:** O produto é SaaS para muitas lojas; sem isolamento forte, vazamento de dados entre tenants seria inaceitável. **Consequência:** `store_id` em entidades de negócio, middleware de tenant em rotas autenticadas e proibição de query sem contexto de loja.

- **DEC-02:** Microsserviços antecipados aumentam custo operacional e superfície de falha para o estágio atual. **Consequência:** um backend modular monolítico com front separado; extração futura só onde houver ganho claro (filas, relatórios, etc.).

- **DEC-03:** A stack foi fixada para evitar debates repetidos e permitir contratação/onboarding previsíveis. **Consequência:** Next.js + FastAPI + PostgreSQL + Compose/Makefile como padrão; desvios exigem ADR novo.

- **DEC-04:** Binários grandes não devem ir para o banco relacional. **Consequência:** mídia em objeto compatível com S3 (ou Supabase Storage); URLs e metadados no app, não o arquivo no Postgres.

- **DEC-05:** Domínios distintos (pedidos, estoque, auth) precisam evoluir sem “bola de lama”. **Consequência:** cada módulo com router, service, repository, schemas e models próprios; dependências explícitas entre módulos.

- **DEC-06:** Clientes (web, futuro app) precisam evoluir sem quebrar integrações silenciosamente. **Consequência:** prefixo `/api/v1/`, envelope de resposta estável e mudanças compatíveis ou version bump.

- **DEC-07:** Regras espalhadas no ORM ou no repositório dificultam testes e mudança de persistência. **Consequência:** serviços concentram regra de negócio; repositório só persiste o que o serviço decidiu.

- **DEC-08:** Insumo e lotes respondem a necessidades diferentes (cadastro vs custo e validade). **Consequência:** `inventory_items` como mestre e `inventory_batches` para quantidade, custo e validade por entrada.

- **DEC-09:** Precificação precisa de método único no MVP para não multiplicar motores; FEFO é eixo físico (DEC-17), não de custo médio exibido. **Consequência:** média ponderada por insumo derivada dos lotes no MVP; FIFO/último custo ficam configuráveis depois.

- **DEC-10:** Usuários não especialistas precisam concluir tarefas sem suporte humano constante. **Consequência:** FieldHelp e textos auxiliares em campos críticos são requisito de produto, não “nice to have” de UI.

- **DEC-11:** Uso real é majoritariamente mobile em loja e vitrine. **Consequência:** layout e fluxos priorizam telas pequenas; desktop é secundário compatível.

- **DEC-12:** Qualidade sustentável exige barreira numérica mínima na camada de serviço. **Consequência:** meta de cobertura ≥ 90% (progressiva); CI e revisão usam esse alvo.

- **DEC-13:** API stateless com escopo por loja pede padrão de indústria para auth. **Consequência:** JWT no access; papéis e tenant na validação; refresh conforme DEC-16.

- **DEC-14:** Estados demais fragmentam UX e relatórios; de menos não cobrem entrega e WhatsApp. **Consequência:** oito status canônicos e transições em RN-Pedidos; qualquer novo estado exige revisão de relatório e vitrine.

- **DEC-15:** Super Admin global é produto comercial (planos, billing) distinto do núcleo loja. **Consequência:** Fases 1–3 não dependem de `platform_admin`; quando priorizado, Fase 4 ou backlog explícito.

- **DEC-16:** Access curto reduz janela de roubo de token; refresh evita login a cada poucos minutos. **Consequência:** implementar access + refresh (cookie httpOnly ou endpoint dedicado); não depender só de TTL longo no access.

- **DEC-17:** Baixa física deve respeitar validade e ordem de entrada sem misturar com método de custo médio (DEC-09). **Consequência:** transações com estoque não negativo; FEFO quando houver validade, senão FIFO por data de entrada do lote.

- **DEC-18:** SQLAlchemy 2.x é o padrão maduro para FastAPI + Alembic; SQLModel no núcleo duplicaria modelos. **Consequência:** apenas SQLAlchemy 2.x no MVP; SQLModel só se ADR permitir em módulo periférico.

- **DEC-19:** Subdomínio por loja complica cookies, DNS e SSL no primeiro deploy. **Consequência:** vitrine em `/loja/[slug]` no mesmo domínio; subdomínio como evolução documentada.

- **DEC-20:** Catálogo sem categoria escala mal para SEO e filtros. **Consequência:** entidade `categories` e FK em `products` na Fase 2; filtros mínimos no catálogo na mesma janela.

---

## Decisões de implementação MVP (Fase 2) — alinhamento DEC-14 / DEC-17 / DEC-20

Registo **2026-04-17** para desbloquear implementação com políticas explícitas; detalhe normativo em [regras-negocio.md](../normativos/regras-negocio.md).

| Decisão | Política MVP acordada |
|---------|------------------------|
| **DEC-14** | Sem integração automática WhatsApp ↔ sistema: **transições de status manuais e flexíveis** entre os oito valores (saltos livres), com histórico obrigatório; `entregue` e `cancelado` tratados como **terminais** no fluxo normal. **Evolução:** matriz de transições restrita (fluxo feliz + cancelamento regulado) quando existir orquestração ou integração — ver **RN-058** e **RN-059**. |
| **DEC-17** | **Primeira baixa física** na passagem do pedido a **`confirmado`**; ordenação de lotes FEFO/FIFO com desempate explícito; **reversão** de baixas ao cancelar pedido que já tinha consumido stock — ver **RN-071** e **RN-072**. |
| **DEC-20** | Categorias **planas** por loja, `slug` único por `store_id`, `products.category_id` **opcional**, filtros mínimos na API — ver **RN-034**. |

---

## Gates antes do desenvolvimento (checklist)

Use esta lista **antes de iniciar a implementação** de cada fase. Detalhes de escopo continuam nos arquivos `fase-0X-*.md`.

| Fase | Pré-requisitos obrigatórios | Observação |
|------|----------------------------|------------|
| **0 — Kickoff** | Monorepo e documentação alinhada; convenções de branch; critério de qualidade (testes/HTML) | Não exige DEC de pedido/categorias |
| **1 — Fundação** | DEC-16 (sessão), DEC-18 (ORM), DEC-19 (URL) **aceitos e refletidos em código** | Bloqueia auth completo e rotas Next |
| **2 — Operação** | DEC-14 (status pedido), DEC-17 (baixa de lote), DEC-20 (categorias) **modelados** (migrações + enums) | Bloqueia `orders`, catálogo filtrado, estoque por lote |
| **3 — Gestão** | DEC-09 + DEC-17 consistentes em serviços de precificação e produção | Receitas consomem lotes conforme RN |
| **4 — Escala** | DEC-15 se for implementar Super Admin / planos; CI/CD e observabilidade conforme fase | Opcional até priorizar backlog |

**Não bloqueiam a Fase 1:** DEC-15 (Super Admin), desde que não exista código de `platform_admin`.

**Bloqueiam início da Fase 2 sem decisão aplicada ao schema:** DEC-14, DEC-20, DEC-17 (política mínima em código).

---

## Glossário de papéis (mapeamento)

O [documento enterprise](../documento_enterprise.md) usa **Admin / Operador / Leitura** por loja. O planejamento em texto usa nomes adicionais:

| Nome no txt | Uso típico | Relação com §16 |
|-------------|------------|-------------------|
| `platform_admin` | Super Admin da plataforma | Fora do trio por loja; escopo global (**DEC-15**: pós-MVP núcleo) |
| `store_admin` | Dono/gestor da loja | ≈ **Admin** |
| `store_manager` (futuro) | Gestor sem poder total | ≈ **Operador** (ajustar permissões) |
| `customer` | Cliente da loja online | Autenticação na vitrine; só dados da própria loja |

**Cliente** não é staff da loja: pertence a **uma** loja e não deve acessar dados de outra.

---

## Histórico de pendências resolvidas (2026-04-18)

| Antigo ID | Tema | Resolução (DEC) |
|-----------|------|-----------------|
| DOC-P01 | Máquina de estados do pedido | **DEC-14** |
| DOC-P02 | Super Admin | **DEC-15** |
| DOC-P03 | Tokens | **DEC-16** |
| DOC-P04 | Consumo físico de lote (FEFO etc.) | **DEC-17** |
| DOC-P05 | ORM | **DEC-18** |
| DOC-P06 | URL da loja | **DEC-19** |
| DOC-P07 | Categorias | **DEC-20** |

---

## Melhorias sugeridas (não bloqueantes) — incorporadas

As sugestões abaixo foram **absorvidas** na documentação normativa (não ficam como pendência aberta):

| Tema | Onde ficou registrado |
|------|------------------------|
| **ADR leve** por DEC | Secção **ADR leve** acima (DEC-01 … DEC-20) |
| **OpenAPI** na Fase 1 | [documento enterprise](../documento_enterprise.md) §17; [requisitos não funcionais](../normativos/requisitos-nao-funcionais.md) **RNF-DevEx-08**; [fase-01-fundacao.md](../fases/fase-01-fundacao.md) |
| **PostgreSQL** — pin da imagem | [documento enterprise](../documento_enterprise.md) §20 (subseção reprodutibilidade); Compose ao implementar a Fase 1 |
| **Idempotência** pedidos + produção (Fase 3) | [requisitos não funcionais](../normativos/requisitos-nao-funcionais.md) **RNF-Arq-02a**, **RNF-Arq-02b**; [fase-03-gestao.md](../fases/fase-03-gestao.md) |
| **Matriz RN → teste** | [matriz RN → testes](../normativos/matriz-rn-testes.md); **RNF-QA-06**; [documento enterprise](../documento_enterprise.md) §21 |

---

## Equivalência de roadmaps (visão rápida)

Detalhes completos: [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) — seção «Equivalência com planejamento em texto».

| Texto (`inicio_planejamento`) | Repositório (`doc/fases`) |
|-------------------------------|---------------------------|
| MVP 1 (txt) | Aproximação: Fase 1 + parte da Fase 2 (loja operando com pedidos básicos) |
| MVP 2 (txt) | Fase 2 (insumos/lotes) + Fase 3 (receitas, produção, precificação) |
| MVP 3 (txt) | Fase 4 + itens de [backlog.md](backlog.md) enterprise |
| Etapas 1–5 (descoberta → implementação) | Metodologia; não substitui Fases 0–4 |
| Fases A–E (arquitetura txt) | A≈F0–1, B≈F2, C≈F2–3, D≈F3, E≈F4 + backlog |

Decisões normativas: tabela **Decisões já tomadas** acima (DEC-01 … DEC-20).
