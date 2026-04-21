# Fase 3.2 — Experiência lojista completa (impressão + site institucional)

**Âmbito:** (A) **impressão** de pedidos (térmica/USB/BT, A4/A6); (B) **página inicial de marketing** do produto (site institucional), documentada em [landing-site-produto.md](../projeto/landing-site-produto.md). As duas frentes podem avançar **em paralelo** por equipas diferentes.

**Relação:** prolonga a [Fase 3 — Operação de pedidos](fase-03-gestao.md) e o [painel](fase-03-1-paridade-mockup.md). **Não substitui** a [Fase 4 — Escala](fase-04-escala.md); pode sobrepor-se a trabalhos da Fase 4 (CI, observabilidade).

**Plano de implementação (tarefas, testes, documentação):** [plano-implementacao-fase-3-2.md](../execucao/plano-implementacao-fase-3-2.md).

---

## Parte A — Impressão de pedidos (térmica, Bluetooth, USB, comprovativos e etiquetas)

**Referência de produto (pedido):**

| Canal / suporte | Larguras | Modo |
|-----------------|----------|------|
| Impressora térmica **Bluetooth** | 58 mm, 80 mm, **desligado** | Comprovante **e** etiqueta via BT |
| Impressora térmica **USB** / com fio | 58 mm, 80 mm, **desligado** | Comprovante via USB/cabo |
| Etiqueta / documento de envio | **A4**, **A6** | Layout distinto de bobina térmica |

---

## 1. É possível?

**Sim.** O desafio não é “ter pedido na base de dados”, e sim **como o browser ou o SO entregam bytes à impressora**.

| Abordagem | Térmica 58/80 mm | A4 / A6 | Complexidade | Notas |
|-----------|------------------|---------|----------------|--------|
| **Impressão do sistema** (`window.print`, PDF/HTML) | Só se o driver/OS mapear a térmica como “impressora normal” (nem sempre legível) | **Boa** para comprovativo e etiqueta em folha | Baixa | Primeiro incremento útil sem hardware específico. |
| **Web USB** (Chrome/Edge, HTTPS) | **Possível** para muitos dispositivos USB-serial | — | Média | Utilizador concede acesso ao dispositivo por sessão; nem todas as impressoras expõem o perfil certo. |
| **Web Bluetooth** (GATT, HTTPS) | **Possível** para impressoras expostas como BLE compatíveis | — | Média–alta | Suporte varia por modelo e fabricante; testes em hardware real obrigatórios. |
| **Agente local** (app desktop leve ou serviço na máquina da loja) | **Robusto** (Node/Python envia ESC/POS à porta) | Pode gerar PDF e mandar para impressora de sistema | Média | Melhor controlo; distribuição e atualizações (instalador ou auto-update). |
| **App móvel nativo** (futuro) | BT clássico muitas vezes **só** aqui | — | Alta | Fora do âmbito mínimo 3.2 se o alvo for só web. |

**Formato típico bobina:** **ESC/POS** (comandos de texto, negrito, corte). Etiquetas dedicadas podem exigir **outro protocolo** (ex.: TSPL, ZPL) conforme modelo — a Fase 3.2 deve **fixar marcas/modelos suportados** ou documentar “melhor esforço”.

---

## 2. O que vamos precisar (produto + engenharia)

### 2.1 Produto / UX

- **Ecrã de definições** (por loja ou por posto): escolha **desligado** | **USB** | **Bluetooth**; **58 mm** | **80 mm**; separação **comprovante de cozinha** vs **etiqueta de envio** quando fizer sentido.
- **Acção “Imprimir”** no detalhe do pedido (e opcionalmente na lista): pré-visualização quando for PDF/HTML; envio directo quando for térmica.
- **Templates**: texto do comprovante (itens, observações, totais, QR opcional) e layout **A4 vs A6** para envio (margens, fonte mínima legível).

### 2.2 Backend (API)

- Modelo ou JSON em `store` / `store_settings`: `print_config` com campos alinhados à tabela do §0 (canal, largura, papel envio).
- Endpoint estável do tipo **`GET /api/v2/orders/{id}/print`** (ou POST se preferir body de opções) que devolve:
  - **JSON** com campos já normalizados para o cliente renderizar ESC/POS ou PDF, **ou**
  - **PDF** gerado no servidor para A4/A6 (mais previsível para “um só critério” entre browsers).
