# Backlog

Itens **não concluídos** ou **parcialmente** entregues. Alinhado ao **§23 — Backlog enterprise** do [documento_enterprise.md](../documento_enterprise.md) e a débitos entre fases.

## Onde está documentado o que já foi entregue

O backlog **não duplica** o detalhe de trabalho fechado; use:

| Entrega | Documentação |
|---------|----------------|
| **Fase 0** (monorepo, Docker, Makefile, smoke tests, `README` raiz) | [fase-00-kickoff.md](../fases/fase-00-kickoff.md) **Parte C** (entregue + pendências P1–P5) e **Parte B** (status concluído) |
| **Fase 1** (Postgres, Alembic, JWT, multi-tenant, OpenAPI estático, auth `/api/v1`, vitrine/painel stub) | [fase-01-fundacao.md](../fases/fase-01-fundacao.md) secção **10**; [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md); [doc/api/README.md](../api/README.md) |
| **Fase 2** (backend + vitrine; ressalvas §10.4) | [fase-02-operacao.md](../fases/fase-02-operacao.md) secções **3**, **8**, **9**, **§10**; [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) |
| **Fase 3** (receitas, produção idempotente, relatório financeiro, painel Next, `GET /inventory-items`, `/me` com slug) | [fase-03-gestao.md](../fases/fase-03-gestao.md) **§8–§10**; [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) |
| **Fase 3.1** (paridade UX com mockups admin/vitrine, **gráficos**, shell sidebar) | [fase-03-1-paridade-mockup.md](../fases/fase-03-1-paridade-mockup.md); [mockups/README.md](../mockups/README.md) |
| **Fase 3.2** (impressão **DEC-21** + [landing site](../projeto/landing-site-produto.md) 3.2-d–e) | [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) |
| **Qualidade / RNF** (auditoria vs normas, cobertura, lacunas) | [qualidade-e-conformidade.md](qualidade-e-conformidade.md) |
| **Testes e CI** (pytest, Vitest, Playwright, GitHub Actions) | [TESTES-E-CI.md](../execucao/TESTES-E-CI.md) |
| Marco / changelog | [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) |
| Índice `doc/` | [README.md](../README.md) — linha sobre `README.md` na raiz e testes |
| Norma de testes HTML | [README.md](../README.md) secção *Testes e relatórios HTML* |

Commits na `main` com mensagem `feat(phase-0): …` fecham o registro técnico no Git.

## Legenda

- **Estado:** `nao_iniciado` | `parcial` | `bloqueado` | `convertido` (promovido a requisito normativo)
- **Origem:** enterprise | mvp | tecnico

---

Planeamento de incrementos (IP-03, IP-04, IP-06, MVP, BE-05, MA-05) com critérios mínimos: [incrementos-produto-mvp-be05.md](incrementos-produto-mvp-be05.md). Auditoria de dependências (MA-08): [seguranca-dependencias-ma08.md](../execucao/seguranca-dependencias-ma08.md). RLS (MA-05): [ma05-rls-postgres-proposta.md](../execucao/ma05-rls-postgres-proposta.md).

## Relatórios e analytics ampliados (produto)

Pedido de **métricas de vitrine** (visitas, vistas, carrinho, geo, produtos mais vistos) e **KPIs operacionais** (por hora, confirmado/pendente, património, cupons, descontos, etc.): ver **[relatorios-analytics-roadmap.md](relatorios-analytics-roadmap.md)** e definições fechadas **DEC-22** em **[relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md)** (partição de estados, cupons, desconto em linha, faixa PRO).

---

## Melhorias de engenharia (MA-*) — pós-validação Fase 0

Sugestões de **arquitetura e qualidade** alinhadas ao [documento_enterprise.md](../documento_enterprise.md) §5 (multi-tenant) e §20; não estavam como linhas explícitas até o mapeamento abaixo. **Estado** reflete se já existe norma/código.

