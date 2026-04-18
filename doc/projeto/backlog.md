# Backlog

Itens **não concluídos** ou **parcialmente** entregues. Alinhado ao **§23 — Backlog enterprise** do [documento_enterprise.md](../documento_enterprise.md) e a débitos entre fases.

## Onde está documentado o que já foi entregue

O backlog **não duplica** o detalhe de trabalho fechado; use:

| Entrega | Documentação |
|---------|----------------|
| **Fase 0** (monorepo, Docker, Makefile, smoke tests, `README` raiz) | [fase-00-kickoff.md](../fases/fase-00-kickoff.md) **Parte C** (entregue + pendências P1–P5) e **Parte B** (status concluído) |
| **Fase 1** (Postgres, Alembic, JWT, multi-tenant, OpenAPI estático, auth `/api/v1`, vitrine/painel stub) | [fase-01-fundacao.md](../fases/fase-01-fundacao.md) secção **10**; [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md); [doc/api/README.md](../api/README.md) |
| **Fase 2** (backend + vitrine; ressalvas §10.4) | [fase-02-operacao.md](../fases/fase-02-operacao.md) secções **3**, **8**, **9**, **§10**; [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) |
| **Fase 3** (receitas, produção idempotente, relatório financeiro, painel Next, `GET /inventory-items`, `/me` com slug) | [fase-03-gestao.md](../fases/fase-03-gestao.md) **§8–§10**; [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) |
| **Qualidade / RNF** (auditoria vs normas, cobertura, lacunas) | [qualidade-e-conformidade.md](qualidade-e-conformidade.md) |
| Marco / changelog | [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) |
| Índice `doc/` | [README.md](../README.md) — linha sobre `README.md` na raiz e testes |
| Norma de testes HTML | [README.md](../README.md) secção *Testes e relatórios HTML* |

Commits na `main` com mensagem `feat(phase-0): …` fecham o registro técnico no Git.

## Legenda

- **Estado:** `nao_iniciado` | `parcial` | `bloqueado` | `convertido` (promovido a requisito normativo)
- **Origem:** enterprise | mvp | tecnico

---

## Melhorias de engenharia (MA-*) — pós-validação Fase 0

Sugestões de **arquitetura e qualidade** alinhadas ao [documento_enterprise.md](../documento_enterprise.md) §5 (multi-tenant) e §20; não estavam como linhas explícitas até o mapeamento abaixo. **Estado** reflete se já existe norma/código.

| ID | Item | Estado | Fase alvo | Notas |
|----|------|--------|-----------|--------|
| MA-01 | Testes de **integração** que provam **isolamento por `store_id`** (não vazar dados entre lojas) | parcial | 1 | Cobertura inicial em pytest (BD em memória); reforço com Postgres real em CI — ver testes em `backend/tests/test_auth.py` |
| MA-02 | Contrato HTTP com prefixo versionado (**ex. `/api/v1`**) desde o primeiro conjunto de rotas de negócio | convertido | 1 | Rotas sob `/api/v1`; OpenAPI em [doc/api/openapi.json](../api/openapi.json) |
| MA-03 | **Storage** de ficheiros (imagens, logos) com **prefixo por `store_id`** ou tenant no bucket (S3-compatível) | nao_iniciado | 2+ | Alinha a **RF-CA-03** e §4 enterprise (storage) |
| MA-04 | **Índices compostos** `(store_id, …)` nas tabelas mais consultadas (produtos, pedidos, etc.) | nao_iniciado | 1–2 | Performance e clareza de modelo multi-tenant |
| MA-05 | **Row Level Security (RLS)** no Postgres como reforço opcional de isolamento | nao_iniciado | 4 / hardening | Avaliar custo operacional vs benefício; alternativa ao erro de aplicação |
| MA-06 | **Read replicas** ou **sharding** por tenant | nao_iniciado | pós-MVP | Só se o monólito + uma BD deixarem de chegar; documentar gatilho |
| MA-07 | **Next.js:** `route groups` separando **vitrine** `(public)/loja/[slug]` e **painel** `(painel)` / admin | nao_iniciado | 1 | Alinha **RF-AR-01** e reduz mistura de contextos |
| MA-08 | Ciclo de **atualização de dependências** (npm / Next) e resposta a **audit/CVE** | parcial | contínuo | Liga às pendências P1 em [fase-00-kickoff.md](../fases/fase-00-kickoff.md) Parte C |
| MA-09 | **Vitest:** migrar config para **ESM** (fim do aviso CJS da API Vite) | nao_iniciado | técnico | Liga à pendência P2 (fase-00 Parte C) |

**Relação com itens existentes:** **BE-05** (multi-usuário por loja) e **MVP-01** cobrem parte do modelo; MA-01 e MA-07 explicitam **teste de isolamento** e **estrutura de rotas** no front.

