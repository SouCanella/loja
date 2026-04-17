# Requisitos não funcionais

**Origem:** [documento_enterprise.md](../documento_enterprise.md), [inicio_planejamento.txt](../../inicio_planejamento.txt) (P1 RNFs, P2 segurança/observabilidade).  
**Decisões técnicas:** [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) (DEC-16, DEC-18, etc.).

---

## RNF-SEC — Segurança

| ID | Requisito | Ref. |
|----|-----------|------|
| RNF-SEC-01 | Isolamento estrito por loja em toda camada (RN-001–RN-005) | P1 |
| RNF-SEC-02 | Autorização por papel e tenant; negação por padrão | P2 |
| RNF-SEC-03 | JWT access seguro + refresh (**DEC-16**); rotação e armazenamento seguro do refresh | P2 |
| RNF-SEC-04 | **Rate limiting** em login e endpoints sensíveis | P2 |
| RNF-SEC-05 | CORS explícito por ambiente | P2 |
| RNF-SEC-06 | **Secrets** apenas em variáveis de ambiente; nunca no repositório | P2 |
| RNF-SEC-07 | **Backup** de banco de dados (política por ambiente) | P2 |
| RNF-SEC-08 | Uploads: validar tipo e tamanho; armazenar com **UUID**; não confiar no nome original | P2 |
| RNF-SEC-09 | Com **avaliações ativas**: limitar taxa de submissão de comentários e validar entrada (anti-spam / abuso) por IP ou por cliente | E, RF-AV |

---

## RNF-PERF — Performance e escalabilidade

| ID | Requisito | Ref. |
|----|-----------|------|
| RNF-PERF-01 | Catálogo e listagens com tempo de resposta adequado ao uso em mobile | P1 |
| RNF-PERF-02 | Imagens otimizadas (formato/tamanho); lazy loading onde aplicável | P1 |
| RNF-PERF-03 | Consultas com **índices** adequados; filtro por `store_id` em consultas de negócio | P1 |
| RNF-PERF-04 | Storage de mídia fora do processo da API (objeto/S3) | P2 |
| RNF-PERF-05 | Cache de catálogo como melhoria futura (ver backlog BE-07) | Enterprise |

---

## RNF-UX — Usabilidade e acessibilidade operacional

| ID | Requisito | Ref. |
|----|-----------|------|
| RNF-UX-01 | **Mobile-first** loja e admin; evitar hover como requisito | P5 |
| RNF-UX-02 | Tabelas largas viram cards em telas pequenas; formulários por etapas | P5 |
| RNF-UX-03 | Painel intuitivo para não especialistas (pequenos lojistas) | P1 |
| RNF-UX-04 | Mensagens de erro: simples para cliente final; detalhadas para admin (enterprise §18) | Enterprise |
| RNF-UX-05 | Vista **lista em linhas** do catálogo: legível em mobile (alinhamento imagem/preço, áreas de toque adequadas); paridade de informação com a vista em grade | E, RN-027 |

---

## RNF-QA — Qualidade e testes

| ID | Requisito | Ref. |
|----|-----------|------|
| RNF-QA-01 | Cobertura de testes unitários **≥ 90%** na camada de serviço (meta progressiva por fase) | P1, §21 |
| RNF-QA-02 | Testes de integração para fluxos críticos: auth, tenant, produto, pedido, produção, isolamento | P1 |
| RNF-QA-03 | Testes E2E (ex.: Playwright) em pipeline conforme maturidade | P2 |
| RNF-QA-04 | Prioridade unitária: pricing, recipe, production, stock, order, tenant guard | P2 |
| RNF-QA-05 | Critérios de aceite documentados **antes** da implementação por marco (fases) | P1 |
| RNF-QA-06 | Rastreabilidade **RN → casos de teste** documentada na [matriz-rn-testes.md](matriz-rn-testes.md); atualizar ao fechar cada fase ou feature | Evolução |

---

## RNF-DevEx — Ferramentas e padrões

| ID | Requisito | Ref. |
|----|-----------|------|
| RNF-DevEx-01 | Docker Compose para dev local; serviços `frontend`, `backend`, `postgres` | Enterprise §20 |
| RNF-DevEx-02 | Makefile na raiz: `up`, `down`, `test`, `migrate`, `lint` (extensível) | P2 |
| RNF-DevEx-03 | Backend: **Ruff** (lint/format); **pytest** + **pytest-cov**; factories para testes | P2 |
| RNF-DevEx-04 | Frontend: ESLint + Prettier; **Vitest** + Testing Library | P2 |
| RNF-DevEx-05 | **Mypy** (opcional/parcial) em módulos críticos | P2 |
| RNF-DevEx-06 | Migrações sempre versionadas (**Alembic**); proibir alteração manual ad hoc em produção | P2 |
| RNF-DevEx-07 | ORM: **SQLAlchemy 2.x** apenas no MVP (**DEC-18**) | P2 |
| RNF-DevEx-08 | **OpenAPI 3** gerada pelo FastAPI (ex.: `/openapi.json`), acessível em dev; opcional publicar artefato em CI; base para tipos cliente e testes de contrato — **Fase 1** | Enterprise §17 |

---

## RNF-Ops — Observabilidade e operação

| ID | Requisito | Ref. |
|----|-----------|------|
| RNF-Ops-01 | Logs estruturados MVP: request id, user id, `store_id` quando aplicável | P2, §20 |
| RNF-Ops-02 | Respostas de API padronizadas (envelope §17) | Enterprise |
| RNF-Ops-03 | Métricas e tracing: evolução (Prometheus/Grafana ou equivalente) | §20 |
| RNF-Ops-04 | Ambientes: local (Compose); homologação; produção — destinos cloud **não prescritos** (Vercel, Neon, etc. são opções) | P2 |

---

## RNF-Arq — Arquitetura e integridade

| ID | Requisito | Ref. |
|----|-----------|------|
| RNF-Arq-01 | DTOs/schemas separados do modelo ORM na fronteira da API | P2 |
| RNF-Arq-02a | **Idempotência em pedidos:** `idempotency_key` (ou header equivalente) na criação/atualização sensível de pedido | §12, RN-056 |
| RNF-Arq-02b | **Idempotência em produção (Fase 3):** operações `POST /api/v1/production` (ou equivalente) que disparam baixa de insumos e entrada de produto acabado devem aceitar **idempotency key** ou deduplicação por `(store_id, referência externa, janela temporal)` para evitar dupla produção em retry | Fase 3 |
| RNF-Arq-03 | **Soft delete** onde definido (produto, cliente, receita) para preservar histórico | P2 |
| RNF-Arq-04 | Domínio primeiro: regras não exclusivas do frontend | P2 |

---

## RNF-AUD — Auditoria

| ID | Requisito | Ref. |
|----|-----------|------|
| RNF-AUD-01 | Registrar ações críticas (estoque, pedido, preço, produção) — MVP mínimo; evolução before/after | P1, §16 |
