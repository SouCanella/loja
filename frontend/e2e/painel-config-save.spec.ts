import { expect, test } from "@playwright/test";

import { getE2ECredentials, loginAsLojista } from "./helpers/auth";

test.describe("painel — configuração grava (E-P02)", () => {
  test("Guardar alterações mostra confirmação", async ({ page }) => {
    test.skip(!getE2ECredentials(), "defina E2E_EMAIL e E2E_PASSWORD");

    await loginAsLojista(page);
    await page.goto("/painel/configuracao");
    await expect(page.getByRole("heading", { name: "Configuração da loja" })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: "Guardar alterações" }).click();
    await expect(page.getByText(/Alterações guardadas/i)).toBeVisible({ timeout: 20_000 });
  });
});
