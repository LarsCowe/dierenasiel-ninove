import { test, expect, Page } from "@playwright/test";
import { createAnimalData } from "../support/helpers/test-data";

/**
 * Adoptie flow E2E tests (T08 + T14).
 *
 * T08: Volledige adoptie flow — kandidaat aanmaken → kennismaking → contract.
 * T14: Dier uitstroom via OuttakeForm.
 *
 * Beide tests maken eerst een hond aan via intake en navigeren door workflow fasen.
 */

async function createDogViaIntake(page: Page) {
  const animal = createAnimalData();
  await page.goto("/beheerder/dieren/nieuw");
  await page.getByLabel(/naam/i).first().fill(animal.name);
  await page.locator('select[name="species"]').selectOption("hond");
  await page.locator('select[name="gender"]').selectOption("reu");
  await page.getByLabel(/ras/i).fill(animal.breed);
  await page.getByLabel(/kleur/i).fill(animal.color);
  await page.getByLabel(/intake.*datum/i).fill(animal.intakeDate);
  await page.locator('select[name="intakeReason"]').selectOption("afstand");
  await page.getByLabel(/korte beschrijving/i).fill(animal.shortDescription);
  await page.getByRole("button", { name: /registreren/i }).click();
  await expect(page.getByText(/succesvol/i)).toBeVisible({ timeout: 10_000 });
  return animal;
}

async function navigateToDetail(page: Page, animalName: string) {
  await page.goto(`/beheerder/dieren?zoek=${encodeURIComponent(animalName)}`);
  const link = page.locator("a", { hasText: animalName });
  await link.waitFor({ state: "visible", timeout: 10_000 });
  const href = await link.getAttribute("href");
  expect(href).toBeTruthy();
  await page.goto(href!);
  await expect(page).toHaveURL(/\/dieren\/\d+/, { timeout: 15_000 });
  return page.url();
}

async function advancePhase(page: Page, currentPhase: string, nextPhase: string) {
  const nav = page.locator('nav[aria-label*="Workflow stappen"]');
  await nav.getByRole("button", { name: new RegExp(`${currentPhase}.*actieve`, "i") }).click();
  await page.getByRole("button", { name: /volgende fase/i }).click();

  // Check if guard triggers
  const overrideField = page.locator("#override-reason");
  const nextPhaseButton = nav.getByRole("button", {
    name: new RegExp(`${nextPhase}.*actieve`, "i"),
  });

  const result = await Promise.race([
    overrideField.waitFor({ state: "visible", timeout: 5_000 }).then(() => "guard"),
    nextPhaseButton.waitFor({ state: "visible", timeout: 5_000 }).then(() => "passed"),
  ]).catch(() => "timeout");

  if (result === "guard") {
    await overrideField.fill("E2E test override");
    await page.getByRole("button", { name: /override en doorgaan/i }).click();
  }

  await expect(nextPhaseButton).toBeVisible({ timeout: 15_000 });
}

// ─── T08: Adoptie flow: kandidaat → kennismaking → contract ───