| ID | Item | Estado | Fase alvo | Notas |
|----|------|--------|-----------|--------|
| MA-01 | Testes de **integração** que provam **isolamento por `store_id`** (não vazar dados entre lojas) | convertido | 1 | `test_auth.py` (duas lojas); **`test_ma01_store_isolation.py`** (pedidos/produtos v1+v2, listas); reforço opcional: Postgres real em CI |
| MA-02 | Contrato HTTP com prefixo versionado (**ex. `/api/v1`**) desde o primeiro conjunto de rotas de negócio | convertido | 1 | Rotas sob `/api/v1`; OpenAPI em [doc/api/openapi.json](../api/openapi.json) |
| MA-03 | **Storage** de ficheiros (imagens, logos) com **prefixo por `store_id`** ou tenant no bucket (S3-compatível) | convertido | 2+ | Implementado: `media_storage`, `POST /api/v2/media/upload`, `GET /media/...` local; S3 em config — ver código e [indice-documentacao-e-gaps.md](indice-documentacao-e-gaps.md) |
| MA-04 | **Índices compostos** `(store_id, …)` nas tabelas mais consultadas (produtos, pedidos, etc.) | convertido | 1–2 | Migração `20260426_0013_ma04_composite_indexes.py` — `orders`, `products`, `stock_movements`; modelos SQLAlchemy alinhados |
| MA-05 | **Row Level Security (RLS)** no Postgres como reforço opcional de isolamento | nao_iniciado | 4 / hardening | Avaliar custo operacional vs benefício; alternativa ao erro de aplicação |
| MA-06 | **Read replicas** ou **sharding** por tenant | nao_iniciado | pós-MVP | Só se o monólito + uma BD deixarem de chegar; documentar gatilho |
| MA-07 | **Next.js:** `route groups` separando **vitrine** `(public)/loja/[slug]` e **painel** `(painel)` / admin | convertido | 1 | Pastas `frontend/app/(public)/` e `frontend/app/(painel)/painel/` — URLs inalteradas; ver [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) §9 |
| MA-08 | Ciclo de **atualização de dependências** (npm / Next) e resposta a **audit/CVE** | parcial | contínuo | Patches **Next 14.2.35**, Playwright, **Vitest 3**, `overrides` para **glob**; `npm audit` pode ainda listar **Next** até major (aceite documentado) — ritmo contínuo |
| MA-09 | **Vitest:** migrar config para **ESM** (fim do aviso CJS da API Vite) | convertido | técnico | **Vitest 3.x** + dependências alinhadas; `vitest.config.ts` inalterado na essência |

**Relação com itens existentes:** **BE-05** (multi-usuário por loja) e **MVP-01** cobrem parte do modelo; MA-01 e MA-07 explicitam **teste de isolamento** e **estrutura de rotas** no front.

---

## Refactor frontend — painel Next.js

Melhorias de **estrutura e consistência** no painel; não bloqueiam funcionalidade. Contexto UX: [painel-ux-layout-formularios-precificacao.md](painel-ux-layout-formularios-precificacao.md); classes de botão: `frontend/lib/painel-button-classes.ts`.

| ID | Item | Estado | Fase alvo | Notas |
|----|------|--------|-----------|--------|
| **FR-01** | **Partir** `frontend/app/(painel)/painel/configuracao/page.tsx` **em componentes por secção** (Identidade, Redes sociais, Aparência, checkout, impressão, etc.), mantendo estado e `saveProfile` na página ou num hook | convertido | técnico / 3.x | Secções em `frontend/components/painel/config-loja/` (`ConfigIdentitySection`, `ConfigSocialSection`, …); tipos/helpers em `types.ts` e `constants.ts`. |
| **FR-02** | **Componente reutilizável** para filtros **De / Até** (e variantes com botão «Actualizar» ou só datas), p.ex. `PainelDateRangeFields`, usado em Dashboard, Financeiro, Produção, Relatório financeiro, Analytics vitrine | convertido | técnico | `frontend/components/painel/PainelDateRangeFields.tsx` — props `bare` \| `bar` \| `boxed`. |
| **FR-03** | **TypeScript:** tipar `Navigator.usb` (ou helper) para `OrderPrintPanel` e eliminar erro `tsc` sobre Web USB | convertido | técnico | `frontend/types/webusb.d.ts`; guarda `if (!usb)` em `OrderPrintPanel`. |
| **FR-04** | **Partir** `frontend/app/(painel)/painel/clientes/page.tsx` e **`catalogo/page.tsx`** em sub-componentes (formulários, tabelas, edição) | convertido | técnico | Clientes: `components/painel/clientes/*`, `lib/painel-clientes-helpers.ts`. Catálogo: `components/painel/catalogo/*`. |
| **FR-05** | **Alinhar** páginas **login** e **registo** (`frontend/app/(public)/login`, `frontend/app/(public)/registo`) às classes **`painel-button-classes`** (CTA `w-full`), como no painel | convertido | técnico | `painelBtnPrimaryClass` + `painelAuthInputClass` (`lib/painel-surface-classes.ts`). |
| **FR-06** | **Opcional:** componente **`PanelCard`** (ou tokens Tailwind partilhados) para cartões `rounded-lg border border-slate-200 bg-white …` repetidos no painel | convertido | técnico | `painelCardClass` + `PanelCard` em `lib/painel-surface-classes.ts` e `components/painel/PanelCard.tsx`; uso no dashboard e formulários extraídos. |

