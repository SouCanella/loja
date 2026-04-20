import { expect, test } from "@playwright/test";

/**
 * Não depende da API: `fetchStorePublic` falha em silêncio e o layout renderiza sem tema.
 */
test.describe("vitrine conta (UI)", () => {
  test("página /loja/[slug]/conta mostra formulário ou estado vazio", async ({ page }) => {
    await page.goto("/loja/e2e-smoke-slug/conta");
    await expect(page.getByRole("heading", { name: "Conta" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Registar" }).first()).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar à vitrine" })).toHaveAttribute(
      "href",
      "/loja/e2e-smoke-slug",
    );
  });
});
