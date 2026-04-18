import { expect, test } from "@playwright/test";

test.describe("smoke público", () => {
  test("página de login mostra formulário", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