Ao concluir um FR-*, actualizar esta tabela e, se aplicável, [indice-documentacao-e-gaps.md](indice-documentacao-e-gaps.md).

---

## Backlog enterprise (§23)

| ID | Item | Estado | Notas |
|----|------|--------|-------|
| BE-01 | Eventos sazonais (reforço em comparativos) | nao_iniciado | origem enterprise |
| BE-02 | Pagamentos | nao_iniciado | origem enterprise |
| BE-03 | App mobile | nao_iniciado | origem enterprise |
| BE-04 | BI avançado | nao_iniciado | origem enterprise |
| BE-05 | Multi-usuário por loja | parcial | modelo `users.role`: `store_admin` (registo), `store_operator` e `store_viewer` no enum (2026-04-21); RBAC por rota e convites — ver §16 do enterprise e [incrementos-produto-mvp-be05.md](incrementos-produto-mvp-be05.md) |
| BE-06 | Assinatura SaaS / monetização | nao_iniciado | inclui **limite por plano** quando aplicável |
| BE-07 | Cache de catálogo | nao_iniciado | §23 proposta consolidada |
| BE-08 | Offline mode | nao_iniciado | §23 |
| BE-09 | Multi-moeda | nao_iniciado | §23 |

## MVP ([documento_enterprise.md](../documento_enterprise.md) §22)

Escopo MVP: autenticação, catálogo, pedidos, estoque básico, receitas, precificação simples.

| ID | Requisito | Estado | Dependência |
|----|-----------|--------|-------------|
| MVP-01 | Autenticação (JWT) | parcial | Access + refresh (`POST /auth/refresh`); cookie httpOnly / BFF — evolução |
| MVP-02 | Catálogo | parcial | Vitrine `/loja/[slug]`; imagens S3 e destaques RF-CA-11 — evolução |
| MVP-03 | Pedidos | parcial | API Fase 2; painel: lista, novo, detalhe; **vitrine:** `POST /api/v2/public/stores/{slug}/orders` (IP-11) + WhatsApp com referência; evoluções em [fase-03 §9.1](../fases/fase-03-gestao.md). |
| MVP-04 | Estoque básico | parcial | Lotes + baixa/reversão na API; leitura/ajuste dedicados e UI — ver [fase-02 §9](../fases/fase-02-operacao.md) |
| MVP-05 | Receitas | parcial | API + painel (criar/listar/produzir); evoluções em [fase-03 §9.1](../fases/fase-03-gestao.md) |
| MVP-06 | Precificação simples | parcial | Custo + margem loja/receita + `suggested_unit_price`; sincronizar com `products.price` ou métricas extra — backlog |

Atualizar esta tabela ao fechar cada fase.

## Débitos técnicos e evolução

