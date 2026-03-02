# E2E Tests — Dierenasiel Ninove

End-to-end tests met [Playwright](https://playwright.dev/) voor het dierenasiel-ninove platform.

## Setup

```bash
# Installeer dependencies (als dat nog niet gedaan is)
npm install

# Installeer Playwright browsers
npx playwright install chromium
```

## Tests draaien

```bash
# Alle E2E tests (headless)
npm run test:e2e

# Met Playwright UI (visueel debuggen)
npm run test:e2e:ui

# Met zichtbare browser
npm run test:e2e:headed
```

De dev server (`npm run dev`) wordt automatisch gestart via `webServer` in `playwright.config.ts`.

## Architectuur

```
tests/
├── e2e/                        ← Test specs
│   └── animal-intake.spec.ts   ← Dier intake flow
├── support/
│   ├── .auth/                  ← Opgeslagen auth state (gitignored)
│   ├── fixtures/
│   │   └── auth.setup.ts       ← Login setup (draait voor alle tests)
│   ├── helpers/
│   │   └── test-data.ts        ← Data factories en test users
│   └── page-objects/           ← Page Object Model (optioneel)
└── README.md
```

### Auth Setup

De `auth.setup.ts` fixture logt in als beheerder en slaat de sessie op in `.auth/beheerder.json`. Alle tests in het `chromium` project hergebruiken deze sessie — geen login per test nodig.

### Data Factories

`test-data.ts` bevat factory functies die unieke testdata genereren per run:
- `createAnimalData()` — genereert een uniek hondenrecord
- `createCatData()` — genereert een uniek kattenrecord
- `TEST_USERS` — vaste test-accounts uit de seed data

### Selectors

Gebruik bij voorkeur:
1. `getByRole()` — toegankelijke selectors (heading, button, link, textbox)
2. `getByLabel()` — formuliervelden via label tekst
3. `locator('select[name="..."]')` — select dropdowns via name attribuut
4. `getByText()` — zichtbare tekst op de pagina

Vermijd: CSS class selectors, XPath, fragiele DOM-paden.

## Best Practices

- **Isolatie**: Elke test moet onafhankelijk draaien. Gebruik factories voor unieke data.
- **Given/When/Then**: Structureer tests met duidelijke stappen.
- **Geen hard-coded waits**: Gebruik `expect().toBeVisible()` of `waitFor()` i.p.v. `sleep()`.
- **Cleanup**: Tests ruimen hun eigen data niet op (database wordt geseeded). Gebruik unieke namen om conflicten te voorkomen.

## CI Integratie

In `playwright.config.ts`:
- CI mode: `workers: 1`, `retries: 2`
- Artifacts: trace, screenshot, video bij failures
- Reporter: HTML + JUnit XML (voor CI dashboards)

```yaml
# GitHub Actions voorbeeld
- name: Run E2E tests
  run: npm run test:e2e
  env:
    BASE_URL: http://localhost:3000
```
