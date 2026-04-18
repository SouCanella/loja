# Testes E2E (Playwright)

**Norma:** [RNF-QA-03](../../doc/normativos/requisitos-nao-funcionais.md) — evolução; smoke mínimo na pasta `e2e/`.

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