| ID | Item | Estado | Origem |
|----|------|--------|--------|
| DT-01 | CI/CD (pipeline Git, build Docker, deploy) | parcial | CI: job **`docker-images`** (build imagens backend/frontend) + [deploy-docker.md](../execucao/deploy-docker.md); **push a registry / CD automático** ainda por definir |
| DT-02 | Observabilidade (métricas/dashboards além de logs MVP) | parcial | Cabeçalho **`X-Request-Id`** em todas as respostas (`RequestIdMiddleware`); métricas/dashboards e tracing — pendente |
| DT-03 | Cobertura de testes ≥ 90% | parcial | Gate **CI** em `app/services` (~99%); meta **≥90% em todo o `app`** — ver [qualidade-e-conformidade.md](qualidade-e-conformidade.md); reforço MA-01 em testes de isolamento |

## Ideias de produto (origem `inicio_planejamento.txt`)

Itens de **melhoria** ou pesquisa; não são compromissos de escopo até promovidos a BE/MVP. Estado inicial: `ideia`.

| ID | Ideia | Estado | Notas |
|----|-------|--------|-------|
| IP-01 | Categorias e produtos em destaque / “novo” / mais vendido | convertido | Ver **RF-CA-11**; exemplo em [mockups/loja-vitrine-layout-sugestao.html](../mockups/loja-vitrine-layout-sugestao.html) |
| IP-02 | Agenda de produção planejada por dia | parcial | Atalhos **Hoje** / **Últimos 7 dias** + vista **Agrupar por dia** no histórico em `/painel/producao`; planeamento por capacidade — [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) §8.1 |
| IP-03 | Promoções: combos, desconto por quantidade, produto promocional | ideia | P1 — não iniciado |
| IP-04 | Disponibilidade por dia/horário (ex.: só fim de semana) | ideia | P1 — não iniciado |
| IP-05 | Observações por item de pedido (sem granulado, embalagem especial) | convertido | `line_note`; vitrine + painel + WA — §8.1 fase 3.2 |
| IP-06 | Métricas de recompra, clientes inativos, frequência | parcial | API + resumo em Clientes (`registered_*`, `accounts_without_orders_in_period`); recompra/frequência — futuro |
| IP-07 | WhatsApp: template rico (nome, itens, total, endereço) | convertido | Texto por linhas e observações — §8.1 |
| IP-08 | Domínio próprio / cupons / entrega (expansão P1 §4) | ideia | Alinhar a BE-06 / roadmap — não iniciado |
| IP-09 | Avaliações com **foto** ou vídeo curto (além de nota + texto) | ideia | Depende de RF-AV base |
| IP-10 | Resposta pública do lojista a um comentário aprovado | ideia | Moderação RF-AV |
| **IP-11** | **Pedidos da vitrine (WhatsApp) visíveis no painel / registo em `orders`** | parcial | **MVP:** `POST` público + referência na mensagem WA; lista `/painel/pedidos` com filtro por origem; **notificações in-app** + som opcional no painel — ver [ip-11-pedidos-vitrine-painel.md](../execucao/ip-11-pedidos-vitrine-painel.md). **Evolução:** WhatsApp Business API; push/WebSockets se necessário. |
| **IP-12** | **Partilhar loja** (painel e opcionalmente vitrine): copiar link, WhatsApp, Web Share API — URL canónica `/loja/{slug}` | convertido | `ShareStoreBar` no dashboard; [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) §8.1 |
| **IP-13** | **Cardápio para WhatsApp / Instagram** gerado a partir do catálogo (texto, imagem ou PDF); entrada no painel (e opcional na vitrine) | convertido | Texto em `painel-menu-catalog-text.ts` + catálogo; PDF/imagem — futuro |
| **IP-14** | **Controlo de stock por produto** (`track_inventory` / `inventory_item_id` opcional): CRUD com toggle; impacto em pedidos e RN — **DEC-23** | convertido | Migração + coluna Stock na tabela; §8.1 |

Promover uma ideia: criar entrada em BE-* ou vincular a uma fase em `doc/fases/` e remover ou marcar como `convertido` aqui.

## Como sincronizar

Ao concluir trabalho de uma fase, **remova ou atualize** linhas aqui e registre o que foi entregue no arquivo `doc/fases/fase-0X-*.md` correspondente (Parte C / relatório), em [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) e, para MA-*, nesta tabela.
