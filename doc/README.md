# Documentação — SaaS gestão de lojas caseiras

Índice da pasta `doc/`.

## Estrutura

| Pasta / arquivo | Conteúdo |
|-----------------|----------|
| **[documento_enterprise.md](documento_enterprise.md)** | Visão canônica (arquitetura, domínio, MVP, roadmap) — permanece na raiz de `doc/` |
| **[normativos/](normativos/)** | Regras de negócio (`RN-*`), requisitos funcionais/não funcionais (`RF-*`, `RNF-*`), matriz RN → testes |
| **[projeto/](projeto/)** | Decisões **DEC-***, backlog, rastreabilidade com `inicio_planejamento.txt`, proposta legada |
| **[fases/](fases/)** | Roadmap por fase (0–4) e plano mestre |
| **[execucao/](execucao/)** | Changelog de marcos |

## Ordem de leitura sugerida

1. **[documento_enterprise.md](documento_enterprise.md)** — visão única: arquitetura, stack, domínio resumido, MVP, roadmap por fases.
2. **[normativos/regras-negocio.md](normativos/regras-negocio.md)** — invariantes e regras por área (`RN-*`).
3. **[normativos/requisitos-funcionais.md](normativos/requisitos-funcionais.md)** — o que o sistema deve fazer (`RF-*`).
4. **[normativos/requisitos-nao-funcionais.md](normativos/requisitos-nao-funcionais.md)** — segurança, performance, testes, etc. (`RNF-*`).
5. **[normativos/matriz-rn-testes.md](normativos/matriz-rn-testes.md)** — opcional: rastreabilidade **RN → caso de teste** (evolução; **RNF-QA-06**).
6. **[projeto/decisoes-e-pendencias.md](projeto/decisoes-e-pendencias.md)** — decisões **DEC-01 … DEC-20**, **ADR leve** por DEC e **gates por fase**.
7. **[projeto/rastreabilidade-fontes.md](projeto/rastreabilidade-fontes.md)** — ligação entre [inicio_planejamento.txt](../inicio_planejamento.txt) e os documentos normativos.
8. **[fases/PLANO-ROADMAP-FASES.md](fases/PLANO-ROADMAP-FASES.md)** — Fases 0–4 e equivalência com MVPs do planejamento em texto.

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
cd backend && python -m http.server 8765 --directory htmlcov
# ou abrir os index.html diretamente no navegador
```
