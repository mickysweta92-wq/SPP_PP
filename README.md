# SPP Automation

Playwright + TypeScript UI automation framework for **Star Partnership – Partner Connect** (`https://spp.prm-uat.com`).

## Setup

```powershell
npm install
npx playwright install chromium
copy .env.example .env      # then fill in BASE_URL / SPP_EMAIL / SPP_PASSWORD
```

## Run

| Command | Purpose |
| --- | --- |
| `npm test` | all tests (headless) |
| `npm run test:smoke` | tests tagged `@smoke` |
| `npm run test:login` / `test:dashboard` | one area |
| `npm run test:headed` / `test:ui` | headed / Playwright UI mode |
| `npm run report` | open the last HTML report |
| `npm run typecheck` | TypeScript check |

Tests run serially by default because the shared UAT user is signed out when logged in from several sessions at once. Set `WORKERS=n` only when each worker has its own account.

## Structure

```
playwright.config.ts          config (baseURL from .env, traces/screenshots/video on failure)
src/
  config/env.ts               typed access to .env values
  pages/                      Page Objects: BasePage, LoginPage, DashboardPage
  fixtures/test-fixtures.ts   loginPage, dashboardPage, authenticatedDashboard fixtures
  test-data/                  expected data (dashboard.expected.json, login.data.ts)
  utils/parsers.ts            number / HL / date parsing helpers
tests/
  login/login.spec.ts         login, validation, logout, route protection
  dashboard/dashboard.spec.ts points, tier, achievements, monthly goals, featured rewards
```

## Adding new scenarios

1. Add a page object in `src/pages/` (extend `BasePage`), keep locators there.
2. Add expected data in `src/test-data/`.
3. Add a spec under `tests/<area>/`, importing `test`/`expect` from `src/fixtures/test-fixtures` and using the `authenticatedDashboard` fixture for logged-in flows.
4. Tag critical tests with `@smoke`.

## Notes

- Expected dashboard values in `src/test-data/dashboard.expected.json` are a snapshot of the UAT user's data (`SPP_EMAIL`). Update them if the UAT data changes (e.g. after a redemption).
- The Featured Rewards carousel autoplays, so reward order is not asserted and data is read in a single DOM pass.
- `.env` is git-ignored; never commit credentials.
