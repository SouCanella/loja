# Documentação — SaaS gestão de lojas caseiras

Índice da pasta `doc/`.

## Estrutura

| Pasta / arquivo | Conteúdo |
|-----------------|----------|
| **[documento_enterprise.md](documento_enterprise.md)** | Visão canônica (arquitetura, domínio, MVP, roadmap) — permanece na raiz de `doc/` |
| **[normativos/](normativos/)** | Regras de negócio (`RN-*`), requisitos funcionais/não funcionais (`RF-*`, `RNF-*`), matriz RN → testes |
| **[projeto/](projeto/)** | Decisões **DEC-***, backlog, [qualidade-e-conformidade.md](projeto/qualidade-e-conformidade.md) (auditoria vs RNF), rastreabilidade com `inicio_planejamento.txt`, proposta legada |
| **[fases/](fases/)** | Roadmap por fase (0–4) e plano mestre |
| **[execucao/](execucao/)** | Changelog de marcos; [TESTES-E-CI.md](execucao/TESTES-E-CI.md) (hub pytest / Vitest / Playwright / CI) |
| **[mockups/](mockups/)** | Protótipos HTML navegáveis (vitrine pública, painel admin) — referência de UX e RF; ver **[mockups/README.md](mockups/README.md)** (índice, secções do admin, ligação aos RF) |
| **[api/](api/)** | Contrato **OpenAPI 3** versionado (`openapi.json`), UI **ReDoc** offline (`index.html`); **RNF-DevEx-08** — ver **[api/README.md](api/README.md)** |
| **[README.md](../README.md)** (raiz do repositório) | Monorepo: `make`, Docker Compose, pastas `backend/` / `frontend/` — Fases **0–3** documentadas; inventário Fase 3 em [fases/fase-03-gestao.md](fases/fase-03-gestao.md) **§10** |

## Ordem de leitura sugerida

1. **[documento_enterprise.md](documento_enterprise.md)** — visão única: arquitetura, stack, domínio resumido, MVP, roadmap por fases.
2. **[normativos/regras-negocio.md](normativos/regras-negocio.md)** — invariantes e regras por área (`RN-*`).
3. **[normativos/requisitos-funcionais.md](normativos/requisitos-funcionais.md)** — o que o sistema deve fazer (`RF-*`).
4. **[normativos/requisitos-nao-funcionais.md](normativos/requisitos-nao-funcionais.md)** — segurança, performance, testes, etc. (`RNF-*`).
5. **[normativos/matriz-rn-testes.md](normativos/matriz-rn-testes.md)** — opcional: rastreabilidade **RN → caso de teste** (evolução; **RNF-QA-06**).
6. **[execucao/TESTES-E-CI.md](execucao/TESTES-E-CI.md)** — pytest, Vitest, Playwright e GitHub Actions (complementa [qualidade-e-conformidade.md](projeto/qualidade-e-conformidade.md)).
7. **[projeto/decisoes-e-pendencias.md](projeto/decisoes-e-pendencias.md)** — decisões **DEC-01 … DEC-20**, **ADR leve** por DEC e **gates por fase**.
8. **[projeto/rastreabilidade-fontes.md](projeto/rastreabilidade-fontes.md)** — ligação entre [inicio_planejamento.txt](../inicio_planejamento.txt) e os documentos normativos.
9. **[fases/PLANO-ROADMAP-FASES.md](fases/PLANO-ROADMAP-FASES.md)** — Fases 0–4 e equivalência com MVPs do planejamento em texto.

## Contrato HTTP (OpenAPI 3)

- **Ficheiros:** [api/openapi.json](api/openapi.json) (gerado a partir do código FastAPI) e [api/index.html](api/index.html) (ReDoc que lê o JSON no mesmo diretório).
- **Regenerar** após alterar rotas ou schemas: na raiz do repo, `make openapi-export` (usa `backend/.venv`).
- **Ler sem subir a API:** instruções em [api/README.md](api/README.md) (servidor HTTP local com `python3 -m http.server`).
- **Com a API em execução:** `GET /openapi.json`, UI em `/redoc` (Swagger UI `/docs` desativado no código).

