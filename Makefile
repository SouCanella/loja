.PHONY: up down dev test test-report migrate lint openapi-export help backend-venv

help:
	@echo "Comandos: up | down | dev | test | test-report | migrate | openapi-export | lint | backend-venv"

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

lint: backend-venv
	cd backend && .venv/bin/ruff check app tests
	cd frontend && npm run lint
