# Índice da documentação e lacunas (rastreio)

**Objectivo:** uma vista única do que está **documentado**, **parcial** ou **só no código**; e lista de **gaps** a fechar quando a equipa priorizar.

**Como usar:** actualizar este ficheiro quando fechar marcos (CHANGELOG) ou quando aparecer desvio entre norma e implementação.

---

## 1. Mapa mestre (`doc/`)

| Área | Ficheiro principal | Papel |
|------|---------------------|--------|
| Visão | [documento_enterprise.md](../documento_enterprise.md) | Canónico: arquitectura, MVP, backlog enterprise |
| Roadmap | [fases/PLANO-ROADMAP-FASES.md](../fases/PLANO-ROADMAP-FASES.md) | Fases 0–4, 3.1, 3.2 |
| Fase 3.1 | [fases/fase-03-1-paridade-mockup.md](../fases/fase-03-1-paridade-mockup.md) | Paridade painel — concluída |
| Fase 3.2 | [fases/fase-03-2-impressao-termica.md](../fases/fase-03-2-impressao-termica.md) | Impressão + site institucional + analytics vitrine — **concluída**; incrementos UX painel em **§8** / [execucao/fase-3-2-implementacao-resumo.md](../execucao/fase-3-2-implementacao-resumo.md) **§7** |
| Fase 4 | [fases/fase-04-escala.md](../fases/fase-04-escala.md) | Escala, CI, observabilidade |
| Decisões | [decisoes-e-pendencias.md](decisoes-e-pendencias.md) | DEC-01 … DEC-23 |
| Backlog | [backlog.md](backlog.md) | MA-*, FR-* (refactor painel), BE-*, MVP-* |
| Relatórios | [relatorios-analytics-roadmap.md](relatorios-analytics-roadmap.md) | Analytics vs operação |
| Relatórios (negócio) | [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) | **DEC-22** — estados, cupons, descontos |
| Landing marketing | [landing-site-produto.md](landing-site-produto.md) | Página inicial — especificação Fase 3.2 |
| Ideias (partilha, cardápio, stock/produto) | [ideias-compartilhar-cardapio-estoque-por-produto.md](ideias-compartilhar-cardapio-estoque-por-produto.md) | IP-12 … IP-14; **DEC-23** reservada |
| Vitrine / tema | [vitrine-configuracao-aparencia.md](vitrine-configuracao-aparencia.md) | RF-CF, cache |
| Paridade vitrine | [paridade-mockup-vitrine.md](paridade-mockup-vitrine.md) | Mockup vs código |
| Identidade visual | [identidade-visual-e-paletas.md](identidade-visual-e-paletas.md) | Tokens gráficos |
| Painel UX / precificação / stock | [painel-ux-layout-formularios-precificacao.md](painel-ux-layout-formularios-precificacao.md) | Sticky título na página; Guardar fixo; MO+MP; validades |
| Qualidade | [qualidade-e-conformidade.md](qualidade-e-conformidade.md) | RNF vs código |
| API | [api/openapi.json](../api/openapi.json) | Contrato; `make openapi-export` |
| Execução | [execucao/CHANGELOG-FASES.md](../execucao/CHANGELOG-FASES.md) | Marcos por data |
| Fase 3.2 — plano | [execucao/plano-implementacao-fase-3-2.md](../execucao/plano-implementacao-fase-3-2.md) | Implementação, testes, docs |
| Testes | [execucao/TESTES-E-CI.md](../execucao/TESTES-E-CI.md) | pytest, Vitest, E2E |

---

## 2. Estado por tema (síntese)

| Tema | Documentação | Implementação | Gap |
|------|----------------|---------------|-----|
| Multi-tenant / JWT | DEC-01, DEC-13, enterprise | Sim | Cookie httpOnly — MVP-01 parcial |
| Media / imagens (MA-03) | enterprise DEC-04; norma RF-CA-03 | **Sim** (`/api/v2/media/upload`, local/S3) | Actualizar linha MA-03 em [backlog.md](backlog.md) para `convertido`/`parcial` + variáveis env documentadas em README backend se faltar |
| Relatórios ampliados (DEC-22) | [relatorios-definicoes-negocio.md](relatorios-definicoes-negocio.md) | Cupons/descontos **não** migrados em schema | Migração Alembic + API + UI |
| Pagamento liquidado (`payment_status`) | DEC-22 §3 | Não | Campo opcional em `orders` |
| Analytics vitrine (visitas, geo) | [relatorios-analytics-roadmap.md](relatorios-analytics-roadmap.md) §4 | **Parcial** — eventos `page_view`, `product_view`, `add_to_cart`, `checkout_open`; resumo no painel | Geo agregada (país) opcional via cabeçalhos CDN; funil completo e retention |
| Impressão térmica | [fase-03-2](../fases/fase-03-2-impressao-termica.md), DEC-21 | **Sim** — `GET /api/v2/orders/{id}/print`, `print_config`, painel, ESC/POS experimental | Matriz hardware real (USB/BT) para suporte declarado |
| Site institucional / landing | [landing-site-produto.md](landing-site-produto.md) | **Sim** — `/`, `/termos`, `/privacidade` | Revisão jurídica dos textos legais |
| Monetização / planos PRO | enterprise §23, BE-06, DEC-22 §5 | Não | Billing |
| App mobile | BE-03 | Não | Backlog |
| Super Admin (DEC-15) | decisoes | Não | Fase 4 / backlog |
| Concorrentes / posicionamento | *Este índice* | Análise Stoqui integrada em [landing-site-produto.md](landing-site-produto.md) §2 | — |

---

## 3. Lacunas documentais já identificadas

1. **MA-03 no backlog** ainda como `nao_iniciado` — **desactualizado** face ao código; corrigir tabela MA-* em [backlog.md](backlog.md).  
2. **Variáveis de ambiente MEDIA_*** / S3 — se não estiverem só no `config.py`, acrescentar secção breve no `README` da raiz ou `backend/README` (quando existir).  
3. **Billing e limites por plano** — apenas referências em enterprise/backlog; **sem** spec de preços/API até priorização (**BE-06**).  
4. **Política de privacidade / termos** — não há texto legal no repo (correcto); a landing aponta para páginas a criar.  
5. **Análise competitiva Stoqui** — consolidada na landing §2; não duplicar ficheiro separado.

---

## 4. O que *não* duplicar

- Inventário detalhado da Fase 3 continua em [fase-03-gestao.md](../fases/fase-03-gestao.md) §10.  
- Matriz RN → testes em [normativos/matriz-rn-testes.md](../normativos/matriz-rn-testes.md).

---

## 5. Próxima revisão sugerida

- Após implementação da landing (`page.tsx`).  
- Após migração **DEC-22** (cupons/descontos).  
- Após fecho de qualquer sub-fase **3.2**.

---

*Última revisão: 2026-04-20 — criação do índice e rastreio de gaps.*
