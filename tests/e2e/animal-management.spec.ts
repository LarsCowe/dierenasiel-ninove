import { test, expect, Page } from "@playwright/test";
import { createAnimalData } from "../support/helpers/test-data";

/**
 * Dierbeheer E2E tests (T12 + T13 + T15).
 *
 * T12: Gedragsfiche max 3 observaties.
 * T13: Kennel toewijzen.
 * T15: Zoeken en filteren op dierenoverzicht.
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

async function fillBehaviorRecord(page: Page, index: number) {
  const today = new Date().toISOString().split("T")[0];
  await page.locator("#br-date").fill(today);

  // Fill score selects (1-5) for each behavior category — selects use id="br-{key}"
  const scoreFields = [
    "benaderingHok",
    "uitHetHok",
    "wandelingLeiband",
    "reactieAndereHonden",
    "reactieMensen",
    "aanrakingManipulatie",
    "voedselgedrag",
  ];
  for (const field of scoreFields) {
    await page.locator(`#br-${field}`).selectOption(String(Math.min(index + 2, 5)));
  }

  // Optional notes
  await page.locator("#br-notes").fill(`E2E gedragsobservatie ${index + 1}`);

  // Submit
  await page.getByRole("button", { name: /fiche opslaan/i }).click();
  await expect(page.getByText(/gedragsfiche succesvol opgeslagen/i)).toBeVisible({
    timeout: 10_000,
  });
}

// ─── T12: Gedragsfiche max 3 observaties ───

test.describe.serial(
  "Gedragsfiche max 3 observaties @p1 @management",
  () => {
    let detailUrl: string;

    test("T12 setup: hond aanmaken @p1 @management", async ({ page }) => {
      const animal = await createDogViaIntake(page);
      detailUrl = await navigateToDetail(page, animal.name);
    });

    test("T12: drie gedragsfiches invullen en maximum validatie @p1 @management", async ({
      page,
    }) => {
      test.skip(!detailUrl, "Setup moet eerst slagen");
      await page.goto(detailUrl);

      // Open "Gedragsfiches" collapsible section
      await page.getByRole("button", { name: /gedragsfiches/i }).click();

      // Add behavior record 1
      await page.getByRole("button", { name: /nieuwe fiche/i }).click();
      await fillBehaviorRecord(page, 0);

      // Add behavior record 2
      await page.getByRole("button", { name: /nieuwe fiche/i }).click();
      await fillBehaviorRecord(page, 1);

      // Add behavior record 3
      await page.getByRole("button", { name: /nieuwe fiche/i }).click();
      await fillBehaviorRecord(page, 2);

      // Verify: 3/3 fiches ingevuld
      await expect(page.getByText(/3\/3/i)).toBeVisible({ timeout: 10_000 });

      // Verify: add button disabled or max message visible
      const addButton = page.getByRole("button", { name: /nieuwe fiche/i });
      const maxMessage = page.getByText(/maximum.*3.*bereikt/i);

      // Either the button is disabled or the max message is visible
      const isDisabled = await addButton.isDisabled().catch(() => false);
      const maxVisible = await maxMessage.isVisible().catch(() => false);
      expect(isDisabled || maxVisible).toBeTruthy();
    });
  },
);

// ─── T13: Kennel toewijzen ───

test("T13: kennel toewijzen @p1 @management", async ({ page }) => {
  // Create a dog via intake
  const animal = await createDogViaIntake(page);
  await navigateToDetail(page, animal.name);

  // Find kennel selector by its id
  const kennelSelect = page.locator("#kennel-select");
  await expect(kennelSelect).toBeVisible({ timeout: 10_000 });

  // Select first available kennel (skip the placeholder "— Geen kennel —")
  const firstOption = kennelSelect.locator("option:not([value=''])").first();
  const kennelValue = await firstOption.getAttribute("value");
  expect(kennelValue).toBeTruthy();
  await kennelSelect.selectOption(kennelValue!);

  // Verify success: either "Toegewezen aan kennel" or capacity warning "Let op: kennel ... is vol"
  const successMessage = page.getByText(/toegewezen aan kennel/i);
  const capacityWarning = page.getByText(/let op.*kennel.*vol/i);
  const result = await Promise.race([
    successMessage.waitFor({ state: "visible", timeout: 10_000 }).then(() => "assigned"),
    capacityWarning.waitFor({ state: "visible", timeout: 10_000 }).then(() => "capacity"),
  ]);
  expect(["assigned", "capacity"]).toContain(result);
});

// ─── T15: Zoeken en filteren ───

test("T15: zoeken en filteren op dierenoverzicht @p1 @management", async ({
  page,
}) => {
  // Navigate to report page
  await page.goto("/beheerder/rapporten/dierenoverzicht");
  await expect(page).toHaveURL(/\/rapporten\/dierenoverzicht/);

  // Verify table is visible with animal data
  await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("tbody tr").first()).toBeVisible();

  // Filter by species via URL to avoid router.push timing issues
  await page.goto("/beheerder/rapporten/dierenoverzicht?soort=hond");
  await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });

  // Verify species filter is applied (select shows "Hond")
  const soortSelect = page.locator("select").first();
  await expect(soortSelect).toHaveValue("hond");

  // Add status filter via URL
  await page.goto("/beheerder/rapporten/dierenoverzicht?soort=hond&status=beschikbaar");
  await expect(page.getByRole("table")).toBeVisible({ timeout: 10_000 });

  // Click "Filters wissen"
  await page.getByRole("button", { name: /filters wissen/i }).click();

  // Verify filters reset — URL no longer has filter params
  await expect(page).toHaveURL(/\/rapporten\/dierenoverzicht$/, { timeout: 10_000 });
  await expect(page.locator("tbody tr").first()).toBeVisible();
});
