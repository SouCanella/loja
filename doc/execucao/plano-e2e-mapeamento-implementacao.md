# Mapeamento E2E — lacunas vs testes existentes e plano de implementação

**Propósito:** listar o que deve ser validado em **Playwright (E2E)** porque **não** é coberto de forma equivalente por **pytest** (API/serviços) ou **Vitest** (helpers/`lib`), e definir **fases** para implementar esses testes.

**Última actualização:** 2026-04-21.

**Relacionado:** [TESTES-E-CI.md](TESTES-E-CI.md), [criterios-testes-http-api.md](criterios-testes-http-api.md), [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md), `frontend/e2e/README.md`.

---

## 1. Princípio: o que E2E deve (e não deve) fazer

| Camada | Cobre bem | Não substitui E2E para |
|--------|-----------|-------------------------|
| **pytest** (`backend/tests/`) | Contratos HTTP, envelopes, serviços de domínio, isolamento `store_id`, lógica de stock/pedidos/produção | Navegação Next.js, hidratação, *layout* do painel, estado do browser (`localStorage`), interacção real com formulários multi-página |
| **Vitest** (`frontend/__tests__/`) | `unwrapV2Success`, formatação, classes Tailwind partilhadas, ESC/POS helpers, mocks de `fetch` | Rotas reais, `next/link`, componentes client com efeitos após mount, portal/barra fixa, integração com API verdadeira |
| **Playwright** | Fluxo utilizador ponta-a-ponta (HTML + JS + rede), regressão de rotas críticas | Todos os ramos de erro 422/401 (deixar para contratos API); lógica pura de cálculo |

**Regra prática:** se o teste **só precisa** de `TestClient` + JSON, fica em **pytest**; se precisa de **browser** ou de **cadeia login → página → acção → feedback na UI**, candidato a **E2E**.

---

## 2. Inventário actual de E2E (`frontend/e2e/`)

| Ficheiro | O quê valida | API real? |
|----------|--------------|-----------|
| `smoke.spec.ts` | `/login`, `/`, `/termos`, `/privacidade` — headings e CTA | Não (só HTML) |
| `auth-public.spec.ts` | Links e formulário `/registo` | Não |
| `vitrine-conta.spec.ts` | UI `/loja/[slug]/conta` com *fetch* degradado | Opcional |
| `login-painel.spec.ts` | Login → `/painel`, heading Dashboard | Sim (`E2E_*`) |
| `painel-regression.spec.ts` | Login → Configuração (Guardar) → Catálogo (sem erro de carga) | Sim + BD migrada |

---

## 3. Matriz — fluxos e cobertura

Legenda: **P** = pytest / contratos; **V** = Vitest; **E** = E2E existente ou proposto.

