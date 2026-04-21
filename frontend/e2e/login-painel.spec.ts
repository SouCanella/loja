import { expect, test } from "@playwright/test";

import { getE2ECredentials, loginAsLojista } from "./helpers/auth";

/**
 * Requer API + utilizador válidos. Exemplo:
 *   E2E_EMAIL=loja@example.com E2E_PASSWORD=secret npm run test:e2e
 */
test.describe("login painel", () => {
  test("fluxo login e /painel com token", async ({ page }) => {
    test.skip(!getE2ECredentials(), "defina E2E_EMAIL e E2E_PASSWORD para este teste");

    await loginAsLojista(page);

    await page.goto("/painel");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Painel" }).first()).toBeVisible();
  });
});
