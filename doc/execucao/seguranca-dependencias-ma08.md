# Dependências e auditoria (MA-08)

**Objectivo:** ciclo contínuo de actualização e resposta a avisos de segurança (`npm audit`, ecossistema Python quando aplicável).

## Frontend (npm)

| Comando | Uso |
|---------|-----|
| `make frontend-audit` | `cd frontend && npm audit` — lista vulnerabilidades conhecidas nas dependências transitivas. |
| `make security-audit` | Igual + lembrete para `pip-audit` no backend (opcional). |
| `npm audit fix` | Aplicar correcções **compatíveis** sem major bump; rever diff e `npm run test` + `npm run build`. |

**Notas:**

- O `package.json` usa **`overrides.glob`** (mitigação histórica); major de **Next.js** pode exigir planeamento à parte.
- Recomendação: correr `make frontend-audit` antes de releases ou mensalmente; registar decisões em [CHANGELOG-FASES.md](CHANGELOG-FASES.md) quando se alterem versões relevantes.

## Backend (pip)

- Ferramenta típica: **[pip-audit](https://pypi.org/project/pip-audit/)** contra `requirements.txt` (não está no Makefile por omissão para não inflar o venv).
- Comando sugerido: `cd backend && .venv/bin/pip install pip-audit && .venv/bin/pip-audit -r requirements.txt`

## DT-03 (cobertura)

- Gate de serviços: ver [TESTES-E-CI.md](TESTES-E-CI.md) e `make test-report`.
- Frontend: `npm run test:coverage` — inclui `lib/**/*.ts` (ver `vitest.config.ts`).
