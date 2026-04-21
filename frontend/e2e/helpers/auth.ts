import type { Page } from "@playwright/test";

export function getE2ECredentials(): { email: string; password: string } | null {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

/**
 * Login no painel com utilizador de teste (variáveis de ambiente).
 * Deve ser chamado só dentro de testes que já fizeram `test.skip` se credenciais em falta.
 */
export async function loginAsLojista(page: Page): Promise<void> {
  const cred = getE2ECredentials();
  if (!cred) {
    throw new Error("loginAsLojista: credenciais E2E em falta");
  }
  await page.goto("/login");
  await page.getByLabel("Email").fill(cred.email);
  await page.getByLabel("Palavra-passe").fill(cred.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByText(/Sessão iniciada/i).waitFor({ state: "visible", timeout: 15_000 });
}
