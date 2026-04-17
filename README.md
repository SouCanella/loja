# Loja — monorepo

SaaS multi-tenant para gestão de lojas caseiras. Documentação canónica em [`doc/documento_enterprise.md`](doc/documento_enterprise.md).

## Requisitos

- Docker e Docker Compose v2
- Node.js 20+ e npm (testes e lint do frontend localmente)
- Python 3.12+ (testes e lint do backend localmente)

## Primeiros passos

```bash
cp .env.example .env
make test        # cria backend/.venv se necessário (PEP 668); pytest + vitest
make up          # Postgres + API (porta 8000) + frontend (porta 3000)
```

Requer **Node.js 20+** e **Python 3.12+** para comandos locais fora do Docker. O alvo `make backend-venv` (ou qualquer alvo que dependa dele) instala dependências Python em `backend/.venv`.

- API: `GET http://localhost:8000/health`
- Frontend: `http://localhost:3000`
- OpenAPI (FastAPI): `http://localhost:8000/docs`

Mais detalhes: [`doc/README.md`](doc/README.md) e [`doc/fases/fase-00-kickoff.md`](doc/fases/fase-00-kickoff.md).

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `backend/` | FastAPI, testes pytest |
| `frontend/` | Next.js 14 (App Router), Tailwind, Vitest |
| `doc/` | Normativos, fases, mockups |

## Convenções de branch

- `main` — estável
- `feature/<nome>` — funcionalidades
- `fix/<nome>` — correções
