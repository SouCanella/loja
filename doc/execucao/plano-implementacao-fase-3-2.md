# Plano de implementação — Fase 3.2 completa

**Objectivo:** executar **toda** a [Fase 3.2](../fases/fase-03-2-impressao-termica.md) (Parte A impressão + Parte B site institucional), com **testes automatizados**, **OpenAPI** actualizado e **documentação** sincronizada ao fecho.

**Norma de qualidade:** `make test` verde (pytest + Vitest); E2E recomendado para rotas novas; `make openapi-export` antes do merge final.

**Referências:** [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md), [landing-site-produto.md](../projeto/landing-site-produto.md), [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) (**DEC-21**, **DEC-22** onde aplicável), [TESTES-E-CI.md](TESTES-E-CI.md).

---

## 1. Visão geral: frentes e ordem

| Frente | Sub-fases | Dependência principal | Pode correr em paralelo? |
|--------|-----------|----------------------|---------------------------|
| **A — Impressão** | 3.2-a → 3.2-b → 3.2-c | Pedido detalhado + `PATCH /me` store-settings (já existe) | Sim com B |
| **B — Marketing** | 3.2-d → 3.2-e | Nenhuma API nova obrigatória para 3.2-d | Sim com A |

**Recomendação de equipa única:** intercalar **3.2-d** cedo (valor visível) enquanto desenha contrato de **3.2-a**; depois fechar **3.2-a** backend+front antes de **3.2-b/c**.

```text
Semana típica (ajustar):
  [3.2-d landing]     [3.2-a print JSON + HTML]
         |                       |
         +-------- 3.2-e ---------+---- 3.2-b (USB)
                                           |
                                    3.2-c (BT) opcional / experimental
```

---

## 2. Pré-requisitos (antes de código)

- [ ] Ler [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) §2–§4 e [landing-site-produto.md](../projeto/landing-site-produto.md) §4–§8.
- [ ] Confirmar **DEC-21**: estratégia Web vs agente local para BT — registar uma linha em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) quando a primeira PR de impressão térmica entrar.
- [ ] Ambiente de **HTTPS** para testes manuais Web USB/BT (staging ou `localhost` com excepções do browser).
- [ ] Branch de feature: `feature/fase-3-2` ou sub-branches `feature/3-2-a-print`, `feature/3-2-d-landing`.

---

## 3. Parte A — Impressão (3.2-a / 3.2-b / 3.2-c)

### 3.1 Modelo e API (incremental)

| # | Tarefa | Detalhe | Testes |
|---|--------|---------|--------|
| A1 | **Schema `print_config`** | JSON em `stores` / `store-settings` (ex.: `theme.print` ou `config.print`): `channel: off \| usb \| bluetooth`, `paper_width_mm: 58 \| 80`, `shipping_label_size: a4 \| a6`, defaults seguros. | pytest: PATCH aceita merge; GET `/me` expõe campos; regressão settings existentes. |
| A2 | **Contrato de impressão** | `GET /api/v2/orders/{order_id}/print` → envelope com `data: OrderPrintOut` (loja, pedido, linhas, totais, notas, timestamps ISO). Opcional query `?format=json` explícito. | pytest: 200 com pedido da loja; 404 outra loja; 401 sem auth. |
| A3 | **PDF no servidor (opcional 3.2-a+)** | Se optarem por PDF gerado no backend: biblioteca escolhida + teste de bytes não vazios; content-type `application/pdf`. | pytest: smoke PDF; ou adiar e ficar só HTML+print no cliente na primeira entrega. |

**Ficheiros típicos (backend):** `app/schemas/print.py`, `app/api/handlers/order_print.py`, `app/api/v2/endpoints/orders.py` (ou router dedicado), merge em `UserMe` / `store-settings` schemas.

### 3.2 Frontend painel

| # | Tarefa | Detalhe | Testes |
|---|--------|---------|--------|
| A4 | **Configuração** | Secção em `/painel/configuracao` (ou subpágina) para `print_config`; alinhado à tabela RF da fase. | Vitest opcional componentes; E2E: guardar e recarregar. |
| A5 | **Detalhe do pedido** | Botão **Imprimir** abre: (1) página/modal **pré-visualização** HTML optimizada para `@media print`, ou (2) nova rota `/painel/pedidos/[id]/imprimir` com layout limpo. | Playwright: abrir impressão não é automatizável de forma fiável — validar render e ausência de erros JS. |
| A6 | **3.2-b Web USB** | Client component: deteção `navigator.usb`, envio ESC/POS (lib npm ou gerador mínimo), fallback mensagem. | Testes manuais obrigatórios; unit test só para geração de bytes ESC/POS a partir de `OrderPrintOut`. |
| A7 | **3.2-c Bluetooth** | Idem GATT; marcar UI **experimental** se modelo não validado. | Documentar em `doc/projeto/` ficheiro **impressoras-testadas.md** (criar na PR se necessário). |

### 3.3 Parte A — Checklist de testes

| Camada | O quê |
|--------|--------|
| **pytest** | Novos endpoints; isolamento `store_id`; validação de `print_config`; tamanho máximo de payload se aplicável. |
| **Vitest** | Helpers formatação data/valor; componente de botão impressão (estado loading/erro) se tiver lógica. |
| **Playwright** | Fluxo: login → pedido → abrir pré-visualização impressão (sem dialog nativo de print). |
| **Manual** | Matriz impressora USB/BT conforme §2.4 da fase; Firefox/Safari limitações. |

---