test.describe.serial(
  "Adoptie flow: kandidaat → kennismaking → contract @p1 @adoption",
  () => {
    let detailUrl: string;
    let animalName: string;
    let candidateUrl: string;

    test("T08 setup: hond aanmaken en naar adoptie fase brengen @p1", async ({
      page,
    }) => {
      test.setTimeout(120_000);
      const animal = await createDogViaIntake(page);
      animalName = animal.name;
      detailUrl = await navigateToDetail(page, animal.name);

      const nav = page.locator('nav[aria-label*="Workflow stappen"]');
      await expect(nav).toBeVisible();

      // Advance: intake → registratie → medisch → verblijf → adoptie
      await advancePhase(page, "intake", "registratie");
      await advancePhase(page, "registratie", "medisch");
      await advancePhase(page, "medisch", "verblijf");
      await advancePhase(page, "verblijf", "adoptie");

      // Toggle "Beschikbaar voor adoptie" so the animal appears in adoption forms
      const adoptionToggle = page.locator("#adoption-toggle");
      await adoptionToggle.scrollIntoViewIfNeeded();
      await adoptionToggle.click();
      await expect(page.getByText(/zichtbaar voor adoptie/i)).toBeVisible({ timeout: 10_000 });
    });

    test("T08a: adoptie-kandidaat aanmaken en categoriseren @p1 @adoption", async ({
      page,
    }) => {
      test.skip(!detailUrl, "Setup moet eerst slagen");

      // Step 1: Navigate to new candidate form
      await page.goto("/beheerder/adoptie/nieuw");
      await expect(page).toHaveURL(/\/adoptie\/nieuw/);

      // Verify form structure: personal info fields
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();

      // Step 2: Search and select our animal (marked available in setup)
      const animalSearch = page.getByPlaceholder(/zoek op naam, soort of chipnr/i);
      await expect(animalSearch).toBeVisible();
      await animalSearch.fill(animalName);
      await page.waitForTimeout(500);

      const animalButton = page.locator("button", { hasText: animalName }).first();
      await expect(animalButton).toBeVisible({ timeout: 10_000 });
      await animalButton.click();

      // Step 3: Fill personal info
      await page.locator('input[name="firstName"]').fill("Test");
      await page.locator('input[name="lastName"]').fill("Kandidaat");
      await page.locator('input[name="email"]').fill(`e2e-${Date.now()}@test.local`);

      // Step 4: Fill questionnaire (Bijlage IX)
      await page.locator('select:has(option[value="huis_met_tuin"])').selectOption("huis_met_tuin");
      await page.locator('select:has(option[value="voltijds_thuis"])').selectOption("voltijds_thuis");
      await page.getByPlaceholder(/waarom wilt u dit dier adopteren/i)
        .fill("Wij willen graag een trouwe metgezel voor onze familie.");

      // Step 5: Submit candidate
      await page.getByRole("button", { name: /aanvraag registreren/i }).click();
      await expect(page).toHaveURL(/\/adoptie\/\d+/, { timeout: 15_000 });
      candidateUrl = page.url();

      // Step 6: Set category to "Goede kandidaat" (required before kennismaking)
      const goedeKandidaatButton = page.getByRole("button", { name: /goede kandidaat/i });
      await expect(goedeKandidaatButton).toBeVisible();
      await goedeKandidaatButton.click();

      // Verify category is set and kennismaking link appears
      await expect(page.getByText(/plan een kennismaking/i)).toBeVisible({ timeout: 10_000 });
    });

    test("T08b: kennismaking plannen en positief afronden @p1 @adoption", async ({ page }) => {
      test.skip(!candidateUrl, "T08a moet eerst slagen");

      // Step 1: Navigate to candidate detail and click kennismaking link
      await page.goto(candidateUrl);
      const kennismakingLink = page.getByRole("link", { name: /kennismaking plannen/i });
      await expect(kennismakingLink).toBeVisible({ timeout: 10_000 });
      await kennismakingLink.click();
      await expect(page).toHaveURL(/\/kennismaking/, { timeout: 10_000 });

      // Step 2: Fill kennismaking form
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);
      await page.locator('input[name="scheduledAt"]').fill(tomorrow.toISOString().slice(0, 16));

      // Step 3: Submit — redirects back to candidate detail
      await page.getByRole("button", { name: /kennismaking plannen/i }).click();
      await expect(page).toHaveURL(/\/adoptie\/\d+$/, { timeout: 15_000 });

      // Step 4: Verify "Gepland" badge appears in kennismakingen section
      await expect(page.getByText("Gepland", { exact: true })).toBeVisible({ timeout: 10_000 });

      // Step 5: Register outcome "Positief" (triggers prompt dialog for notes)
      page.on("dialog", (dialog) => dialog.accept("E2E test kennismaking OK"));
      await page.getByRole("button", { name: /positief/i }).click();

      // Step 6: Verify candidate becomes "Goedgekeurd" — contract link visible
      await expect(page.getByRole("link", { name: /contract opmaken/i })).toBeVisible({ timeout: 15_000 });
    });

    test("T08c: contract opmaken en adoptie afronden @p1 @adoption", async ({
      page,
    }) => {
      test.skip(!candidateUrl, "T08b moet eerst slagen");

      // Step 1: Navigate to candidate detail — "Contract opmaken" link visible for approved
      await page.goto(candidateUrl);
      const contractLink = page.getByRole("link", { name: /contract opmaken/i });
      await expect(contractLink).toBeVisible({ timeout: 10_000 });
      await contractLink.click();
      await expect(page).toHaveURL(/\/contract/, { timeout: 10_000 });

      // Step 2: Fill contract form
      const today = new Date().toISOString().split("T")[0];
      await page.locator('input[name="contractDate"]').fill(today);
      await page.locator('input[name="paymentAmount"]').fill("150.00");
      await page.locator('select[name="paymentMethod"]').selectOption("cash");

      // Step 3: Submit — may trigger chipwaarschuwing alert
      page.on("dialog", (dialog) => dialog.accept());
      await page.getByRole("button", { name: /contract opmaken/i }).click();

      // Step 4: Wait briefly for server action, then navigate to candidate detail
      // (router.push soft navigation not reliably detected by Playwright)
      await page.waitForTimeout(3_000);
      await page.goto(candidateUrl);

      // Step 5: Verify "Geadopteerd" status on candidate detail page
      await expect(page.getByText("Geadopteerd", { exact: true })).toBeVisible({ timeout: 10_000 });
    });
  },
);

// ─── T14: Dier uitstroom via OuttakeForm ───

test("T14: dier uitstroom via OuttakeForm @p1 @adoption", async ({
  page,
}) => {
  // Step 1: Create a new dog via intake
  const animal = await createDogViaIntake(page);

  // Step 2: Navigate to detail page
  await navigateToDetail(page, animal.name);

  // Step 3: Find "Uitstroom registreren" button
  const uitstroomButton = page.getByRole("button", {
    name: /uitstroom registreren/i,
  });
  await expect(uitstroomButton).toBeVisible({ timeout: 10_000 });

  // Step 4: Click it — inline form appears
  await uitstroomButton.click();

  // Step 5: Select reason
  await page.locator("#outtake-reason").selectOption("terug_eigenaar");

  // Step 6: Fill date
  const today = new Date().toISOString().split("T")[0];
  await page.locator("#outtake-date").fill(today);

  // Step 7: Submit
  await page
    .getByRole("button", { name: /bevestig uitstroom/i })
    .click();

  // Step 8: Verify success
  await expect(page.getByText(/uitstroom geregistreerd/i)).toBeVisible({
    timeout: 10_000,
  });

  // Step 9: Verify animal shows "niet meer in het asiel" after refresh
  await expect(page.getByText(/niet meer in het asiel/i)).toBeVisible({ timeout: 10_000 });
});
