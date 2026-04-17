# Matriz RN → casos de teste

**Propósito:** rastrear regras de negócio (`RN-*` em [regras-negocio.md](regras-negocio.md)) até casos de teste automatizados ou manuais — **evolução opcional**; atualizar ao fechar fase ou feature (ver [requisitos-nao-funcionais.md](requisitos-nao-funcionais.md) **RNF-QA-06**).

**Última atualização:** 2026-04-17 — template inicial.

---

## Como usar

| Coluna | Significado |
|--------|-------------|
| **RN** | Identificador da regra em `regras-negocio.md` |
| **Caso / identificador** | Nome do teste, `test_…`, ID Gherkin ou ticket |
| **Camada** | `unit`, `integration`, `e2e`, `manual` |
| **Fase alvo** | Fase do roadmap em que a regra entra em vigor (0–4) |
| **Status** | `pendente`, `ok`, `n/a` |

---

## Matriz (preencher incrementalmente)

| RN | Caso / identificador | Camada | Fase alvo | Status |
|----|----------------------|--------|-----------|--------|
| *ex.: RN-001* | *ex.: `test_tenant_isolation`* | integration | 1 | pendente |
| | | | | |

---

## Notas

- Priorizar RN ligados a fluxos críticos (auth, tenant, pedido, estoque, produção) conforme [requisitos-nao-funcionais.md](requisitos-nao-funcionais.md) RNF-QA-04.
- Duplicar linhas se um RN tiver vários casos (um por linha).
