# Deploy com Docker (DT-01)

**Objectivo:** documentar como validar **imagens de produção** e alinhar o stack `docker compose` a ambientes reais (sem substituir runbooks de cloud específicos).

## 1. O que já existe na raiz

| Ficheiro | Uso |
|----------|-----|
| [`docker-compose.yml`](../../docker-compose.yml) | Postgres + backend + frontend para **desenvolvimento local** integrado (`make up`). |
| [`backend/Dockerfile`](../../backend/Dockerfile) | Imagem da API (uvicorn). |
| [`frontend/Dockerfile`](../../frontend/Dockerfile) | Build Next.js **standalone**; `ARG NEXT_PUBLIC_API_URL` deve apontar para a URL **pública** da API que o browser vai chamar. |

## 2. Verificar build das imagens (gate local / CI)

```bash
docker build -t loja-backend:local ./backend
docker build -t loja-frontend:local --build-arg NEXT_PUBLIC_API_URL=https://api.exemplo.com ./frontend
```

O workflow [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) inclui um job **`docker-images`** que executa estes builds em cada push/PR — **não publica** imagens num registry (isso fica para o runbook de deploy da equipa).

## 3. Produção / staging (orientação)

- **Segredos:** `JWT_SECRET`, credenciais Postgres e (se aplicável) S3 — via variáveis de ambiente do orquestrador, **nunca** valores por omissão do compose de desenvolvimento.
- **HTTPS:** obrigatório para cookies / vitrine; reverso (Traefik, Nginx, load balancer) termina TLS e encaminha para os contentores.
- **Frontend:** `NEXT_PUBLIC_API_URL` é **injectada no build** (`ARG`/`ENV` no Dockerfile); alterar a API pública implica **novo build** da imagem frontend.
- **Base de dados:** migrar com `alembic upgrade head` antes ou no arranque controlado do backend (política da equipa).
- **Observabilidade:** cabeçalho `X-Request-Id` e notas em [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) §9.

## 4. Pendências explícitas (não automatizadas no repo)

- Push para **GHCR / ECR / outro registry** e `docker compose pull` em VM.
- **Healthchecks** e **restart policies** no orquestrador de produção.
- Pipeline de **CD** (deploy automático após tag) — continua em [backlog.md](../projeto/backlog.md) **DT-01**.

---

*Última revisão: 2026-04-21.*
