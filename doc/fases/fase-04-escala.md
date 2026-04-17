# Fase 4 — Escala (planejamento completo)

**Referência:** [documento_enterprise.md](../documento_enterprise.md) §4 (stack / observabilidade evolução), §20 (observabilidade e infra), §21 (testes), §23 (backlog enterprise), §24 (CI/CD), §25 (roadmap)  
**Opcional nesta fase:** **DEC-15** (Super Admin / plataforma), subdomínio (evolução de **DEC-19**), itens do [backlog.md](../projeto/backlog.md).

## Documentação normativa (leitura obrigatória para esta fase)

- [regras-negocio.md](../normativos/regras-negocio.md)
- [requisitos-funcionais.md](../normativos/requisitos-funcionais.md)
- [requisitos-nao-funcionais.md](../normativos/requisitos-nao-funcionais.md)
- [decisoes-e-pendencias.md](../projeto/decisoes-e-pendencias.md) — **DEC-15** (se implementar plataforma); §23 backlog

### Gates antes de implementar esta fase

- Fases 1–3 concluídas no escopo mínimo do MVP ou explicitamente reduzido no backlog.
- Se for construir **Super Admin**, seguir **DEC-15** e RF-Plataforma.

---

## 1. Objetivo

Preparar o produto para **operação contínua** e evolução comercial: **observabilidade**, **CI/CD**, **hardening** de segurança e performance, e **priorização** de itens do backlog enterprise (**§23**) conforme capacidade — sem exigir que todos os itens §23 sejam fechados nesta fase.

---

## 2. Escopo planejado

### 2.1 Observabilidade (§4, §20)

- Métricas (ex.: Prometheus) e dashboards (ex.: Grafana) ou stack equivalente **mínima**.
- Logs estruturados correlacionáveis (request id, store_id quando aplicável).

### 2.2 CI/CD (§24)

- Pipeline em Git: lint + testes + build Docker.
- Deploy automático: definir alvo (staging/produção) na execução.

### 2.3 Qualidade e cobertura (§21)

- Aproximar ou atingir **90%** de cobertura onde aplicável; falhas de pipeline em regressão.

### 2.4 Segurança e escala

- Revisão de JWT, rate limiting básico, segredos só em ambiente.
- Otimizações de consulta e índices onde necessário.

### 2.5 Backlog enterprise (§23) — escolha priorizada

Candidatos típicos (não obrigatório fechar todos):

- Multi-usuário por loja (refinar RBAC §16, convites).
- Pagamentos / assinatura SaaS / limites por plano — se produto exigir monetização.
- Cache de catálogo, offline, multi-moeda, eventos sazonais, BI avançado, app mobile — normalmente após núcleo estável (ver [backlog.md](../projeto/backlog.md)).

Cada item puxado para esta fase deve ter critérios próprios na **seção Execução**.

---

## 3. Critérios de aceite (macro)

- [ ] Pipeline CI verde com testes e build de imagens.
- [ ] Ambiente de deploy documentado (mesmo que staging).
- [ ] Dashboards ou métricas mínimas acessíveis; logs estruturados em rotas críticas.
- [ ] Itens enterprise escolhidos para a fase: critérios de aceite específicos atendidos ou movidos ao [backlog.md](../projeto/backlog.md).
- [ ] Este documento e [PLANO-ROADMAP-FASES.md](PLANO-ROADMAP-FASES.md) revisados.

---

## 4. Dependências

- **Fase 3** concluída (gestão e MVP funcional).

---

## 5. Testes

- Testes E2E críticos (ex.: Playwright) na pipeline se adotados.
- Relatórios HTML continuam disponíveis localmente e, se desejado, artefatos de CI armazenados (fora do escopo Git).

---

## 6. Riscos

| Risco | Mitigação |
|-------|-----------|
| Escopo §23 inflar a fase | time-box e priorização explícita no backlog |
| Custo de infra de observabilidade | começar com stack mínima self-hosted ou managed |

---

## 7. Estado da execução

| Campo | Valor |
|-------|--------|
| **Status** | `planejado` |
| **Data de conclusão** | — |
| **Notas** | Preencher ao concluir. |