---

## Backlog enterprise (§23)

| ID | Item | Estado | Notas |
|----|------|--------|-------|
| BE-01 | Eventos sazonais (reforço em comparativos) | nao_iniciado | origem enterprise |
| BE-02 | Pagamentos | nao_iniciado | origem enterprise |
| BE-03 | App mobile | nao_iniciado | origem enterprise |
| BE-04 | BI avançado | nao_iniciado | origem enterprise |
| BE-05 | Multi-usuário por loja | parcial | modelo prevê `users`; RBAC (Admin / Operador / Leitura) e convites — ver §16 do enterprise |
| BE-06 | Assinatura SaaS / monetização | nao_iniciado | inclui **limite por plano** quando aplicável |
| BE-07 | Cache de catálogo | nao_iniciado | §23 proposta consolidada |
| BE-08 | Offline mode | nao_iniciado | §23 |
| BE-09 | Multi-moeda | nao_iniciado | §23 |

## MVP ([documento_enterprise.md](../documento_enterprise.md) §22)

Escopo MVP: autenticação, catálogo, pedidos, estoque básico, receitas, precificação simples.

| ID | Requisito | Estado | Dependência |
|----|-----------|--------|-------------|
| MVP-01 | Autenticação (JWT) | parcial | Fase 1 (access token); refresh token — backlog / DEC-16 |
| MVP-02 | Catálogo | parcial | Vitrine `/loja/[slug]`; imagens S3 e destaques RF-CA-11 — evolução |
| MVP-03 | Pedidos | parcial | API Fase 2; painel: lista (filtro), novo (`POST /orders`), detalhe (estado + WhatsApp); vitrine/checkout; evoluções em [fase-03 §9.1](../fases/fase-03-gestao.md) |
| MVP-04 | Estoque básico | parcial | Lotes + baixa/reversão na API; leitura/ajuste dedicados e UI — ver [fase-02 §9](../fases/fase-02-operacao.md) |
| MVP-05 | Receitas | parcial | API + painel (criar/listar/produzir); evoluções em [fase-03 §9.1](../fases/fase-03-gestao.md) |
| MVP-06 | Precificação simples | parcial | Custo estimado na API + sugestão indicativa no painel; **margem fixa na UI** — configurável em backlog |

Atualizar esta tabela ao fechar cada fase.

## Débitos técnicos e evolução

| ID | Item | Estado | Origem |
|----|------|--------|--------|
| DT-01 | CI/CD (pipeline Git, build Docker, deploy) | parcial | GitHub Actions: lint + pytest (cobertura `app/services`) + frontend lint/build — ver [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); deploy Docker pendente |
| DT-02 | Observabilidade (métricas/dashboards além de logs MVP) | nao_iniciado | §20 / §4 |
| DT-03 | Cobertura de testes ≥ 90% | parcial | §21 — meta progressiva; ver [qualidade-e-conformidade.md](qualidade-e-conformidade.md) |

## Ideias de produto (origem `inicio_planejamento.txt`)

Itens de **melhoria** ou pesquisa; não são compromissos de escopo até promovidos a BE/MVP. Estado inicial: `ideia`.

| ID | Ideia | Estado | Notas |
|----|-------|--------|-------|
| IP-01 | Categorias e produtos em destaque / “novo” / mais vendido | convertido | Ver **RF-CA-11**; exemplo em [mockups/loja-vitrine-layout-sugestao.html](../mockups/loja-vitrine-layout-sugestao.html) |
| IP-02 | Agenda de produção planejada por dia | ideia | P1 |
| IP-03 | Promoções: combos, desconto por quantidade, produto promocional | ideia | P1 |
| IP-04 | Disponibilidade por dia/horário (ex.: só fim de semana) | ideia | P1 |
| IP-05 | Observações por item de pedido (sem granulado, embalagem especial) | ideia | P1 |
| IP-06 | Métricas de recompra, clientes inativos, frequência | ideia | P1 |
| IP-07 | WhatsApp: template rico (nome, itens, total, endereço) | ideia | P1 |
| IP-08 | Domínio próprio / cupons / entrega (expansão P1 §4) | ideia | Alinhar a BE-06 / roadmap |
| IP-09 | Avaliações com **foto** ou vídeo curto (além de nota + texto) | ideia | Depende de RF-AV base |
| IP-10 | Resposta pública do lojista a um comentário aprovado | ideia | Moderação RF-AV |

Promover uma ideia: criar entrada em BE-* ou vincular a uma fase em `doc/fases/` e remover ou marcar como `convertido` aqui.

## Como sincronizar

Ao concluir trabalho de uma fase, **remova ou atualize** linhas aqui e registre o que foi entregue no arquivo `doc/fases/fase-0X-*.md` correspondente (Parte C / relatório), em [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) e, para MA-*, nesta tabela.
