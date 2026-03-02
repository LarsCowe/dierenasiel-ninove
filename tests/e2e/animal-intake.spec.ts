import { test, expect } from "@playwright/test";
import { createAnimalData } from "../support/helpers/test-data";

test.describe("Dier intake flow", () => {
  test("registreer een nieuw dier via het intake formulier", async ({ page }) => {
    const animal = createAnimalData();

    // Given: beheerder navigeert naar het dierenoverzicht
    await page.goto("/beheerder/dieren");
    await expect(page.getByRole("heading", { name: /dieren/i })).toBeVisible();

    // When: klik op "Nieuw dier registreren"
    await page.getByRole("link", { name: /registreren|nieuw/i }).click();
    await expect(page).toHaveURL(/\/dieren\/nieuw/);

    // Then: vul het intake formulier in
    await page.getByLabel(/naam/i).first().fill(animal.name);

    // Selecteer soort
    await page.locator('select[name="species"]').selectOption(animal.species);

    // Selecteer geslacht (verschijnt na soort selectie)
    await page.locator('select[name="gender"]').selectOption(animal.gender);

    // Vul optionele velden in
    await page.getByLabel(/ras/i).fill(animal.breed);
    await page.getByLabel(/kleur/i).fill(animal.color);

    // Intake datum (standaard vandaag)
    await page.getByLabel(/intake.*datum/i).fill(animal.intakeDate);

    // Reden binnenkomst
    await page.locator('select[name="intakeReason"]').selectOption(animal.intakeReason);

    // Korte beschrijving
    await page.getByLabel(/korte beschrijving/i).fill(animal.shortDescription);

    // Submit het formulier
    await page.getByRole("button", { name: /registreren|opslaan/i }).click();

    // Verifieer succesmelding
    await expect(page.getByText(/succesvol/i)).toBeVisible({ timeout: 10_000 });
  });

  test("dierenoverzicht toont geregistreerde dieren", async ({ page }) => {
    // Given: navigeer naar dierenoverzicht
    await page.goto("/beheerder/dieren");

    // Then: tabel is zichtbaar met diergegevens
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("dier detail pagina is bereikbaar vanuit overzicht", async ({ page }) => {
    // Given: navigeer naar dierenoverzicht
    await page.goto("/beheerder/dieren");

    // When: klik op eerste dier in de tabel
    await page.locator("tbody tr").first().getByRole("link").first().click();

    // Then: detail pagina opent
    await expect(page).toHaveURL(/\/dieren\/\d+/);
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
