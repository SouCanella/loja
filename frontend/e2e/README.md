# Testes E2E (Playwright)

**Norma:** [RNF-QA-03](../../doc/normativos/requisitos-nao-funcionais.md) — evolução; smoke mínimo na pasta `e2e/`.

**Plano de cobertura E2E (o que falta vs pytest/Vitest):** [plano-e2e-mapeamento-implementacao.md](../../doc/execucao/plano-e2e-mapeamento-implementacao.md).

## Pré-requisitos

```bash
npx playwright install chromium
```

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run test:e2e` | Local: sobe `next dev` automaticamente e corre os testes. |
| `PW_REUSE_SERVER=1 npm run test:e2e` | Usa o servidor já a correr em `http://127.0.0.1:3000` (sem novo `webServer`). |
| `npm run test:e2e:ui` | Modo interactivo. |

No **CI** (GitHub Actions), o workflow faz `build` e corre E2E com `PW_SERVER_ONLY=1` (apenas `node .next/standalone/server.js`), alinhado a `output: "standalone"` no Next.

## Ficheiros

- `playwright.config.ts` — `baseURL`, `webServer`, project Chromium.
- `smoke.spec.ts` — página `/login` (sem dependência da API).
- `auth-public.spec.ts` — links `/login` ↔ `/registo` e campos do formulário de nova loja.
- `vitrine-conta.spec.ts` — `/loja/[slug]/conta` (formulário cliente; tema pode estar vazio se a API não estiver acessível).
- `login-painel.spec.ts` — login real + `/painel` (requer API acessível e utilizador válido).
- `painel-regression.spec.ts` — após login, **Guardar alterações** + barra fixa em configuração; catálogo sem erro de API (requer BD migrada).
- `painel-routes-smoke.spec.ts` — percorre rotas principais do menu (E-P01).
- `painel-config-save.spec.ts` — gravação em configuração mostra «Alterações guardadas» (E-P02).
- `vitrine-loja-smoke.spec.ts` — vitrine pública por `E2E_STORE_SLUG`; opcionalmente compara slug com `/api/v2/me` (E-V01).
- `helpers/auth.ts`, `helpers/painel-routes.ts` — login e lista de rotas partilhados.
- `helpers/cta-contrast.ts` — assert de **cor de fundo** dos botões primários (`getComputedStyle`), para evitar regressão «branco em branco» quando faltam classes Tailwind em `lib/`.

## Login com API real (opcional)

Defina no ambiente:

```bash
export E2E_EMAIL='loja@example.com'
export E2E_PASSWORD='…'
# Opcional — vitrine da mesma loja (slug em /loja/{slug}) e teste de consistência com /api/v2/me:
export E2E_STORE_SLUG='minha-loja'
export NEXT_PUBLIC_API_URL='http://127.0.0.1:8000'
```

O frontend deve apontar para a mesma API que conhece esse utilizador (`NEXT_PUBLIC_API_URL`). Se as variáveis não estiverem definidas, o teste é **ignorado** (`test.skip`).
