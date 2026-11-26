# Technical Specification – SPP Automation

| | |
| --- | --- |
| **Project** | SPP Automation (Star Partnership – Partner Connect) |
| **Application under test** | https://spp.prm-uat.com (UAT) |
| **Type** | UI end-to-end test automation |
| **Stack** | Playwright Test, TypeScript, Node.js, dotenv |
| **Status** | Base framework with Login and Dashboard coverage (26 tests) |

## 1. Purpose and scope

Provide a maintainable automation framework for the SPP web portal. The base release validates authentication and the post-login dashboard data. Further scenarios will be added from manual test cases supplied by the QA team.

**In scope (current):** sign-in, validation messages, logout, route protection, dashboard header, points summary, star achievements, monthly goals, featured rewards, sidebar navigation links.

**Out of scope (current):** About, My Star Points, Catalogue/Rewards, Cart and redemption flows; API, performance, accessibility and cross-browser testing.

## 2. Technology stack

| Component | Choice | Notes |
| --- | --- | --- |
| Test runner | `@playwright/test` ^1.65 | Built-in assertions, fixtures, tracing, reporters |
| Language | TypeScript ^7 (`strict`) | Compiled on the fly by Playwright; `npm run typecheck` runs `tsc --noEmit` |
| Runtime | Node.js 24 | |
| Config | `dotenv` | Reads `.env` (git-ignored) |
| Browser | Chromium (Desktop Chrome, 1920×1080) | Other browsers can be added as projects |

## 3. Architecture

Page Object Model with custom fixtures and externalised test data.

```
tests (specs)  ──uses──>  fixtures  ──creates──>  page objects  ──drives──>  browser
      │                                                │
      └── test-data (expected values)                   └── utils (parsers)
```

| Layer | Location | Responsibility |
| --- | --- | --- |
| Specs | `tests/<area>/*.spec.ts` | Scenarios and assertions only; no raw selectors |
| Fixtures | `src/fixtures/test-fixtures.ts` | Constructs page objects; `authenticatedDashboard` logs in and waits for the dashboard |
| Page objects | `src/pages/` | Locators and user actions; data readers returning typed values |
| Test data | `src/test-data/` | Expected values (`dashboard.expected.json`) and negative-login data (`login.data.ts`) |
| Utils | `src/utils/parsers.ts` | Parse "25,245", "15,335 HL / 9,970 HL", "Jan 620 HL"; format dates like the app |
| Config | `src/config/env.ts`, `playwright.config.ts` | Typed environment access; runner settings |

### 3.1 Directory layout

```
SPP_AUTOMATION/
├── playwright.config.ts
├── tsconfig.json
├── package.json
├── .env / .env.example / .gitignore
├── README.md
├── TECHNICAL_SPECIFICATION.md
├── src/
│   ├── config/env.ts
│   ├── fixtures/test-fixtures.ts
│   ├── pages/{BasePage,LoginPage,DashboardPage}.ts
│   ├── test-data/{dashboard.expected.json,login.data.ts}
│   └── utils/parsers.ts
└── tests/
    ├── login/login.spec.ts
    └── dashboard/dashboard.spec.ts
```

### 3.2 Page objects

| Class | Key members |
| --- | --- |
| `BasePage` | `goto`, `expectUrlToContain`, `waitForAppIdle`, `textOf` (whitespace-normalised text) |
| `LoginPage` | `open`, `login(email, password)`, `setRememberMe`, `expectValidationMessage` |
| `DashboardPage` | `open`, `waitUntilLoaded`, `logout`, `clickSidebarLink`; readers `getHeaderPoints`, `getCartCount`, `getTierName`, `getStarPoints`, `getExpiringStarPoints`, `getHlProgress`, `getTierTitles`, `getMonthlyGoals`, `getMonthlyGoalCallout`, `getFeaturedRewards` |

### 3.3 Fixtures

| Fixture | Description |
| --- | --- |
| `loginPage` | `LoginPage` bound to the test's page |
| `dashboardPage` | `DashboardPage` bound to the test's page |
| `authenticatedDashboard` | Opens `/signIn`, logs in with `.env` credentials, waits until the dashboard data is rendered |

## 4. Configuration

### 4.1 Environment variables (`.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `BASE_URL` | No (default `https://spp.prm-uat.com`) | Application base URL |
| `SPP_EMAIL` | Yes | UAT user email |
| `SPP_PASSWORD` | Yes | UAT user password |
| `WORKERS` | No (default `1`) | Parallel workers |

Missing required variables raise a clear error at first use. Credentials are never stored in source; `.env` is git-ignored and `.env.example` documents the keys.

### 4.2 Runner settings (`playwright.config.ts`)

| Setting | Value |
| --- | --- |
| Test timeout / expect timeout | 60 s / 10 s |
| Action / navigation timeout | 15 s / 30 s |
| Parallelism | `fullyParallel: false`, `workers` = `WORKERS` or 1 |
| Retries | 1 on CI, 0 locally |
| Reporters | `list` + HTML (`playwright-report/`, not auto-opened) |
| Artifacts | trace, screenshot, video retained on failure only |
| Viewport | 1920×1080 |

**Why serial:** the shared UAT user is signed out when the same account logs in from several sessions at once, causing intermittent failures in parallel runs. Increase `WORKERS` only with one account per worker.

## 5. Application findings (basis for locators)

The portal is an Angular single-page app.

