import { test, expect, Page } from "@playwright/test";
import { createAnimalData } from "../support/helpers/test-data";

/**
 * Medische flow E2E tests (T09 + T10 + T11).
 *
 * T09: Medicatie voorschrijven en afvinken.
 * T10: Vaccinatie registreren.
 * T11: Dierenarts bezoek registreren.
 *
 * Elke test maakt een hond aan via intake en opent de medische fiche sectie.
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

async function expandMedischeFiche(page: Page) {
  const section = page.getByRole("button", { name: /medische fiche/i });
  // Only click if not already expanded
  const isExpanded = await section.getAttribute("aria-expanded");
  if (isExpanded !== "true") {
    await section.click();
  }
  // Wait for a subsection button to appear (indicates content loaded)
  await expect(
    page.getByRole("button", { name: /nieuw voorschrift|nieuwe vaccinatie|nieuw bezoek/i }).first(),
  ).toBeVisible({ timeout: 10_000 });
}

// ─── T09: Medicatie voorschrijven en afvinken ───

test.describe.serial(
  "Medicatie voorschrijven en afvinken @p1 @medical",
  () => {
    let animalName: string;
    let detailUrl: string;

    test("T09a: medicatie voorschrijven @p1 @medical", async ({ page }) => {
      // Create a dog via intake
      const animal = await createDogViaIntake(page);
      animalName = animal.name;
      detailUrl = await navigateToDetail(page, animal.name);

      // Expand "Medische fiche" collapsible section
      await expandMedischeFiche(page);

      // Find and click medication add button
      await page
        .getByRole("button", { name: /nieuw voorschrift/i })
        .click();

      // Fill MedicationForm
      await page.locator('input[name="medicationName"]').fill("Amoxicilline");
      await page.locator('input[name="dosage"]').fill("2x daags 1 tablet");
      const today = new Date().toISOString().split("T")[0];
      await page.locator('input[name="startDate"]').fill(today);

      // Submit
      await page
        .getByRole("button", { name: /medicatie voorschrijven/i })
        .click();

      // Verify success
      await expect(page.getByText(/medicatie voorgeschreven/i)).toBeVisible({
        timeout: 10_000,
      });
    });

    test("T09b: medicatie afvinken via overzicht @p1 @medical", async ({
      page,
    }) => {
      test.skip(!animalName, "T09a moet eerst slagen");

      // Navigate to medication overview
      await page.goto("/beheerder/medisch");
      await expect(page).toHaveURL(/\/medisch/);

      // Find the animal's medication card by heading, then click "Afvinken"
      const animalCard = page.locator("div.rounded-xl").filter({
        has: page.locator(`h3:has-text("${animalName}")`),
      });
      await expect(animalCard).toBeVisible({ timeout: 10_000 });
      await animalCard.getByRole("button", { name: /afvinken/i }).click();

      // Verify: "Toegediend om" text appears (use first() in case of multiple)
      await expect(page.getByText(/toegediend om/i).first()).toBeVisible({
        timeout: 10_000,
      });
    });
  },
);

// ─── T10: Vaccinatie registreren ───

test("T10: vaccinatie registreren @p1 @medical", async ({ page }) => {
  // Create a dog via intake
  const animal = await createDogViaIntake(page);
  await navigateToDetail(page, animal.name);

  // Expand "Medische fiche" collapsible section
  await expandMedischeFiche(page);

  // Find vaccination section and click add button
  await page
    .getByRole("button", { name: /nieuwe vaccinatie/i })
    .click();

  // Fill VaccinationForm
  const typeSelect = page.locator('select[name="type"]');
  await typeSelect.waitFor({ state: "visible", timeout: 10_000 });
  // Select first available option (skip empty/placeholder)
  const options = typeSelect.locator("option:not([value=''])");
  const firstOptionValue = await options.first().getAttribute("value");
  if (firstOptionValue) {
    await typeSelect.selectOption(firstOptionValue);
  }

  const today = new Date().toISOString().split("T")[0];
  await page.locator('input[name="date"]').fill(today);

  // Submit
  await page
    .getByRole("button", { name: /vaccinatie registreren/i })
    .click();

  // Verify success
  await expect(page.getByText(/vaccinatie geregistreerd/i)).toBeVisible({
    timeout: 10_000,
  });
});

// ─── T11: Dierenarts bezoek registreren ───

test("T11: dierenarts bezoek registreren @p1 @medical", async ({ page }) => {
  // Create a dog via intake
  const animal = await createDogViaIntake(page);
  await navigateToDetail(page, animal.name);

  // Expand "Medische fiche" collapsible section
  await expandMedischeFiche(page);

  // Find vet visit section and open form
  await page
    .getByRole("button", { name: /nieuw bezoek/i })
    .click();

  // Fill VetVisitForm
  const today = new Date().toISOString().split("T")[0];
  await page.locator('input[name="date"]').fill(today);
  await page.locator('select[name="location"]').selectOption("in_asiel");
  await page.locator('textarea[name="complaints"]').fill("Lichte hoest");

  // Submit
  await page
    .getByRole("button", { name: /bezoek registreren/i })
    .click();

  // Verify success
  await expect(page.getByText(/bezoek geregistreerd/i)).toBeVisible({
    timeout: 10_000,
  });
});
