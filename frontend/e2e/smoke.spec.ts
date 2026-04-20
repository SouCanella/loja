import { expect, test } from "@playwright/test";

test.describe("smoke público", () => {
  test("página de login mostra formulário", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("landing, termos e privacidade respondem", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar loja grátis" }).first()).toBeVisible();

    await page.goto("/termos");
    await expect(page.getByRole("heading", { name: "Termos de utilização" })).toBeVisible();

    await page.goto("/privacidade");
    await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
  });
});
