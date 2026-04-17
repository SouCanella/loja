# Changelog de fases

Registro opcional de marcos por data.

## 2026-04-17 (Fase 0 — implementação concluída)

- **Código:** monorepo na raiz com `backend/` (FastAPI, pytest, Ruff, Dockerfile), `frontend/` (Next.js 14, Tailwind, Vitest, Dockerfile standalone), `docker-compose.yml` (Postgres 16-alpine + API + frontend), `Makefile` (`up`, `down`, `test`, `test-report`, `migrate`, `lint`, `backend-venv`), [.env.example](../../.env.example), [.gitignore](../../.gitignore).
- **Testes:** smoke pytest (`GET /health`) e Vitest; `make test` e `make lint` validados; `docker compose build` validado.
- **Documentação:** [fase-00-kickoff.md](../fases/fase-00-kickoff.md) Parte C (entregues, pendências P1–P5); [README.md](../README.md) na raiz do repo para desenvolvedores.
- **Pendências não bloqueantes:** ver tabela em fase-00 Parte C (audit npm, Vitest CJS, Alembic na Fase 1, SQLAlchemy, CI).

## 2026-04-17 (avaliações e layout vitrine)

- **Produto:** avaliações por produto **desativadas no padrão inicial**, ativação e **moderação** (aprovar/rejeitar) pelo admin; **layout** catálogo grade vs **lista em linhas** — [requisitos-funcionais.md](../normativos/requisitos-funcionais.md) RF-CF-07/08, RF-CA-09/10, RF-AV; [regras-negocio.md](../normativos/regras-negocio.md) RN-025–027, RN-033; [documento_enterprise.md](../documento_enterprise.md) §6–§8; RNF-SEC-09, RNF-UX-05.

## 2026-04-17 (estrutura `doc/`)

- **Reorganização:** pastas **[normativos/](../normativos/)** (regras de negócio, RF, RNF, matriz RN→testes) e **[projeto/](../projeto/)** (decisões DEC, backlog, rastreabilidade, proposta legada); `documento_enterprise.md` e `README.md` permanecem na raiz de `doc/`. Links internos e [proposta.md](../../proposta.md) atualizados.
- **Referência:** primeira linha de [inicio_planejamento.txt](../../inicio_planejamento.txt) alinhada à nova árvore.

## 2026-04-17 (continuação)

- **Melhorias não bloqueantes incorporadas:** ADR leve com **parágrafo (contexto + consequência) por DEC-01 … DEC-20** em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md); tabela «Melhorias sugeridas» substituída por «incorporadas» com referências cruzadas.
- **OpenAPI / Fase 1:** [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) **RNF-DevEx-08**; [fase-01-fundacao.md](../fases/fase-01-fundacao.md) (gates, escopo backend, critérios de aceite).
- **PostgreSQL:** pin de imagem no §20 do [documento_enterprise.md](../documento_enterprise.md); critério na Fase 1.
- **Idempotência:** [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) **RNF-Arq-02a** / **RNF-Arq-02b**; [fase-03-gestao.md](../fases/fase-03-gestao.md) (produção).
- **Matriz RN → teste:** [matriz-rn-testes.md](../normativos/matriz-rn-testes.md); **RNF-QA-06**; §21 enterprise e [README.md](../README.md).
- **Roadmap:** [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) — linhas Fase 1 / Fase 3 alinhadas a OpenAPI, pin Postgres e idempotência de produção.

## 2026-04-18 (tarde)

- **Fechamento DOC-P01–P07:** convertidos em **DEC-14 … DEC-20**; corrigido **DEC-09** (média ponderada vs FEFO em DEC-17); [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) com gates por fase e histórico de pendências.
- **Propagação:** [regras-negocio.md](../normativos/regras-negocio.md) (máquina de estados, RN atualizados), [documento_enterprise.md](../documento_enterprise.md) §8/§9, [requisitos-funcionais.md](../normativos/requisitos-funcionais.md), [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md), [rastreabilidade-fontes.md](../projeto/rastreabilidade-fontes.md).
- **Fases:** [fase-00-kickoff.md](../fases/fase-00-kickoff.md) a [fase-04-escala.md](../fases/fase-04-escala.md) com bloco «Documentação normativa» + gates; [README.md](../README.md) checklist pré-desenvolvimento; [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) nota DEC-14–20.

## 2026-04-18

- **Requisitos a partir de `inicio_planejamento.txt`:** criados [regras-negocio.md](../normativos/regras-negocio.md), [requisitos-funcionais.md](../normativos/requisitos-funcionais.md), [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md), [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md), [rastreabilidade-fontes.md](../projeto/rastreabilidade-fontes.md); [README.md](../README.md) e [documento_enterprise.md](../documento_enterprise.md) atualizados; [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) com equivalência MVP txt vs Fases 0–4; [backlog.md](../projeto/backlog.md) com ideias IP-*; [fase-02](../fases/fase-02-operacao.md)/[fase-03](../fases/fase-03-gestao.md) com referências a RN e DOC-P01/P04; primeira linha de [inicio_planejamento.txt](../../inicio_planejamento.txt) aponta para `doc/`.

## 2026-04-17

- **Documentação:** [documento_enterprise.md](../documento_enterprise.md) consolidado com a Proposta V4 (stack, pedidos/concorrência/idempotência, RBAC, API, FieldHelp, backlog §23, etc.); [proposta.md](../../proposta.md) na raiz virou atalho canônico; [proposta_plataforma_loja.md](../projeto/proposta_plataforma_loja.md) marcado como substituído; [README.md](../README.md), [backlog.md](../projeto/backlog.md), [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) e fases 0–4 atualizados para novas referências de seção (§3–§25).

## 2026-04-16

- **Planejamento roadmap:** criados [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) e planejamentos completos das Fases 1 a 4 (`fase-01` … `fase-04`); [fase-00-kickoff.md](../fases/fase-00-kickoff.md) atualizado (Parte A planejamento / Parte B execução).
- **Fase 0 (implementação):** ~~pendente~~ **concluída** em 2026-04-17 — ver entrada acima e [fase-00-kickoff.md](../fases/fase-00-kickoff.md) Parte C.
