# Rastreabilidade — `inicio_planejamento.txt` → documentação

Este arquivo mapeia o material bruto [inicio_planejamento.txt](../../inicio_planejamento.txt) para os artefatos normativos em `doc/`. Use-o para auditoria e para não perder contexto ao evoluir requisitos.

## Observações iniciais (linhas 1–17)

| Tema | Destino na documentação |
|------|-------------------------|
| Multi-loja, login, cliente por loja, catálogo, tema, pedidos WhatsApp + manual | [requisitos-funcionais.md](../normativos/requisitos-funcionais.md) RF-Auth, RF-Loja, RF-Pedidos |
| Insumo com validade e mesmo insumo com valores diferentes | [regras-negocio.md](../normativos/regras-negocio.md) RN-Estoque, RF-Estoque |
| Custos indiretos, tempo na receita, calculadora, financeiro com perdas e comparativos | RN-Receita, RN-Precificação, RN-Financeiro; RF correspondentes |
| Tooltips, mobile-first | [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) RNF-UX; RF-Ajuda |
| Testes >90%, Docker, Makefile | RNF-QA, RNF-DevEx; [documento_enterprise.md](../documento_enterprise.md) §20–§21 |

## Planejamento 1 (≈ linhas 22–940)

| Bloco | Conteúdo | Destino |
|-------|----------|---------|
| Visão, proposta de valor, segmentos | §1 enterprise; RF-Visão | |
| Multi-tenant, perfis Super Admin / Lojista / Cliente | RF-Plataforma, RF-Auth; [decisoes-e-pendencias.md](decisoes-e-pendencias.md) (escopo Super Admin) | |
| Módulos 1–10 (auth, config, catálogo, clientes, pedidos, estoque, receitas, precificação, financeiro, dashboard) | RF por módulo | |
| Status de pedido (lista longa), origem, manual com desconto | RF-Pedidos; RN-Pedidos | |
| Tipos estoque insumo vs final; movimentações; riscos | RN-Estoque | |
| Entidades User…AuditLog | [requisitos-funcionais.md](../normativos/requisitos-funcionais.md) anexo resumo; enterprise §6 | |
| Opções stack A/B/C → consolidação FastAPI+Next | [decisoes-e-pendencias.md](decisoes-e-pendencias.md) decisões fechadas | |
| RNFs segurança/performance/escala/usabilidade/auditoria | [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) | |
| Testes unitários/integração/E2E futuro | RNF-QA | |
| Ideias: categorias/destaques, agenda produção, promoções, disponibilidade por dia, métricas recompra, WhatsApp rico | [backlog.md](backlog.md) ideias IP-* | |
| MVP 1/2/3 (txt) | [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) equivalências | |

## Planejamento 2 (≈ linhas 942–1576)

| Bloco | Destino |
|-------|---------|
| Front/back separados, camadas, multi-tenant | enterprise §3–§5; RNF-Arq | |
| Estrutura `backend/app/modules/…`, `frontend/src/app/(public|admin|platform)` | RF-Arquitetura front/back | |
| JWT, roles platform_admin, store_admin, customer | RN-Segurança; [decisoes-e-pendencias.md](decisoes-e-pendencias.md) mapeamento RBAC | |
| Modelo conceitual DB (núcleos) | enterprise §6; RF-Dados | |
| Domain-first, service/repository, DTOs, idempotência, auditoria, soft delete | RN-Geral; RNF-Arq | |
| Docker Compose, Makefile alvos, Ruff, pytest, Vitest, Playwright | RNF-DevEx; enterprise §20 | |
| Observabilidade, erros padronizados, ambientes | RNF-Ops | |
| Segurança: rate limit, backup, uploads UUID | RNF-SEC | |
| Roadmap arquitetural A–E | PLANO equivalências | |

## Planejamento 3 (≈ linhas 1578–2204)

| Bloco | Destino |
|-------|---------|
| Insumo mestre vs entradas/lotes; tabelas `inventory_items`, `inventory_batches`, `stock_movements` | RN-Estoque; RF-Estoque | |
| Custo médio ponderado MVP; FIFO futuro; FEFO consumo | RN-Estoque; **DEC-09**, **DEC-17** | |
| Regras 1–4 (preço da verdade nos lotes; validade por lote; consumo por lote) | RN-Estoque | |
| Telas cadastro, entrada, histórico | RF-Estoque | |

## Planejamento 4 (≈ linhas 2206–2714)

| Bloco | Destino |
|-------|---------|
| Receita: tempo, perda %, custo indireto adicional, observação processo | RN-Receita; RF-Receita | |
| Custos indiretos nível loja vs receita | RN-Precificação; RF-CustosIndiretos | |
| Precificação modo automático + manual assistido; simulador separado | RN-Precificação; RF-Precificação | |
| Financeiro: tipos de perda, painel com lucro após perdas, comparativos | RN-Financeiro; RF-Financeiro | |
| `indirect_costs`, `seasonal_events`, `loss` vs movements | RF-Dados; backlog BE | |
| MVP vs fase 2 (eventos sazonais inteligentes) | backlog; decisoes | |

## Planejamento 5 (≈ linhas 2716–3117)

| Bloco | Destino |
|-------|---------|
| Tooltips requisito oficial; metadados ajuda; mobile-operational | RF-Ajuda; RNF-UX | |
| Monolito modular vs microsserviços (não MS agora) | [decisoes-e-pendencias.md](decisoes-e-pendencias.md) | |
| Regras textuais admin/UX/arquitetura | enterprise §2, §15; RNF | |

---

**Norma:** alterações de produto devem atualizar [regras-negocio.md](../normativos/regras-negocio.md), [requisitos-funcionais.md](../normativos/requisitos-funcionais.md) ou [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) e, se necessário, uma linha de [rastreabilidade-fontes.md](rastreabilidade-fontes.md) quando a origem não for mais só o `.txt`.
