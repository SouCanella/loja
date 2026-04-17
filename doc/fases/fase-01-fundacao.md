# Fase 1 — Fundação (planejamento completo)

**Referência:** [documento_enterprise.md](../documento_enterprise.md) §3 (arquitetura), §5 (multi-tenant), §15 (UX e ajuda contextual — padrão mínimo), §16 (segurança), §17 (API, **OpenAPI**), §20 (Docker, Makefile, **pin Postgres**), §22 (MVP — autenticação), §25 (roadmap)  
**RF/RN:** [requisitos-funcionais.md](../normativos/requisitos-funcionais.md) RF-AU, RF-CF; [regras-negocio.md](../normativos/regras-negocio.md) RN-Auth, RN-Geral.

## Documentação normativa (leitura obrigatória para esta fase)

- [regras-negocio.md](../normativos/regras-negocio.md)
- [requisitos-funcionais.md](../normativos/requisitos-funcionais.md)
- [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md) — **RNF-DevEx-08** (OpenAPI)
- [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) — **DEC-16**, **DEC-18**, **DEC-19**

### Gates antes de implementar esta fase

- **DEC-16** (access + refresh), **DEC-18** (SQLAlchemy 2.x), **DEC-19** (`/loja/[slug]`) aplicados ao desenho de auth e rotas.
- **RNF-DevEx-08:** contrato OpenAPI 3 gerado pelo FastAPI planejado desde o primeiro sprint desta fase (não deixar para “depois”).
- **DEC-15** (Super Admin) **não** bloqueia esta fase se não houver rotas `platform`.

---

## 1. Objetivo

Estabelecer a **base técnica** do monolito modular: ambiente reproduzível, banco PostgreSQL, API FastAPI com **isolamento multi-tenant** (`store_id`) e **JWT**, primeiras entidades `stores` e `users`, migrações Alembic, frontend Next.js (App Router) com **mobile-first** e fluxo de autenticação mínimo.

---

## 2. Escopo planejado

### 2.1 Infraestrutura

- Docker Compose: serviços `frontend`, `backend`, `postgres` (§20).
- **PostgreSQL:** pinar imagem major no Compose (ex.: `postgres:16-alpine` conforme §20) para builds reprodutíveis entre máquinas e CI.
- Makefile na raiz: `up`, `down`, `test`, `migrate`, `lint` (§20).
- `.env.example` sem segredos; documentação de variáveis.

### 2.2 Backend

- FastAPI + SQLAlchemy 2.x + Pydantic v2.
- **Contrato OpenAPI 3:** expor especificação gerada pelo FastAPI (ex.: `GET /openapi.json` ou rota equivalente), acessível em dev — **RNF-DevEx-08**; base para tipagem cliente e trabalho paralelo front/back.
- Alembic inicial; tabelas `stores` e `users` conforme §6 (resumo).
- **Middleware obrigatório** para rotas autenticadas: contexto de `store_id` (§5). Regra: **nunca** consultar dados de negócio sem `store_id`.
- JWT (access token); validação de entrada em schemas Pydantic (§16).
- Endpoints mínimos: health, auth (login/registro vinculado a loja ou criação de loja — decisão na implementação), leitura de perfil/loja.

### 2.3 Frontend

- Next.js App Router, TypeScript, Tailwind.
- Layout responsivo **mobile-first** (§15); definir **padrão de ajuda contextual** (tooltips ou textos auxiliares) em telas críticas de auth/onboarding — evolução completa do modelo `FieldHelp` nas fases seguintes.
- Páginas/fluxo de login e área logada esquelética; integração com API (React Query quando fizer sentido).

### 2.4 Segurança e auditoria (início)

- Logs estruturados básicos para ações sensíveis (login, mudança de contexto de loja) — evolução na Fase 4.

---

## 3. Critérios de aceite (definição de pronto)

- [ ] `make up` sobe os três serviços sem erro; `make down` encerra.
- [ ] Imagem do serviço `postgres` **pinada** (tag major explícita; ver §20).
- [ ] Especificação **OpenAPI 3** disponível com a API em execução local (ex.: `/openapi.json`).
- [ ] `make migrate` aplica migrações no Postgres do Compose.
- [ ] `make lint` executa linters backend + frontend (config mínima aceitável).
- [ ] Usuário consegue autenticar e o backend associa requisições a um `store_id` válido.
- [ ] Testes: smoke + testes de serviço/middleware tenant; relatórios HTML conforme [doc/README.md](../README.md).
- [ ] Este arquivo atualizado com **seção Execução** (data, decisões, links/commits).

---

## 4. Dependências

- **Fase 0** concluída (estrutura `doc/`, convenções, decisão monorepo).

---

## 5. Modelo de dados (esta fase)

| Entidade | Campos relevantes (§6) |
|----------|---------------------------|
| stores | id, name, theme, config |
| users | id, store_id, role, email |

Demais tabelas: Fases 2 e 3.

---

## 6. APIs (alvo nesta fase)

Exemplos a implementar como mínimo (além de health/auth):

- Base para futuro `GET /api/v1/products` (pode ser stub ou vazio) — **listagem real na Fase 2**.

---

## 7. Testes

- Unitários: serviços de auth, helpers de tenant.
- Integração: request autenticada com `store_id` correto vs rejeição cross-tenant.
- Meta de cobertura: registrar percentual na conclusão; alinhar gradualmente ao §21 (90%).

---

## 8. Documentação e backlog

- Ao fechar: atualizar [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) se houver desvio.
- Itens não feitos ou MVP incompleto: [backlog.md](../projeto/backlog.md).
- [execucao/CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md): entrada datada.

---

## 9. Riscos

| Risco | Mitigação |
|-------|-----------|
| Modelagem de “primeira loja” vs convite | Documentar decisão em Execução |
| JWT refresh / sessão longa | MVP pode ser só access token com TTL; refresh no backlog |

---

## 10. Estado da execução

| Campo | Valor |
|-------|--------|
| **Status** | `planejado` |
| **Data de conclusão** | — |
| **Notas** | Preencher ao concluir a fase. |
