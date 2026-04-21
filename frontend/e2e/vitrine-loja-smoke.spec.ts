import { expect, test } from "@playwright/test";

import { getE2ECredentials, loginAsLojista } from "./helpers/auth";

/**
 * E-V01: vitrine pública da mesma loja do utilizador E2E.
 * Defina E2E_STORE_SLUG igual ao slug da vitrine (ex.: devolver por GET /api/v2/me após login).
 */
test.describe("vitrine pública — smoke (E-V01)", () => {
  test("loja pública carrega (título da página contém «Vitrine»)", async ({ page }) => {
    const slug = process.env.E2E_STORE_SLUG?.trim();
    test.skip(!slug, "defina E2E_STORE_SLUG (slug da vitrine da loja de teste)");

    await page.goto(`/loja/${encodeURIComponent(slug)}`);
    await expect(page).toHaveTitle(/Vitrine/i, { timeout: 20_000 });
    await expect(page.getByRole("heading").first()).toBeVisible();
  });

  test("após login painel, slug em /api/v2/me coincide com E2E_STORE_SLUG quando definido", async ({
    page,
    request,
  }) => {
    test.skip(!getE2ECredentials(), "defina E2E_EMAIL e E2E_PASSWORD");
    const expectedSlug = process.env.E2E_STORE_SLUG?.trim();
    test.skip(!expectedSlug, "defina E2E_STORE_SLUG para comparar com o perfil");
    const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    test.skip(!apiBase, "defina NEXT_PUBLIC_API_URL (mesmo host que o frontend usa para a API)");

    await loginAsLojista(page);
    const token = await page.evaluate(() => localStorage.getItem("access_token"));
    expect(token).toBeTruthy();

    const res = await request.get(`${apiBase}/api/v2/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { data?: { store_slug?: string } };
    const slug = body.data?.store_slug;
    expect(slug).toBe(expectedSlug);
  });
});
