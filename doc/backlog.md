# Backlog

Itens **não concluídos** ou **parcialmente** entregues. Alinhado ao **§23 — Backlog enterprise** do [documento_enterprise.md](documento_enterprise.md) e a débitos entre fases.

## Legenda

- **Estado:** `nao_iniciado` | `parcial` | `bloqueado`
- **Origem:** enterprise | mvp | tecnico

---

## Backlog enterprise (§23)

| ID | Item | Estado | Notas |
|----|------|--------|-------|
| BE-01 | Eventos sazonais (reforço em comparativos) | nao_iniciado | origem enterprise |
| BE-02 | Pagamentos | nao_iniciado | origem enterprise |
| BE-03 | App mobile | nao_iniciado | origem enterprise |
| BE-04 | BI avançado | nao_iniciado | origem enterprise |
| BE-05 | Multi-usuário por loja | parcial | modelo prevê `users`; RBAC (Admin / Operador / Leitura) e convites — ver §16 do enterprise |
| BE-06 | Assinatura SaaS / monetização | nao_iniciado | inclui **limite por plano** quando aplicável |
| BE-07 | Cache de catálogo | nao_iniciado | §23 proposta consolidada |
| BE-08 | Offline mode | nao_iniciado | §23 |
| BE-09 | Multi-moeda | nao_iniciado | §23 |

## MVP ([documento_enterprise.md](documento_enterprise.md) §22)

Escopo MVP: autenticação, catálogo, pedidos, estoque básico, receitas, precificação simples.

| ID | Requisito | Estado | Dependência |
|----|-----------|--------|-------------|
| MVP-01 | Autenticação (JWT) | parcial | Fase 1+ |
| MVP-02 | Catálogo | parcial | Fase 2 |
| MVP-03 | Pedidos | parcial | Fase 2 |
| MVP-04 | Estoque básico | parcial | Fase 2 |
| MVP-05 | Receitas | parcial | Fase 3 |
| MVP-06 | Precificação simples | parcial | Fase 3 |

Atualizar esta tabela ao fechar cada fase.

## Débitos técnicos e evolução

| ID | Item | Estado | Origem |
|----|------|--------|--------|
| DT-01 | CI/CD (pipeline Git, build Docker, deploy) | nao_iniciado | [documento_enterprise.md](documento_enterprise.md) §24 |
| DT-02 | Observabilidade (métricas/dashboards além de logs MVP) | nao_iniciado | §20 / §4 |
| DT-03 | Cobertura de testes ≥ 90% | parcial | §21 — meta progressiva |

## Como sincronizar

Ao concluir trabalho de uma fase, **remova ou atualize** linhas aqui e registre o que foi entregue no arquivo `doc/fases/fase-0X-*.md` correspondente.