- **Autorização:** só utilizadores da loja do pedido; sem cache público.

### 2.3 Frontend (painel)

- Componente de impressão que escolhe o caminho: **PDF/HTML** vs **Web USB** vs **Web Bluetooth** (conforme `print_config` e `navigator` capabilities).
- Biblioteca **ESC/POS** em TypeScript (ou geração mínima de bytes no cliente) para 58/80 mm — a documentar na implementação.
- **HTTPS** em produção (requisito das APIs Web USB / Web Bluetooth).

### 2.4 Operação e testes

- **Matriz de testes** com pelo menos uma impressora USB e uma BT reais (ou emulador serial) antes de declarar “suportado”.
- Documentação para a loja: “Como emparelhar”, “Permitir acesso ao dispositivo no Chrome”, limitações Safari/Firefox se aplicável.

### 2.5 Fora do âmbito inicial (explícito)

- Driver universal para **todas** as marcas de térmicas.
- Impressão **a partir da vitrine** (cliente final).
- **Fila de impressão** persistente na cloud (opcional backlog).

---

## 3. Entregáveis sugeridos em sub-fases

| Sub-fase | Entrega | Valor |
|----------|---------|--------|
| **3.2-a** | Comprovativo e etiqueta de envio em **PDF ou HTML** com `window.print`, tamanhos **A4 / A6** configuráveis; definições básicas na loja. | Funciona em qualquer impressora a jato/laser; valida templates. |
| **3.2-b** | **USB** térmica: Web USB + ESC/POS 58/80 mm; opção “desligado”. | Uso típico balcão com PC. |
| **3.2-c** | **Bluetooth** térmica: Web Bluetooth ou documentar necessidade de **agente** se os modelos alvo não forem compatíveis. | Mobilidade; mais risco de compatibilidade. |

A ordem **3.2-a → 3.2-b → 3.2-c** reduz risco; equipas pequenas podem parar em **3.2-a** e avaliar.

---

## Parte B — Site institucional e página inicial (marketing)

