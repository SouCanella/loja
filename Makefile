.PHONY: up down test test-report migrate lint help backend-venv

help:
	@echo "Comandos: up | down | test | test-report | migrate | lint | backend-venv"

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

migrate:
	@echo "Fase 0: Alembic será configurado na Fase 1 — nada a aplicar."
	@true

lint: backend-venv
	cd backend && .venv/bin/ruff check app tests
	cd frontend && npm run lint
