import { expect, test } from "@playwright/test";

/**
 * Requer API + utilizador válidos. Exemplo:
 *   E2E_EMAIL=loja@example.com E2E_PASSWORD=secret npm run test:e2e
 */
test.describe("login painel", () => {
  test("fluxo login e /painel com token", async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    test.skip(!email || !password, "defina E2E_EMAIL e E2E_PASSWORD para este teste");

    await page.goto("/login");
    await page.getByLabel("Email").fill(email!);
    await page.getByLabel("Palavra-passe").fill(password!);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText(/Sessão iniciada/i)).toBeVisible({ timeout: 15_000 });

    await page.goto("/painel");
    await expect(page.getByRole("heading", { name: "Resumo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Painel" }).first()).toBeVisible();
  });
});