## Estado do roadmap

| Marco | Situação |
|-------|----------|
| Fase 0 — Kickoff | Concluída (ver [execucao/CHANGELOG-FASES.md](execucao/CHANGELOG-FASES.md)) |
| Fase 1 — Fundação | Concluída e documentada em [fases/fase-01-fundacao.md](fases/fase-01-fundacao.md) |
| Fase 2 — Operação | Concluída (inventário [fases/fase-02-operacao.md](fases/fase-02-operacao.md) §10) |
| **Fase 3 — Gestão** | **Concluída** (API + painel receitas/produção/relatório CSV): [fases/fase-03-gestao.md](fases/fase-03-gestao.md) **§8–§10** |

## Checklist pré-desenvolvimento

Antes de **iniciar a implementação de uma fase**, confira os **gates** em [projeto/decisoes-e-pendencias.md](projeto/decisoes-e-pendencias.md) e o bloco **«Documentação normativa»** + **«Gates antes de implementar esta fase»** no arquivo [fases/fase-0X-*.md](fases/) correspondente (ex.: Fase 1 exige **DEC-16**, **DEC-18**, **DEC-19** aplicados ao desenho).

## Fonte de verdade

| Documento | Papel |
|-----------|--------|
| **[documento_enterprise.md](documento_enterprise.md)** | **Canônico** para visão de produto, arquitetura, stack, multi-tenant, domínio resumido, API, UX, MVP, backlog enterprise de alto nível |
| [normativos/regras-negocio.md](normativos/regras-negocio.md), [normativos/requisitos-funcionais.md](normativos/requisitos-funcionais.md), [normativos/requisitos-nao-funcionais.md](normativos/requisitos-nao-funcionais.md) | **Normativos** para especificação detalhada e testes |
| [inicio_planejamento.txt](../inicio_planejamento.txt) | **Material bruto** de ideias; a norma evolui nos `.md` acima |
| [proposta.md](../proposta.md) (raiz) | Atalho para `documento_enterprise.md` |
| [projeto/proposta_plataforma_loja.md](projeto/proposta_plataforma_loja.md) | Substituído; use `documento_enterprise.md` |

## Roadmap e planejamento por fase

| Documento | Descrição |
|-----------|------------|
| [fases/PLANO-ROADMAP-FASES.md](fases/PLANO-ROADMAP-FASES.md) | **Índice mestre** do roadmap (Fases 0 a 4), MVP vs fases, equivalências com o texto de planejamento |

O planejamento **detalhado** de cada fase está em [fases/](fases/).

## Backlog e execução

| Documento | Descrição |
|-----------|------------|
| [projeto/backlog.md](projeto/backlog.md) | Backlog enterprise (BE-*), MVP, débitos técnicos, **ideias de produto** (IP-*) |
| [execucao/CHANGELOG-FASES.md](execucao/CHANGELOG-FASES.md) | Notas datadas por sprint ou marco |

## Testes e relatórios HTML

Os artefatos HTML **não são versionados** (veja `.gitignore` na raiz). Gere localmente e abra no navegador.

Na raiz do repositório:

```bash
make test          # executa testes (backend + frontend)
make test-report   # gera relatórios HTML de cobertura e execução
```

### Onde abrir os relatórios (após `make test-report`)

| Camada | Relatório | Caminho típico |
|--------|-----------|----------------|
| Backend | Cobertura | `backend/htmlcov/index.html` |
| Backend | Execução pytest | `backend/reports/pytest/report.html` |
| Frontend | Cobertura (Vitest) | `frontend/coverage/index.html` |
| Frontend | E2E Playwright (se configurado) | `frontend/playwright-report/index.html` |

Para servir arquivos estáticos localmente (exemplo):

```bash
cd backend && python3 -m http.server 8765 --directory htmlcov
# ou abrir os index.html diretamente no navegador
```
