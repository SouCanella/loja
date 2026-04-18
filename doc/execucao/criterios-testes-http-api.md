# Critérios para testes HTTP da API

**Propósito:** definir o que é obrigatório ao **adicionar ou alterar rotas** REST: documentação OpenAPI, testes de contrato e cobertura mínima de erros e validação.

**Última actualização:** 2026-04-19 (2).

---

## 1. Escopo

Aplica-se a todas as rotas expostas pelo backend FastAPI (`/api/v1`, `/api/v2`, `/health`, rotas públicas da vitrine, etc.).

---

## 2. Obrigatório em cada alteração de API

| Entrega | Detalhe |
|---------|---------|
| **OpenAPI** | Após mudanças em modelos, parâmetros ou respostas, regenerar `doc/api/openapi.json` com `make openapi-export` na raiz do repositório (**RNF-DevEx-08**). |
| **Testes de contrato** | Novos ficheiros ou casos em `backend/tests/test_http_contracts_*.py` (ou equivalente nomeado), cobrindo pelo menos os pontos da secção 3. |
| **CI** | `make lint` e `pytest tests/ -q` devem passar antes de merge. |

---

## 3. Cobertura mínima dos testes HTTP

Para cada rota relevante, os testes devem incluir, quando aplicável:

1. **Códigos de estado** — sucesso esperado (200, 201, 204, …) e erros documentados (401, 404, 409, 422, …).
2. **Autenticação** — rotas protegidas: pedido sem `Authorization: Bearer` → **401** (ver `test_http_contracts_bearer_401.py`).
3. **Corpo e parâmetros** — campos **obrigatórios** em falta ou vazios onde não permitido → **422**; tipos inválidos onde o schema restringe → **422**.
4. **Limites** — valores fora de intervalos (ex.: percentagens fora de 0–100) → **422**.
5. **Recursos inexistentes** — IDs inválidos ou inexistentes → **404** onde a API assim o define.
6. **Versão v2** — onde existir envelope **DEC-06**, validar formato de erro (ex.: 422 com estrutura envelope) nos testes específicos v2.

Não é necessário duplicar testes de **lógica de negócio** já cobertos em `test_services_*` ou fluxos E2E; os testes de contrato focam **HTTP + schema + erros previsíveis**.

---

## 4. Onde está implementado

| Área | Ficheiros (referência) |
|------|-------------------------|
| Saúde e auth | `test_http_contracts_auth_health.py` |
| 401 sem Bearer | `test_http_contracts_bearer_401.py` |
| 422/404 autenticados | `test_http_contracts_validation_bodies.py` |
| Rotas públicas | `test_http_contracts_public.py` |
| v2 / envelope | `test_http_contracts_v2.py` |
| Registo rápido de loja para testes | `contract_helpers.py`, fixtures em `conftest.py` |
| Cobertura alargada (erros de domínio, JWT, v2) | `test_coverage_gaps.py` |

**Referência de cobertura:** `cd backend && pytest tests/ --cov=app` — alvo de referência no repositório ~**97%** em `app` (ver [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md)).

---

## 5. Ligações

- [TESTES-E-CI.md](TESTES-E-CI.md) — comandos e pipelines.
- [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md) — inventário de testes e normas.
- [doc/api/README.md](../api/README.md) — OpenAPI e ReDoc.