## 4. Parte B — Site institucional (3.2-d / 3.2-e)

### 4.1 Landing (3.2-d)

| # | Tarefa | Detalhe | Testes |
|---|--------|---------|--------|
| B1 | **Estrutura** | Substituir `frontend/app/page.tsx` por secções: Hero, Como funciona, Funcionalidades, Segmentos, FAQ, CTA, Rodapé — copy [landing-site-produto.md](../projeto/landing-site-produto.md) §4. | Playwright: `GET /` 200; links `/login`, `/registo`, `/loja/demo` (ou slug acordado). |
| B2 | **Componentes** | `components/marketing/*` — Server Components por omissão; client só onde necessário. | Vitest: render mínimo ou smoke `npm run test` sem falhas. |
| B3 | **Estilo** | Tailwind; não quebrar `painel-*` na área marketing (prefixo ou pasta isolada). | Visual manual + Lighthouse numa CI opcional. |

### 4.2 Legal e SEO (3.2-e)

| # | Tarefa | Detalhe | Testes |
|---|--------|---------|--------|
| B4 | **`/termos` e `/privacidade`** | Páginas com texto placeholder claro (“Revisão jurídica pendente”); layout simples. | Playwright: rotas 200. |
| B5 | **Metadata** | `layout.tsx` ou `page.tsx`: `metadata` com title/description/OG conforme [landing-site-produto.md](../projeto/landing-site-produto.md) §5. | Validar head em teste E2E ou build `next build` sem erros. |

---

## 5. Documentação a actualizar (obrigatório no merge da Fase 3.2)

| Documento | Acção |
|-----------|--------|
| [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) | §6 Estado: `em_progresso` → `concluída`; marcar critérios §4 e Parte B; data fecho. |
| [CHANGELOG-FASES.md](CHANGELOG-FASES.md) | Entrada datada: sub-fases entregues, PRs, notas DEC-21. |
| [PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) | Se a 3.2 fechar: linha estado ou “concluída” em [doc/README.md](../README.md). |
| [doc/api/openapi.json](../api/openapi.json) | `make openapi-export` após novas rotas. |
| [doc/README.md](../README.md) | Tabela “Estado do roadmap” — Fase 3.2 concluída. |
| [indice-documentacao-e-gaps.md](../projeto/indice-documentacao-e-gaps.md) | Actualizar §2 (impressão, landing); remover lacunas fechadas. |
| [README.md](../../README.md) (raiz) | Se novas env vars (`PRINT_*`, etc.), documentar em tabela ou parágrafo. |
| [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) | **DEC-21** ADR completo quando estratégia térmica estiver fechada. |
| [TESTES-E-CI.md](TESTES-E-CI.md) | Opcional: acrescentar linha “Fase 3.2 — E2E home + print preview”. |
| [qualidade-e-conformidade.md](../projeto/qualidade-e-conformidade.md) | Se houver novos RNF testados (ex.: impressão só autenticada). |
| [painel-ux-layout-formularios-precificacao.md](../projeto/painel-ux-layout-formularios-precificacao.md), [vitrine-configuracao-aparencia.md](../projeto/vitrine-configuracao-aparencia.md) | **Iteração Fase 3.2 (UX painel):** cabeçalho sticky alargado, classes de botão, `FieldTip` unificado, ordem **Redes sociais** na configuração — ver [fase-3-2-implementacao-resumo.md](fase-3-2-implementacao-resumo.md) §7 e [fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) §8. |

---

## 6. Definição de pronto (DoD) — Fase 3.2

- [ ] Todas as sub-fases planeadas (A e B) entregues ou explicitamente **reduzidas** com registo no [fase-03-2](../fases/fase-03-2-impressao-termica.md) §2.5 / backlog.
- [ ] `make test` e `make lint` (se existir alvo) verdes no CI local.
- [ ] `make openapi-export` commitado com contrato alinhado ao código.
- [ ] Nenhum segredo em repositório; variáveis apenas em `.env.example` com comentário.
- [ ] Revisão de copy landing: sem claims falsos (§2 [landing-site-produto.md](../projeto/landing-site-produto.md)).
- [ ] **3.2-c** se ficar “experimental”: README ou doc a dizer “compatibilidade limitada”.

---

## 7. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Web BT/USB incompatível com impressora do lojista | 3.2-a obrigatório (PDF/HTML); 3.2-b/c como melhor esforço + doc |
| PDF servidor aumenta dependências | MVP cliente: só HTML + `window.print` |
| Landing atrasa API | Entregar 3.2-d antes; impressão depois |
| Regressão em `store-settings` | Testes PATCH merge JSON existentes + novos campos opcionais |

---

## 8. Estimativa grosso modo (indicativa)

| Sub-fase | Esforço relativo |
|----------|------------------|
| 3.2-d | M — UI + revisão copy |
| 3.2-e | S — páginas legais + metadata |
| 3.2-a | M–L — API + UI print + testes |
| 3.2-b | M — hardware + ESC/POS |
| 3.2-c | M–L — incerteza de devices |

---

## 9. Ligação com código existente

- **Upload imagens (MA-03):** já implementado; não repetir — apenas garantir que documentação MA-03 está `convertido` no backlog (já corrigido).
- **Pedidos v2:** reutilizar handlers de detalhe de pedido para montar `OrderPrintOut`.
- **Configuração loja:** estender padrão `PATCH /api/v2/me/store-settings` já usado para tema.

---

*Última revisão: 2026-04-20 — plano mestre para execução da Fase 3.2.*
