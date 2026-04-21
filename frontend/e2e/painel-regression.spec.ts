import { expect, test } from "@playwright/test";

import { getE2ECredentials, loginAsLojista } from "./helpers/auth";
import { expectCtaButtonBackground } from "./helpers/cta-contrast";

/**
 * Regressão mínima do painel (rotas críticas após login).
 * Requer API + BD migrados + utilizador válidos:
 *   E2E_EMAIL=… E2E_PASSWORD=… npm run test:e2e -- e2e/painel-regression.spec.ts
 */
test.describe("painel — regressão (API)", () => {
  test("configuração: botão Guardar visível; catálogo: sem erro de carregamento", async ({
    page,
  }) => {
    test.skip(!getE2ECredentials(), "defina E2E_EMAIL e E2E_PASSWORD para este teste");

    await loginAsLojista(page);

    await page.goto("/painel/configuracao");
    await expect(page.getByRole("heading", { name: "Configuração da loja" })).toBeVisible({
      timeout: 15_000,
    });
    const btnInline = page.getByRole("button", { name: "Guardar alterações" });
    await expect(btnInline).toBeVisible();
    await expectCtaButtonBackground(btnInline, "Guardar alterações (inline)");
    const btnFixed = page
      .getByRole("region", { name: /Acções de gravação do formulário/ })
      .getByRole("button", { name: "Guardar" });
    await expect(btnFixed).toBeVisible();
    await expectCtaButtonBackground(btnFixed, "Guardar (barra fixa)");

    await page.goto("/painel/catalogo");
    await expect(page.getByRole("heading", { name: "Produtos & catálogo" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/Erro ao carregar produtos/i)).toHaveCount(0);
    await expect(page.locator("text=/^(Produtos|Categorias):/")).toHaveCount(0);
  });
});
