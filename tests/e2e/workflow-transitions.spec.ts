import { test, expect } from "@playwright/test";
import {
  createAnimalData,
  createCatData,
} from "../support/helpers/test-data";

/**
 * Workflow fase-overgangen E2E tests.
 *
 * Deze tests gebruiken test.describe.serial() omdat workflow-overgangen
 * sequentieel zijn: elke fase bouwt voort op de vorige.
 *
 * Guard configuratie (uit src/lib/workflow/guards.ts):
 * - medisch→verblijf: identificationGuard (alle dieren)
 * - verblijf→adoptie: CAT_OUTGOING_GUARDS (alleen katten: chip+vacc+sterilisatie)
 * - adoptie→afgerond: adoptionContractGuard
 *
 * Selector strategie:
 * - Fase-knoppen worden gescoped naar nav[aria-label*="Workflow stappen"]
 *   om conflicten met CollapsibleSection knoppen (bv. "Medische fiche") te vermijden.
 * - Na elke transitie wachten we op een POSITIEVE bevestiging (volgende fase
 *   wordt actief) ipv negatieve check op "Volgende fase" knop (die race condition
 *   heeft omdat knoptekst naar "Bezig..." verandert).
 */

test.describe.serial(
  "Hond workflow: complete cycle @p0 @workflow",
  () => {
    let detailUrl: string;

    test("T04: hond registreren en fase-overgangen tot medisch @p0", async ({
      page,
    }) => {
      const animal = createAnimalData();

      // === STAP 1: Dier aanmaken via intake formulier ===
      await page.goto("/beheerder/dieren/nieuw");
      await page.getByLabel(/naam/i).first().fill(animal.name);
      await page.locator('select[name="species"]').selectOption("hond");
      await page.locator('select[name="gender"]').selectOption("reu");
      await page.getByLabel(/ras/i).fill(animal.breed);
      await page.getByLabel(/kleur/i).fill(animal.color);
      await page.getByLabel(/intake.*datum/i).fill(animal.intakeDate);
      await page
        .locator('select[name="intakeReason"]')
        .selectOption("afstand");
      await page
        .getByLabel(/korte beschrijving/i)
        .fill(animal.shortDescription);
      await page.getByRole("button", { name: /registreren/i }).click();
      await expect(page.getByText(/succesvol/i)).toBeVisible({
        timeout: 10_000,
      });

      // === STAP 2: Navigeer naar detail pagina ===
      await page.goto(`/beheerder/dieren?zoek=${encodeURIComponent(animal.name)}`);
      const animalLink = page.locator("a", { hasText: animal.name });
      await animalLink.waitFor({ state: "visible", timeout: 10_000 });
      const href = await animalLink.getAttribute("href");
      expect(href).toBeTruthy();
      await page.goto(href!);
      await expect(page).toHaveURL(/\/dieren\/\d+/, { timeout: 15_000 });
      detailUrl = page.url();

      // Scope alle fase-knoppen naar de workflow stappenbalk
      const nav = page.locator('nav[aria-label*="Workflow stappen"]');
      await expect(nav).toBeVisible();

      // === STAP 3: Transitie intake → registratie ===
      await nav.getByRole("button", { name: /intake.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();
      await expect(
        nav.getByRole("button", { name: /registratie.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });

      // === STAP 4: Transitie registratie → medisch ===
      await nav.getByRole("button", { name: /registratie.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();
      await expect(
        nav.getByRole("button", { name: /medisch.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });
    });

    test("T05: workflow medisch → verblijf → adoptie → afgerond @p0", async ({
      page,
    }) => {
      test.skip(!detailUrl, "T04 moet eerst slagen");
      await page.goto(detailUrl);

      const nav = page.locator('nav[aria-label*="Workflow stappen"]');
      await expect(nav).toBeVisible();

      // === Transitie medisch → verblijf (identificationGuard triggert) ===
      await nav.getByRole("button", { name: /medisch.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();

      // Guard triggert — override vereist
      await expect(page.locator("#override-reason")).toBeVisible({
        timeout: 10_000,
      });
      await page
        .locator("#override-reason")
        .fill("Chip wordt later geregistreerd (E2E test)");
      await page
        .getByRole("button", { name: /override en doorgaan/i })
        .click();
      await expect(
        nav.getByRole("button", { name: /verblijf.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });

      // === Transitie verblijf → adoptie (geen guard voor hond) ===
      await nav.getByRole("button", { name: /verblijf.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();
      await expect(
        nav.getByRole("button", { name: /adoptie.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });

      // === Transitie adoptie → afgerond (adoptionContractGuard triggert) ===
      await nav.getByRole("button", { name: /adoptie.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();

      // Guard triggert — override vereist
      await expect(page.locator("#override-reason")).toBeVisible({
        timeout: 10_000,
      });
      await page
        .locator("#override-reason")
        .fill("Contract wordt later aangemaakt (E2E test)");
      await page
        .getByRole("button", { name: /override en doorgaan/i })
        .click();
      await expect(
        nav.getByRole("button", { name: /afgerond.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });
    });
  },
);

test.describe.serial(
  "Kat workflow guards: adoptie geblokkeerd + override @p0 @workflow",
  () => {
    let catDetailUrl: string;

    test("kat aanmaken en naar verblijf fase brengen @p0", async ({
      page,
    }) => {
      const cat = createCatData();

      // === STAP 1: Kat aanmaken via intake formulier ===
      await page.goto("/beheerder/dieren/nieuw");
      await page.getByLabel(/naam/i).first().fill(cat.name);
      await page.locator('select[name="species"]').selectOption("kat");
      await page.locator('select[name="gender"]').selectOption(cat.gender);
      await page.getByLabel(/ras/i).fill(cat.breed);
      await page.getByLabel(/kleur/i).fill(cat.color);
      await page.getByLabel(/intake.*datum/i).fill(cat.intakeDate);
      await page
        .locator('select[name="intakeReason"]')
        .selectOption(cat.intakeReason);
      await page.getByLabel(/korte beschrijving/i).fill(cat.shortDescription);
      await page.getByRole("button", { name: /registreren/i }).click();
      await expect(page.getByText(/succesvol/i)).toBeVisible({
        timeout: 10_000,
      });

      // === STAP 2: Navigeer naar detail pagina ===
      await page.goto(`/beheerder/dieren?zoek=${encodeURIComponent(cat.name)}`);
      const catLink = page.locator("a", { hasText: cat.name });
      await catLink.waitFor({ state: "visible", timeout: 10_000 });
      const catHref = await catLink.getAttribute("href");
      expect(catHref).toBeTruthy();
      await page.goto(catHref!);
      await expect(page).toHaveURL(/\/dieren\/\d+/, { timeout: 15_000 });
      catDetailUrl = page.url();

      const nav = page.locator('nav[aria-label*="Workflow stappen"]');
      await expect(nav).toBeVisible();

      // === STAP 3: Transitie intake → registratie ===
      await nav.getByRole("button", { name: /intake.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();
      await expect(
        nav.getByRole("button", { name: /registratie.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });

      // === STAP 4: Transitie registratie → medisch ===
      await nav.getByRole("button", { name: /registratie.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();
      await expect(
        nav.getByRole("button", { name: /medisch.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });

      // === STAP 5: Transitie medisch → verblijf (identificationGuard) ===
      await nav.getByRole("button", { name: /medisch.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();

      // Guard triggert — override
      await expect(page.locator("#override-reason")).toBeVisible({
        timeout: 10_000,
      });
      await page
        .locator("#override-reason")
        .fill("Chip wordt later geplaatst (E2E test)");
      await page
        .getByRole("button", { name: /override en doorgaan/i })
        .click();
      await expect(
        nav.getByRole("button", { name: /verblijf.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });

      // Kat is nu in "verblijf" fase — klaar voor T06/T07
    });

    test("T06: guard blokkeert kat adoptie zonder chip+vacc+sterilisatie @p0", async ({
      page,
    }) => {
      test.skip(!catDetailUrl, "Setup test moet eerst slagen");
      await page.goto(catDetailUrl);

      const nav = page.locator('nav[aria-label*="Workflow stappen"]');
      await expect(nav).toBeVisible();

      // When: probeer verblijf → adoptie
      await nav.getByRole("button", { name: /verblijf.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();

      // Then: guard blokkeert — waarschuwingen zichtbaar
      await expect(
        page.getByText(/chip|vaccinatie|sterilisatie/i),
      ).toBeVisible({ timeout: 10_000 });

      // Override-reden veld verschijnt
      await expect(page.locator("#override-reason")).toBeVisible();

      // Annuleer (niet doorgaan met override)
      await page.getByRole("button", { name: /annuleren/i }).click();
    });

    test("T07: guard override met reden laat transitie toe @p0", async ({
      page,
    }) => {
      test.skip(!catDetailUrl, "T06 moet eerst slagen");
      await page.goto(catDetailUrl);

      const nav = page.locator('nav[aria-label*="Workflow stappen"]');
      await expect(nav).toBeVisible();

      // When: probeer verblijf → adoptie opnieuw
      await nav.getByRole("button", { name: /verblijf.*actieve/i }).click();
      await page.getByRole("button", { name: /volgende fase/i }).click();

      // Guard triggert weer
      await expect(page.locator("#override-reason")).toBeVisible({
        timeout: 10_000,
      });

      // Vul override reden in
      await page
        .locator("#override-reason")
        .fill(
          "Sterilisatie gepland volgende week, chip wordt binnenkort geplaatst",
        );

      // Klik override knop
      await page
        .getByRole("button", { name: /override en doorgaan/i })
        .click();

      // Then: transitie slaagt — adoptie fase wordt actief
      await expect(
        nav.getByRole("button", { name: /adoptie.*actieve/i }),
      ).toBeVisible({ timeout: 15_000 });
    });
  },
);