**Referência:** [landing-site-produto.md](../projeto/landing-site-produto.md) (copy completo, SEO, checklist, honestidade vs funcionalidades reais). Inspiração de estrutura: mercado (ex.: [Stoqui](https://www.stoqui.com.br/)) sem copiar textos nem prometer PDV/IA/gateways inexistentes.

| Sub-fase | Entrega |
|----------|---------|
| **3.2-d** | Substituir stub `frontend/app/page.tsx` por landing em secções (hero, passos, funcionalidades, FAQ, rodapé); tokens Tailwind coerentes; links `/login`, `/registo`, vitrine demo. |
| **3.2-e** | Páginas legais mínimas (`/termos`, `/privacidade`) com placeholders revisáveis por jurídico; `metadata` SEO e OG; Lighthouse ≥ alvo acordado. |

**Critérios de aceite (macro) — Parte B**

- [x] Conteúdo alinhado a [landing-site-produto.md](../projeto/landing-site-produto.md) §4 (ou desvio registado aqui).  
- [x] Nenhuma afirmação de produto não suportada pelo código ou por roadmap explícito (“Em breve”).  
- [x] Índice [indice-documentacao-e-gaps.md](../projeto/indice-documentacao-e-gaps.md) actualizado após go-live da landing.

---

## 4. Critérios de aceite (macro) — Parte A (impressão)

- [x] Definições por loja (ou dispositivo) para canal, largura de bobina e papel de envio (A4/A6).
- [x] Impressão de comprovante a partir do pedido com conteúdo alinhado ao detalhe do painel (linhas, totais, notas).
- [x] Pelo menos um caminho **não térmico** (PDF/HTML) estável em Chrome e Firefox em desktop.
- [x] Pelo menos um caminho **térmico** documentado (USB **ou** BT) com lista de modelos testados ou “modo experimental”.
- [x] OpenAPI e testes de API para o contrato de impressão; E2E smoke para `/`, `/termos`, `/privacidade` (Playwright).

---

## 5. Dependências e gates

- **Fase 3.1** concluída no painel (detalhe de pedidos utilizável).
- **HTTPS** no ambiente onde se pretende Web USB / Web Bluetooth.
- Decisão registada em [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) quando se fixar **estratégia principal** (só web vs agente obrigatório para BT) — proposta **DEC-21** reservada para impressão (preencher na primeira iteração).

---

## 6. Estado da execução

| Campo | Valor |
|-------|--------|
| **Status** | `concluída` |
| **Documento** | Este ficheiro |

---

## 7. Documentação a manter sincronizada

- [plano-implementacao-fase-3-2.md](../execucao/plano-implementacao-fase-3-2.md) — **checklist mestre** (testes + docs no merge).
- [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) — posição da 3.2 entre 3.1 e 4.
- [CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) — ao iniciar/fechar sub-fases.
- [backlog.md](../projeto/backlog.md) — se surgirem débitos (novos modelos, agente nativo).
- [landing-site-produto.md](../projeto/landing-site-produto.md) — copy e checklist da Parte B.
- [indice-documentacao-e-gaps.md](../projeto/indice-documentacao-e-gaps.md) — rastreio global.

---

## 8. Incrementos de UX do painel (mesma fase 3.2)

Entregues como **continuidade da experiência lojista** no painel (consistência visual e de interacção), sem alterar o âmbito normativo das sub-fases 3.2-a–e:

| Tema | O quê |
|------|--------|
| **Cabeçalho sticky** | `PainelStickyHeading` alargado (`children` opcional) e aplicado às rotas principais do painel — título (e, onde faz sentido, filtros/acções) permanecem visíveis ao scroll; `print:static` ao imprimir. |
| **Botões** | Classes canónicas em `frontend/lib/painel-button-classes.ts` (primário, secundário, perigo, links) reutilizadas nas páginas e componentes (`PainelFormSaveBar`, `ImageUploadButton`, `OrderPrintPanel`, etc.). |
| **Ajuda contextual («?»)** | `FieldTip`: `stopPropagation` dentro de `<summary>`/acordeões, posicionamento do painel com flip vertical, `z-index` elevado, `aria-label` único; `FilterBarFieldTip` para o «?» junto a filtros de datas (ex.: Financeiro, Relatórios). |
| **Configuração — redes sociais** | Secção **Redes sociais** separada de **Aparência da vitrine**, colocada **depois de Identidade da loja** (`/painel/configuracao`); persistência inalterada (`theme.vitrine.social_networks`). |
| **Tabelas do painel** | Classes partilhadas em `frontend/lib/painel-table-classes.ts` (cabeçalhos, células, *wrap*); uso nas listagens com `<table>` (insumos, catálogo, pedidos, relatórios, etc.). |
| **Largura do conteúdo** | `frontend/lib/painel-layout-classes.ts` — alinhamento de blocos principais (`painelPageContentWidthClass`, …) em páginas que devem partilhar a mesma largura útil. |
| **Viewport / altura** | `min-h-dvh` no *shell* e páginas públicas (login, registo, landing, termos, privacidade) para coluna estável em mobile. |
| **Filtros padronizados** | `frontend/lib/painel-filter-classes.ts` — barra de filtros, pesquisa, `select`, datas; páginas: pedidos, clientes, receitas, insumos, catálogo (pesquisa + categoria + estado), precificação, produção (datas + texto), relatório de stock, notificações (lidas/não lidas), analytics vitrine e datas no relatório financeiro. |

Detalhe técnico: [execucao/fase-3-2-implementacao-resumo.md](../execucao/fase-3-2-implementacao-resumo.md) §7–§9 (§9 — refactor **FR-01…FR-06**: componentes config-loja, `PainelDateRangeFields`, `PanelCard`, divisão clientes/catálogo); UX normativa em [projeto/painel-ux-layout-formularios-precificacao.md](../projeto/painel-ux-layout-formularios-precificacao.md) §1.3.

---

*Última revisão: 2026-04-21 — **§8** alargado: tabelas, largura de conteúdo, viewport, filtros padronizados e referência a testes Vitest (`painel-filter-classes.test.ts`). Revisão anterior 2026-04-20: marco 3.2 (impressão, landing, analytics, OpenAPI); incrementos UX (sticky, botões, tips, redes sociais).*
