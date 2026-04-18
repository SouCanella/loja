#!/usr/bin/env bash
# Desenvolvimento local: Postgres em Docker + API (uvicorn --reload) + Next.js (dev).
# Uso: na raiz do repositório, `make dev` (requer Docker, Python venv em backend/, npm no frontend).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

PG_PORT="${POSTGRES_HOST_PORT:-5433}"
export DATABASE_URL="${DATABASE_URL:-postgresql+psycopg://loja:loja@127.0.0.1:${PG_PORT}/loja_dev}"

echo ">> Postgres (Docker compose, só serviço postgres)…"
docker compose up -d postgres

echo ">> A aguardar TCP ${PG_PORT}…"
ok=0
for _ in $(seq 1 40); do
  if command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 "${PG_PORT}" 2>/dev/null; then
    ok=1
    break
  fi
  sleep 0.5
done
if [ "$ok" != 1 ]; then
  echo "ERRO: Postgres não respondeu em 127.0.0.1:${PG_PORT}. Ajuste POSTGRES_HOST_PORT / DATABASE_URL no .env."
  exit 1
fi

echo ">> Migrações Alembic…"
make migrate

if [ ! -d frontend/node_modules ]; then
  echo ">> npm ci (frontend)…"
  (cd frontend && npm ci)
fi

echo ""
echo ">> Serviços de desenvolvimento:"
echo "   API:    http://127.0.0.1:8000  (reload)"
echo "   Next:   http://127.0.0.1:3000"
echo "   Health: http://127.0.0.1:8000/health"
echo "   CTRL+C termina API e Next (o contentor Postgres fica a correr)."
echo ""

cleanup() {
  # shellcheck disable=SC2046
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(
  cd backend && exec .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
(
  cd frontend && exec npm run dev
) &
wait
