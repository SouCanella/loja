# Fase 0 — Kickoff

**Referência:** [documento_enterprise.md](../documento_enterprise.md)  
**Roadmap mestre:** [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) (fases 0 a 4)

## Documentação normativa (leitura para esta fase)

- [regras-negocio.md](../normativos/regras-negocio.md)
- [requisitos-funcionais.md](../normativos/requisitos-funcionais.md)
- [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md)
- [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) — gates por fase

### Gates antes de implementar esta fase

- Repositório e `doc/` coerentes com o planejamento; convenções de branch e qualidade (testes/relatórios HTML) definidas.
- Não é necessário ter implementado autenticação completa nem pedidos (isso é Fase 1+).

---

## Parte A — Planejamento (referência fixa)

Use esta seção como **contrato** do que a Fase 0 deve entregar em termos de processo e base técnica. Se algo mudar, atualize aqui e o [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md).

### Objetivo

Formalizar o início do projeto: estrutura de documentação em `doc/`, decisões de repositório, convenções mínimas e contrato de qualidade (testes com relatórios HTML), **sem** exigir todas as features de negócio do MVP.

### Não-objetivos (Fase 0)

- Implementar catálogo completo, pedidos, receitas ou relatórios financeiros.
- Atingir 90% de cobertura global (meta progressiva conforme [documento_enterprise.md](../documento_enterprise.md) §21).
- CI/CD completo (previsto para evolução na Fase 4 / §24).

### Decisão de repositório

**Monorepo** na raiz do projeto:

- `frontend/` — Next.js (App Router), TypeScript, Tailwind, React Query (conforme evolução).
- `backend/` — FastAPI, SQLAlchemy 2.x, Alembic, Pydantic.
- `doc/` — documentação e registro por fase.
- Orquestração local: Docker Compose + Makefile.

### Convenções

- **Branches:** `main` estável; features em `feature/<nome-curto>`; correções em `fix/<nome-curto>`.
- **Ambiente:** copiar `.env.example` para `.env` na raiz (e ajustar por serviço se necessário). Nunca commitar segredos.
- **Multi-tenant:** toda consulta a dados de negócio deve incluir filtro por `store_id` (middleware obrigatório nas rotas autenticadas — evolução na Fase 1).

### Planejamento das demais fases

Os documentos abaixo descrevem **todo o roadmap** (entregáveis, critérios de aceite, riscos). Podem ser revisados a qualquer momento; mantenha o roadmap mestre alinhado.

| Fase | Documento |
|------|-----------|
| 1 — Fundação | [fase-01-fundacao.md](fase-01-fundacao.md) |
| 2 — Operação | [fase-02-operacao.md](fase-02-operacao.md) |
| 3 — Gestão | [fase-03-gestao.md](fase-03-gestao.md) |
| 4 — Escala | [fase-04-escala.md](fase-04-escala.md) |

### Definição de pronto (Fase 0 — execução)

- [ ] `doc/README.md`, `d../projeto/backlog.md` e este arquivo coerentes com o repositório.
- [ ] Esqueleto `frontend/` e `backend/` com serviços subindo via Docker Compose.
- [ ] Makefile na raiz com `up`, `down`, `test`, `migrate`, `lint` (migrate/lint podem ser mínimos até Alembic/ESLint plenos).
- [ ] Pelo menos um teste smoke por camada (backend e frontend).
- [ ] Relatórios HTML de teste documentados em [doc/README.md](../README.md) e geráveis via `make test-report`.

### Relatórios HTML

Política: artefatos em `backend/htmlcov/`, `backend/reports/`, `frontend/coverage/`, `frontend/playwright-report/` ficam fora do Git; reprodução descrita em [doc/README.md](../README.md).

### Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Monorepo aumenta tempo de CI | Pipeline única na Fase 4; localmente `make test` por pasta |
| 90% de cobertura cedo demais | Exigir aumento gradual; documentar percentual atual nas fases |
| E2E frágil no início | Playwright opcional; priorizar API + unit no MVP |

---

## Parte B — Estado da execução

| Campo | Valor |
|-------|--------|
| **Planejamento (docs fases 0–4)** | Concluído — ver [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) |
| **Status da implementação da Fase 0** | `em_andamento` ou `pendente` (atualizar ao subir código/Docker) |
| **Data última atualização** | 2026-04-16 |

**Próximo passo após fechar a checklist da Parte A:** executar [fase-01-fundacao.md](fase-01-fundacao.md) (Docker estável, JWT, middleware de tenant, tabelas iniciais, Next com auth e layout mobile-first).