| Área | Rotas / superfície | Coberto por P/V (resumo) | Lacuna E2E (valor único) | Prioridade |
|------|-------------------|---------------------------|---------------------------|------------|
| **Marketing** | `/`, `/termos`, `/privacidade` | — | Smoke já cobre headings; E2E extra: links CTAs para `/login`/`/registo` (opcional) | Baixa |
| **Auth loja** | `/login`, `/registo` | `test_auth.py`, `test_http_contracts_*` | Fluxo **completo** registo → login → primeira entrada no painel (cria loja real na BD) | Média* |
| **Painel — shell** | Sidebar, menu móvel, notificações (ícone) | — | Abrir/fechar menu móvel; sino visível (sem regressão de *layout*) | Baixa |
| **Dashboard** | `/painel` | `test_dashboard_v2.py` | Gráficos/tabela visíveis após dados; intervalo de datas não quebra a página | Média |
| **Configuração** | `/painel/configuracao` | PATCH via API em testes | **Guardar** persiste (reload ou mensagem sucesso); barra fixa visível — parcialmente em `painel-regression` | Alta** |
| **Catálogo** | `/painel/catalogo` | CRUD produtos em pytest | Criar produto mínimo pela UI ou editar preço e ver tabela actualizada | Alta |
| **Categorias** | `/painel/categorias` | CRUD categorias API | Criar categoria pela UI; aparecer no filtro do catálogo | Média |
| **Pedidos** | `/painel/pedidos`, `/painel/pedidos/novo`, `/painel/pedidos/[id]` | `test_phase2_orders.py`, fluxos serviço | Lista carrega; detalhe abre; mudança de estado visível (smoke UI) | Alta |
| **Clientes** | `/painel/clientes` | `test_customers_painel_v2.py` | Secção vitrine + tabela métricas sem erro de API | Média |
| **Insumos / stock** | `/painel/insumos`, `/painel/relatorio-estoque` | `test_inventory_items_crud.py`, serviços stock | Lista carrega; criar insumo simples (se dados seed) | Média |
| **Receitas / produção** | `/painel/receitas`, `/painel/producao` | `test_phase3_production.py` | Página receitas lista; produção datas «Hoje» não erro | Média |
| **Precificação / financeiro / relatórios** | `/painel/precificacao`, `financeiro`, `relatorio` | Serviços + dashboard | Smoke: páginas montam sem *crash* com utilizador real | Baixa |
| **Analytics vitrine** | `/painel/analytics-vitrine` | `test_vitrine_analytics_v2.py` | Gráficos ou mensagem «sem dados» sem erro | Baixa |
| **Notificações** | `/painel/notificacoes` | `test_services_store_notifications.py` | Página lista; *polling* não parte erro (smoke) | Baixa |
| **Conta utilizador** | `/painel/conta` | `test_me_password_v2.py` | Formulário palavra-passe visível; submit mostra feedback | Média |
| **Vitrine pública** | `/loja/[slug]`, `/loja/[slug]/p/[productId]` | `test_public_vitrine.py`, tema, pedidos públicos | Navegar loja → produto → abrir carrinho/sheet (sem WhatsApp real) | Alta |
| **Checkout vitrine** | Carrinho → preview WA | `test_public_vitrine_orders.py` | Registar pedido público + mensagem com ref. (API já testada); UI: botão final não erro | Alta |
| **Conta cliente vitrine** | `/loja/[slug]/conta` | `test_public_customers_auth.py` | Login cliente + sessão (fluxo feliz) — parcialmente coberto por `vitrine-conta.spec` sem API | Média |

\*Registo E2E completo pode exigir base limpa ou slug único; preferir **ambiente de staging** ou **job** que faça teardown.

\*\*Já existe assert do botão Guardar; falta validar **persistência** (reload ou segundo GET).

---

## 4. Lista consolidada — testes E2E a implementar (não cobertos alhures)

Agrupados por **pacote Playwright** sugerido (ficheiros `.spec.ts`).

### 4.1 Pacote `painel-*.spec.ts` (sessão lojista)

| ID | Descrição | Por que não basta pytest/Vitest | Dependência |
|----|-----------|----------------------------------|-------------|
| E-P01 | Após login, **todas** as entradas do menu principal respondem **200** e mostram heading esperado (lista de rotas) | Valida *routing* Next + auth no cliente | `E2E_EMAIL`, `E2E_PASSWORD` |
| E-P02 | **Configuração:** alterar campo óbvio (ex.: nome loja) → Guardar → **reload** → valor persistido | Portal/barra + PATCH + estado React | Idem + BD |
| E-P03 | **Catálogo:** criar produto só com nome+preço (stock off ou mínimo) → aparece na tabela | Formulário client + POST v2 | Idem |
| E-P04 | **Pedidos:** abrir lista → abrir primeiro pedido se existir; senão «novo pedido» só monta formulário | Navegação dinâmica `[id]` | Idem + opcional seed pedido |
| E-P05 | **Notificações / conta:** páginas `/painel/notificacoes`, `/painel/conta` sem erro de consola crítico | — | Idem |

