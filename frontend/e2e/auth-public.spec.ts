import { expect, test } from "@playwright/test";

test.describe("auth público (loja)", () => {
  test("login mostra link para registo de loja", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/registo");
  });

  test("registo mostra formulário de nova loja", async ({ page }) => {
    await page.goto("/registo");
    await expect(page.getByRole("heading", { name: "Criar loja" })).toBeVisible();
    await expect(page.getByLabel("Nome da loja")).toBeVisible();
    await expect(page.getByLabel("Slug da vitrine")).toBeVisible();
    await expect(page.getByLabel("Email do administrador")).toBeVisible();
    await expect(page.getByLabel("Palavra-passe", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login");
  });
});