| Area | Observations |
| --- | --- |
| Sign-in (`/signIn`) | Email (placeholder "Enter email"), password, Remember Me (custom checkbox, native input hidden – click the label), Sign in button. Errors render as `.text-danger`: "Email address is required", "Invalid password" |
| Post-login | Redirects to `/dashboard`; unauthenticated access to `/dashboard` redirects to `/signIn` |
| Logout | Icon button `.logout-btn` (top-right) → `/signIn` |
| Sidebar | Star Partnership Home `/dashboard`, About `/about-us`, My Star Points `/mytransaction`, View Rewards `/catalogue` |
| Section containers | `.iq-card` with an `h4.card-title` heading (Star Achievements, Monthly Goals, Featured Rewards) |
| Star points | `.points-value` (1st = Star Points, 2nd = Expiring Star Points) |
| Achievements | `.sa-tier-title`, `.sa-node.achieved`, badge "x HL / y HL" |
| Monthly goals | `.month-item` (`.month-label`, `.month-hl`, `.month-dot.is-achieved/.is-missed`); callout `.milestone-callout-*` |
| Featured rewards | Slick carousel, `.rewards-item`; clones carry `.slick-cloned`; autoplay re-renders slides and rotates order; discounted price is `floor(original × 0.9)` |

## 6. Test coverage

### 6.1 Login (`tests/login/login.spec.ts`) – 9 tests

| # | Test | Tag |
| --- | --- | --- |
| 1 | Login page shows all expected elements | @smoke |
| 2 | Password field is masked | |
| 3 | Valid credentials land on the dashboard | @smoke |
| 4 | Empty form shows required-field message | |
| 5 | Unknown user is rejected ("Invalid password") | |
| 6 | Valid email + wrong password is rejected | |
| 7 | Remember Me can be toggled | |
| 8 | Logout returns to sign-in | |
| 9 | Dashboard not accessible without login | |

### 6.2 Dashboard (`tests/dashboard/dashboard.spec.ts`) – 17 tests

| Group | Tests |
| --- | --- |
| Page layout | Header/banner/welcome content (@smoke); sidebar links and hrefs |
| Star points | Tier name (@smoke); star and expiring points (@smoke); header balance equals dashboard points; "as of" date is today; cart count; View Transactions navigation |
| Star achievements | Tier titles in order; achieved node count; HL progress; View Star Level Benefits navigation |
| Monthly goals | 12 months with expected HL targets (@smoke); status per month (past = achieved/missed, current/future = pending); callout text and remaining HL ≤ current month target |
| Featured rewards | Expected reward names (order-independent); price present and discount maths consistent (< 1 point rounding tolerance) |

## 7. Test data strategy

- **Static expectations** (tier, points, HL, monthly targets, reward names, sidebar) live in `src/test-data/dashboard.expected.json`. They are a snapshot of the UAT user's data and must be refreshed if that data changes (e.g. after a redemption).
- **Dynamic checks** (today's date, current-month status, discount maths, header vs. dashboard points) are computed in the tests so they do not go stale.

## 8. Design decisions and stability measures

| Concern | Approach |
| --- | --- |
| Selector stability | Prefer role/label/placeholder/text locators; use scoped CSS only where the app offers no accessible hook |
| Async rendering | `waitUntilLoaded` waits for banner, tier, points, header balance, rewards and 12 month items before any assertion |
| Autoplay carousel | Rewards read in a single `evaluateAll` DOM pass; `.slick-cloned` slides excluded; order not asserted; carousel interaction not tested (autoplay makes it flaky) |
| Hidden slides | Link text read from DOM rather than role queries, which ignore off-screen slides |
| Custom checkbox | Toggle via label click, assert state on the native input |
| Session conflicts | Serial execution by default |
| Secrets | `.env` only; git-ignored |

## 9. Execution

```powershell
npm install
npx playwright install chromium
copy .env.example .env        # fill in credentials

npm test                       # all tests
npm run test:smoke             # @smoke only
npm run test:login             # login area
npm run test:dashboard         # dashboard area
npm run test:headed            # headed browser
npm run test:ui                # Playwright UI mode
npm run report                 # open HTML report
npm run typecheck              # tsc --noEmit
```

Verified result: two consecutive serial runs, 52/52 passed (~2.5 min per full run).

## 10. Extending the framework

1. Create a page object in `src/pages/` extending `BasePage`; keep all locators and actions there.
2. Add expected data in `src/test-data/`.
3. Add a spec in `tests/<area>/`, importing `test`/`expect` from `src/fixtures/test-fixtures`; register new page objects as fixtures.
4. Use the `authenticatedDashboard` fixture for logged-in flows; tag critical tests `@smoke`.
5. Map each automated test to its manual test case ID in the test title (recommended convention, e.g. `TC_LOGIN_001 – …`).

## 11. Risks and limitations

| Risk | Mitigation / Plan |
| --- | --- |
| Shared UAT user limits parallelism | Request multiple test accounts; then raise `WORKERS` |
| UAT data drift breaks static expectations | Refresh `dashboard.expected.json`; consider API-based data setup later |
| Credentials in a local `.env` | Use CI secret store in pipelines; rotate if shared |
| Only Chromium covered | Add Firefox/WebKit projects when required |
| Login/validation coverage limited to observed messages | Extend from manual test cases (e.g. invalid email format, password-required message) |

## 12. Future enhancements

- Convert manual test cases (About, My Star Points, Catalogue, Cart, redemption).
- Authentication reuse via storage state or API login once per worker, if the app permits.
- CI pipeline (GitHub Actions / Azure DevOps) with HTML report and trace artifacts.
- Cross-browser and responsive (mobile viewport) projects.
- Test-case ID traceability and tagging (`@regression`, `@smoke`).
