import { defineConfig, devices } from "@playwright/test";

const isCi = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
const reuseManual = process.env.PW_REUSE_SERVER === "1";
/** Já existe `.next` (ex.: `npm run build` no mesmo job CI). */
const serverOnly = process.env.PW_SERVER_ONLY === "1";

/**
 * E2E mínimo (RNF-QA-03).
 * - **CI:** `build` + `node .next/standalone/server.js` (compatível com `output: "standalone"`).
 * - **CI + `PW_SERVER_ONLY`:** só sobe o servidor (build feito antes).
 * - **Local:** `next dev` (a menos que `PW_REUSE_SERVER=1` e servidor já no ar).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: reuseManual
    ? undefined
    : isCi
      ? {
          command: serverOnly
            ? "node .next/standalone/server.js"
            : "npm run build && node .next/standalone/server.js",
          url: "http://127.0.0.1:3000",
          reuseExistingServer: false,
          timeout: 180_000,
        }
      : {
          command: "npm run dev",
          url: "http://127.0.0.1:3000",
          reuseExistingServer: true,
          timeout: 120_000,
        },
});
