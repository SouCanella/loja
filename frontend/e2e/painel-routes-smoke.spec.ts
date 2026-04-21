import { expect, test } from "@playwright/test";

import { getE2ECredentials, loginAsLojista } from "./helpers/auth";
import { PAINEL_SMOKE_ROUTES } from "./helpers/painel-routes";

test.describe("painel — rotas do menu (E-P01)", () => {
  test("cada rota principal monta o heading esperado", async ({ page }) => {
    test.skip(!getE2ECredentials(), "defina E2E_EMAIL e E2E_PASSWORD");

    await loginAsLojista(page);

    for (const { path, heading } of PAINEL_SMOKE_ROUTES) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible({
        timeout: 20_000,
      });
    }
  });
});
