# Qualidade e conformidade com a documentação normativa

**Propósito:** registar o estado da implementação face às propostas de [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md), [documento_enterprise.md](../documento_enterprise.md) e [decisoes-e-pendencias.md](decisoes-e-pendencias.md).  
**Última auditoria:** 2026-04-17 — código e ferramentas da raiz do repositório.

---

## 1. Verificações automáticas (gate local)

| Verificação | Comando / resultado | Notas |
|-------------|---------------------|--------|
| Lint backend | `make lint` → **Ruff** em `app/` e `tests/` | Deve passar antes de merge. |
| Lint frontend | `npm run lint` (Next.js / ESLint) | Idem. |
| Testes integração backend | `pytest tests/ -q` — **9** testes | Fluxos: auth, tenant, pedidos, stock, fase 3 produção/relatório. |
| Cobertura (referência) | `pytest --cov=app` | Total módulo `app` ~**86%** (varia com linhas tocadas); meta **RNF-QA-01** é **≥ 90% na camada de serviço**, *progressiva*. Serviços: `pricing` ~90%, `stock` ~90%, `order_flow` ~84%, `production_service` ~86%. |
| Contrato HTTP | `make openapi-export` → [doc/api/openapi.json](../api/openapi.json) | **RNF-DevEx-08**. |

---

## 2. Conformidade explícita (o que está alinhado)

| Norma / decisão | Evidência no código / docs |
|-----------------|----------------------------|
| **RNF-SEC-01** isolamento por loja | Rotas autenticadas filtram por `current.store_id`; testes `test_auth.py` e fluxos de pedido por loja. |
| **RNF-Arq-02a** idempotência em pedidos | `POST /orders` com `Idempotency-Key` opcional; painel novo pedido envia header. |
| **RNF-Arq-02b** idempotência em produção | `POST /production` com `Idempotency-Key`; testes em `test_phase3_production.py`. |
| **RNF-Arq-04** regras no backend | Serviços `order_flow`, `stock`, `production_service`, `pricing`; não só no front. |
| **DEC-09 / DEC-17** custo e baixa | `pricing.py`, `production_service.py`, `stock.py` + testes de produção. |
| **DEC-14** estados de pedido | Enum e `PATCH /orders/{id}/status`; UI painel com labels e fluxo. |
| **RNF-DevEx-06** migrações | Alembic versionado; sem alteração ad hoc prescrita. |
| **RNF-DevEx-08** OpenAPI | `openapi.json` no repositório; export por script. |
| **RNF-UX-01 / RNF-UX-03** mobile-first e painel simples | Layouts Tailwind, listas em cartões no painel; formulários por etapas não obrigatórios no MVP. |

---

## 3. Lacunas ou desvios conhecidos (transparentes)

| Referência | Situação | Recomendação |
|------------|----------|--------------|
| **RNF-QA-01** 90% serviço | Ainda não atingido de forma uniforme (alguns ramos em `order_flow`, `production_service`, endpoints sem teste directo). | Aumentar testes de serviço e casos de borda; opcional gate `--cov-fail-under` por pacote `app/services`. |
| **RNF-QA-02** fluxos críticos | Cobertos em pytest; **painel Next** sem testes automatizados de UI nas últimas features. | Vitest/Testing Library para `lib/painel-api.ts` e componentes críticos; evolução. |
| **RNF-QA-03** E2E | Não há Playwright/Cypress no repositório. | Backlog / Fase 4. |
| **RNF-QA-06** matriz RN → testes | [matriz-rn-testes.md](../normativos/matriz-rn-testes.md) existe; não está 100% preenchida para cada RN novo. | Actualizar ao fechar marcos. |
| **DEC-06 / RNF-Ops-02** envelope `{ success, data, errors }` | API FastAPI devolve JSON **directo** dos schemas (sem envelope unificado). | Desvio documentado; alinhar numa versão futura da API ou aceitar como MVP pragmático. |
| **DEC-10** FieldHelp | Ajuda contextual não está em todos os campos do painel (receitas, pedidos, etc.). | Incrementar por área conforme prioridade UX. |
| **RNF-SEC-03 / DEC-16** refresh | Access JWT; refresh token **não** implementado na API actual. | Backlog. |
| **RNF-SEC-04** rate limiting | Não aplicado no login. | Backlog hardening. |
| **RNF-Ops-01** logs estruturados | MVP sem request id obrigatório em todos os caminhos. | Fase 4 / observabilidade. |

---

## 4. Inventário de testes backend (referência rápida)

| Ficheiro | Foco |
|----------|------|
| `tests/test_auth.py` | Registo, login, `/me`, isolamento duas lojas |
| `tests/test_phase2_orders.py` | Pedidos, stock, cancelamento |
| `tests/test_public_vitrine.py` | Catálogo público |
| `tests/test_phase3_production.py` | Receitas, produção idempotente, relatório financeiro |

Não há ficheiro dedicado só a `GET /me` com `vitrine_whatsapp`; a funcionalidade é coberta indirectamente pelo fluxo de loja e pelo schema partilhado.

---

## 5. Próximos passos sugeridos (prioridade)

1. **Qualidade:** subir cobertura em `app/services/` e ramos de `me.py` / pedidos; testes unitários para `draftOrderWhatsAppMessage` / `whatsAppUrl` no frontend (opcional).  
2. **Produto (backlog):** CRUD de insumos “puros”; margem configurável nas receitas; métricas extra no relatório.  
3. **Plataforma:** CI com `make lint` + `pytest` + build Next; **RNF-QA-03** E2E quando o fluxo estabilizar.  
4. **Conformidade forte:** envelope API apenas se houver consenso de versão (**DEC-06**); refresh token (**DEC-16**); rate limit em auth.

---

## 6. Ligações

- Inventário funcional Fase 3: [fase-03-gestao.md](../fases/fase-03-gestao.md) **§10**.  
- Marcos: [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md).  
- Débitos gerais: [backlog.md](backlog.md).
