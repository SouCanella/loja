# Documentação — SaaS gestão de lojas caseiras

Índice da pasta `doc/`.

## Fonte de verdade

| Documento | Papel |
|-----------|--------|
| **[documento_enterprise.md](documento_enterprise.md)** | **Canônico:** visão de produto, princípios, arquitetura, stack, multi-tenant, domínio (loja, admin, estoque, receitas, precificação, pedidos/concorrência), financeiro, UX, FieldHelp, RBAC, API, erros, infra, testes, MVP, backlog enterprise, CI/CD, roadmap |
| [proposta.md](../proposta.md) (raiz) | Atalho que aponta para `documento_enterprise.md` — não duplicar edições aqui |
| [proposta_plataforma_loja.md](proposta_plataforma_loja.md) | Substituído; mantido só para links legados → use `documento_enterprise.md` |

## Roadmap e planejamento por fase

| Documento | Descrição |
|-----------|------------|
| [fases/PLANO-ROADMAP-FASES.md](fases/PLANO-ROADMAP-FASES.md) | **Índice mestre** do roadmap (Fases 0 a 4), MVP vs fases, dependências |

O planejamento **detalhado** de cada fase (objetivos, escopo, critérios de aceite, riscos, estado de execução) está em [fases/](fases/): [fase-00-kickoff.md](fases/fase-00-kickoff.md), [fase-01-fundacao.md](fases/fase-01-fundacao.md), [fase-02-operacao.md](fases/fase-02-operacao.md), [fase-03-gestao.md](fases/fase-03-gestao.md), [fase-04-escala.md](fases/fase-04-escala.md). **Atualize-os** quando o escopo mudar ou ao concluir um marco.

## Outros documentos

| Documento | Descrição |
|-----------|------------|
| [backlog.md](backlog.md) | Pendências enterprise, débitos técnicos e itens fora do escopo fechado |

O que não estiver completo numa fase permanece referenciado em [backlog.md](backlog.md).

## Execução (opcional)

| Arquivo | Uso |
|---------|-----|
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