### 4.2 Pacote `vitrine-*.spec.ts` (público + slug)

| ID | Descrição | Por que não basta pytest/Vitest | Dependência |
|----|-----------|----------------------------------|-------------|
| E-V01 | `GET /loja/{E2E_STORE_SLUG}` — catálogo renderiza; link para produto | HTML público + RSC/client | Slug real + API |
| E-V02 | Página produto → adicionar ao carrinho → sheet abre com linha | Estado client carrinho | Idem |
| E-V03 | Checkout: até ao passo antes do WA (ou mock `window.open`) — **opcional** / frágil | Integração browser | Decisão produto |

### 4.3 Pacote `auth-onboarding.spec.ts` (opcional / staging)

| ID | Descrição | Nota |
|----|-----------|------|
| E-A01 | Registo nova loja com e-mail aleatório → login → `/painel` | Risco: spam BD; usar DB descartável ou *worker* isolado |

---

## 5. Plano de implementação (fases)

### Fase A — Baseline (1 sprint curta)

- [ ] Documentar variáveis: `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_STORE_SLUG` (vitrine).
- [ ] Extrair **helper** `loginAsLojista(page)` em `e2e/helpers/auth.ts` para reutilizar nos specs.
- [ ] Implementar **E-P01** (*menu smoke*): um teste que percorre `href` do `PainelShell` (ou lista fixa de paths) e verifica `h1` ou título por rota.
- [ ] Reexecutar CI: manter E2E opcional se secrets não existirem (`test.skip`).

### Fase B — Fluxos de dados (alta prioridade produto)

- [ ] **E-P02** persistência configuração (reload).
- [ ] **E-P03** criar produto mínimo no catálogo.
- [ ] **E-V01** + **E-V02** vitrine com slug da mesma loja do utilizador E2E.

### Fase C — Pedidos e vitrine avançada

- [ ] **E-P04** pedidos (lista + detalhe ou novo).
- [ ] **E-V03** checkout até pré-visualização (definir critério: URL WA não precisa abrir app real).

### Fase D — Onboarding e *nightly*

- [ ] **E-A01** registo completo apenas em job *nightly* ou branch com Postgres efémero.
- [ ] Opcional: **Lighthouse** ou axe em CI (não Playwright core, mas complementar RNF-UX).

---

## 6. O que **não** duplicar em E2E

- Matriz completa de **401/422/404** por rota → `test_http_contracts_*.py`.
- Cálculo de stock, produção, preços → `test_services_*`, `test_phase*_*.py`.
- `unwrapV2Success`, `formatBRL`, ESC/POS → Vitest.
- OpenAPI → `make openapi-export` + revisão manual.

---

## 7. Critérios de pronto (DoD) por ficheiro E2E novo

1. Testes **estáveis** (sem `waitForTimeout` fixo salvo justificação); `expect` com timeouts razoáveis.
2. `test.skip` quando `process.env` em falta — CI verde sem secrets.
3. Nenhum dado sensível no repositório; secrets só em CI *encrypted*.
4. Referência cruzada neste documento e em [TESTES-E-CI.md](TESTES-E-CI.md) §4.

---

## 8. Próximos passos imediatos (checklist)

| # | Acção | Estado |
|---|--------|--------|
| 1 | `e2e/helpers/auth.ts` + `painel-routes.ts` | Feito |
| 2 | `e2e/painel-routes-smoke.spec.ts` (E-P01) | Feito |
| 3 | `e2e/painel-config-save.spec.ts` (E-P02) + UX **Guardar alterações** no formulário | Feito |
| 4 | `e2e/vitrine-loja-smoke.spec.ts` (E-V01 parcial) + README com `E2E_STORE_SLUG` | Feito |
| 5 | Secret `E2E_*` no GitHub Actions para E2E autenticado | Pendente (DevOps) |

---

*Este plano deve ser revisto após cada marco de produto (novas rotas no painel ou na vitrine).*
