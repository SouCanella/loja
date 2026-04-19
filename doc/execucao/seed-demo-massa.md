# Massa de dados de demonstração (30 dias)

Script que cria uma **loja fictícia** com insumos, categorias, produtos, receitas, **~187 pedidos** (estados variados), **~38 corridas de produção** e **datas repartidas pelos últimos 30 dias** na base de dados, para testes manuais do **painel**, **relatório financeiro** (incluindo barras de partilha por estado) e **vitrine**.

## Pré-requisitos

1. **Postgres** com o schema actual (Alembic aplicado): `make migrate` com serviços no ar.
2. **API FastAPI** a responder no URL configurado (omissão `http://127.0.0.1:8000`).
3. **Mesmo `DATABASE_URL`** que a API usa (ficheiro `.env` na raiz do repositório), porque o script ajusta `created_at` em `orders`, `production_runs` e movimentos de stock via SQLAlchemy.

## Execução

Na raiz do repositório (ou a partir de `backend/`):

```bash
make seed-demo-massa
```

Equivalente manual:

```bash
cd backend && .venv/bin/python scripts/seed_demo_mass.py
```

Variáveis opcionais:

| Variável | Significado |
|----------|-------------|
| `SEED_API_URL` | URL base da API (omissão `http://127.0.0.1:8000`). |
| `SEED_STORE_SLUG` | *Slug* da loja (omissão `loja-demo-massa`). |
| `SEED_STORE_NAME` | Nome da loja. |
| `SEED_ADMIN_EMAIL` | Email do admin (omissão `admin@demo-massa.example.com`; evite `.local`, o validador da API rejeita). |
| `SEED_ADMIN_PASSWORD` | Palavra-passe (omissão `DemoMassa#2026`). |

## Comportamento

- **Primeira execução:** regista a loja e o utilizador, cria catálogo e simulação.
- **Se já existirem produtos** nessa conta/loja, o script **termina com código 2** (evita duplicar dados). Use outro `SEED_STORE_SLUG` / email ou apague os dados de teste na BD.

## O que ver no produto

- **Vitrine:** `/loja/loja-demo-massa` (ajuste o *slug* se mudar `SEED_STORE_SLUG`).
- **Painel:** login com o email/password do *seed*; pedidos, receitas, insumos, relatório com período **últimos 30 dias**.
- **Gráficos:** a UI actual usa sobretudo tabelas e barras simples no relatório; não há biblioteca de gráficos dedicada — a massa de dados serve para essas visualizações e para navegação geral.

## Detalhes técnicos

- Pedidos com estados variados (`entregue`, `confirmado`, `aguardando_confirmacao`, etc.) e alguns **cancelados** (sem receita no relatório).
- Produção com `Idempotency-Key` única por corrida.
- *Seed* pseudo-aleatório fixo (`random.seed(42)`) para resultados reprodutíveis.
