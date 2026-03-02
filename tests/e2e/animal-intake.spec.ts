import { test, expect } from "@playwright/test";
import {
  createAnimalData,
  createCatData,
} from "../support/helpers/test-data";

test.describe("Dier intake flow @p0 @intake", () => {
  test("T01: registreer een nieuwe hond via het intake formulier @p0", async ({
    page,
  }) => {
    const animal = createAnimalData();

    // Given: beheerder navigeert naar het intake formulier
    await page.goto("/beheerder/dieren");
    await expect(
      page.getByRole("heading", { name: /dieren/i }),
    ).toBeVisible();

    // When: klik op "Nieuw dier registreren"
    await page.getByRole("link", { name: /registreren|nieuw/i }).click();
    await expect(page).toHaveURL(/\/dieren\/nieuw/);

    // Then: vul het intake formulier in
    await page.getByLabel(/naam/i).first().fill(animal.name);
    await page.locator('select[name="species"]').selectOption(animal.species);
    await page.locator('select[name="gender"]').selectOption(animal.gender);
    await page.getByLabel(/ras/i).fill(animal.breed);
    await page.getByLabel(/kleur/i).fill(animal.color);
    await page.getByLabel(/intake.*datum/i).fill(animal.intakeDate);
    await page
      .locator('select[name="intakeReason"]')
      .selectOption(animal.intakeReason);
    await page.getByLabel(/korte beschrijving/i).fill(animal.shortDescription);

    // Submit
    await page
      .getByRole("button", { name: /registreren|opslaan/i })
      .click();

    // Verifieer succesmelding
    await expect(page.getByText(/succesvol/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("T02: kat intake met correcte geslachtsopties @p0", async ({
    page,
  }) => {
    const cat = createCatData();

    // Given: beheerder opent intake formulier
    await page.goto("/beheerder/dieren/nieuw");

    // When: selecteer soort = kat
    await page.getByLabel(/naam/i).first().fill(cat.name);
    await page.locator('select[name="species"]').selectOption("kat");

    // Then: geslachtsopties zijn kat-specifiek (kater/poes)
    const genderSelect = page.locator('select[name="gender"]');
    await expect(
      genderSelect.locator('option[value="kater"]'),
    ).toBeAttached();
    await expect(genderSelect.locator('option[value="poes"]')).toBeAttached();

    // Selecteer geslacht en vul overige velden in
    await genderSelect.selectOption(cat.gender);
    await page.getByLabel(/ras/i).fill(cat.breed);
    await page.getByLabel(/kleur/i).fill(cat.color);
    await page.getByLabel(/intake.*datum/i).fill(cat.intakeDate);
    await page
      .locator('select[name="intakeReason"]')
      .selectOption(cat.intakeReason);
    await page.getByLabel(/korte beschrijving/i).fill(cat.shortDescription);

    // Submit
    await page.getByRole("button", { name: /registreren/i }).click();

    // Verifieer succesmelding
    await expect(page.getByText(/succesvol/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("T03: IBN intake met 60-dagen deadline @p0", async ({ page }) => {
    const animal = createAnimalData({ intakeReason: "ibn" });

    // Given: beheerder opent intake formulier
    await page.goto("/beheerder/dieren/nieuw");

    // When: vul IBN intake in
    await page.getByLabel(/naam/i).first().fill(animal.name);
    await page.locator('select[name="species"]').selectOption(animal.species);
    await page.locator('select[name="gender"]').selectOption(animal.gender);
    await page.getByLabel(/ras/i).fill(animal.breed);
    await page.getByLabel(/intake.*datum/i).fill(animal.intakeDate);
    await page.locator('select[name="intakeReason"]').selectOption("ibn");

    // IBN-specifieke velden verschijnen
    await expect(page.locator('input[name="dossierNr"]')).toBeVisible();
    await page.locator('input[name="dossierNr"]').fill("DWV-2026-E2E-001");
    await page.locator('input[name="pvNr"]').fill("PV-2026-E2E-001");

    await page.getByLabel(/korte beschrijving/i).fill(animal.shortDescription);

    // Submit
    await page.getByRole("button", { name: /registreren/i }).click();
    await expect(page.getByText(/succesvol/i)).toBeVisible({
      timeout: 10_000,
    });

    // Then: navigeer naar detail pagina en verifieer IBN sectie
    await page.goto(`/beheerder/dieren?zoek=${encodeURIComponent(animal.name)}`);
    const ibnLink = page.locator("a", { hasText: animal.name });
    await ibnLink.waitFor({ state: "visible", timeout: 10_000 });
    const ibnHref = await ibnLink.getAttribute("href");
    expect(ibnHref).toBeTruthy();
    await page.goto(ibnHref!);
    await expect(page).toHaveURL(/\/dieren\/\d+/, { timeout: 15_000 });

    // IBN sectie is zichtbaar
    await expect(page.getByText(/inbeslagname/i)).toBeVisible();
    await expect(page.getByText("DWV-2026-E2E-001")).toBeVisible();

    // 60-dagen deadline is zichtbaar
    await expect(page.getByText(/beslissingsdeadline/i)).toBeVisible();
  });

  test("dierenoverzicht toont geregistreerde dieren @p0", async ({
    page,
  }) => {
    // Given: navigeer naar dierenoverzicht
    await page.goto("/beheerder/dieren");

    // Then: tabel is zichtbaar met diergegevens
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.locator("tbody tr").first()).toBeVisible();
  });

  test("dier detail pagina is bereikbaar vanuit overzicht @p0", async ({
    page,
  }) => {
    // Given: navigeer naar dierenoverzicht
    await page.goto("/beheerder/dieren");

    // When: klik op eerste dier in de tabel
    const firstAnimalLink = page.locator("tbody tr").first().locator("a").first();
    await firstAnimalLink.waitFor({ state: "visible" });
    await firstAnimalLink.click();

    // Then: detail pagina opent
    await expect(page).toHaveURL(/\/dieren\/\d+/, { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: /bewerken/i }),
    ).toBeVisible();
  });
});
