import { test as setup, expect } from "@playwright/test";

const BEHEERDER_FILE = "tests/support/.auth/beheerder.json";

setup("authenticate as beheerder", async ({ page }) => {
  await page.goto("/login");

  // Wait for splash animation to complete and form to appear
  await page.getByRole("textbox", { name: /e-mail/i }).waitFor({ timeout: 10_000 });

  // Fill login form
  await page.getByRole("textbox", { name: /e-mail/i }).fill("sven@dierenasielninove.be");
  await page.getByLabel(/wachtwoord/i).fill("admin-only");

  // Click beheerder login button
  await page.getByRole("button", { name: /beheerder/i }).click();

  // Wait for redirect to beheerder dashboard
  await expect(page).toHaveURL(/\/beheerder/, { timeout: 15_000 });

  // Save authentication state
  await page.context().storageState({ path: BEHEERDER_FILE });
});
