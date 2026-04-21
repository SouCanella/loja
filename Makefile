.PHONY: up down dev test test-report migrate lint openapi-export seed-demo-massa help backend-venv frontend-audit security-audit

help:
	@echo "Comandos: up | down | dev | test | test-report | migrate | openapi-export | seed-demo-massa | lint | backend-venv | frontend-audit | security-audit"

# Cria backend/.venv na primeira utilização (PEP 668 / Debian).
backend-venv:
	@if [ ! -x backend/.venv/bin/pytest ]; then \
	  echo ">> Criando backend/.venv e instalando dependências…"; \
	  cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt; \
	fi

up:
	docker compose up -d --build

down:
	docker compose down

# Postgres em Docker + uvicorn --reload + next dev (testar painel/vitrine manualmente).
dev: backend-venv
	@chmod +x scripts/dev-local.sh
	@./scripts/dev-local.sh

test: backend-venv
	cd backend && .venv/bin/pytest tests/ -q
	cd frontend && npm run test

test-report: backend-venv
	mkdir -p backend/reports/pytest
	cd backend && .venv/bin/pytest tests/ -v \
		--cov=app \
		--cov-report=html \
		--html=reports/pytest/report.html \
		--self-contained-html
	cd frontend && npm run test:coverage

migrate: backend-venv
	@cd backend && .venv/bin/alembic upgrade head

# Gera doc/api/openapi.json (+ use doc/api/index.html com servidor estático) sem subir a API.
openapi-export: backend-venv
	@cd backend && .venv/bin/python scripts/export_openapi.py

# Massa de dados (~30 dias) para testes manuais — requer API no ar e mesmo DATABASE_URL que o backend.
seed-demo-massa: backend-venv
	cd backend && .venv/bin/python scripts/seed_demo_mass.py

lint: backend-venv
	cd backend && .venv/bin/ruff check app tests
	cd frontend && npm run lint

# MA-08 — auditoria de dependências (requer rede). Corrigir com `npm audit fix` no frontend quando seguro.
frontend-audit:
	cd frontend && npm audit

security-audit: frontend-audit
	@echo "Opcional Python: pip-audit no venv — cd backend && .venv/bin/pip install pip-audit && .venv/bin/pip-audit -r requirements.txt"
