# SAM Windows Project Checkpoint

Saved: 2026-05-12T22:51:37+02:00
Branch: `main`
Working tree before checkpoint: clean

## Current state

The functional hardening phase is paused after completing the schema-backed product surfaces and their minimal real CRUD UI.

Latest local commits:

- `76727aa Add SAM assignments UI CRUD`
- `49f8178 Add SAM contracts UI CRUD`
- `95138db Add SAM budgets UI CRUD`
- `ef52ac5 Integrate SAM product UI export import`
- `0e0d758 Add SAM assignments API`
- `a1899a3 Add SAM budgets API`
- `9eae89c Add SAM contracts API`
- `5bd2e93 Mark unfinished SAM UI actions`
- `63b6950 Harden SAM CRUD validation`
- `da66efa Fix SAM dashboard report charts`
- `3d07d6b Harden SAM API auth boundary`

## Completed slices

### Reports / dashboard charts

- Costs dashboard API now returns structured `{ chartData, months }` payloads.
- Compliance dashboard API now returns structured `{ complianceStats }` payloads.
- Reports time range now maps to explicit `months` requests.
- Dashboard and report consumers tolerate old array and new object payload forms.
- Regression coverage: `npm run test:reports`.

### CRUD validation and FK handling

- Central validation helpers added for numbers, dates and required fields.
- Costs, licenses and software mutation routes return clean `400` validation failures instead of accidental `500`s.
- Software deletion now blocks cleanly when dependent licenses, costs, alerts or assignments exist.
- Regression coverage: `npm run test:crud`.

### Honest UI placeholders

- Fake success messages in settings were removed or disabled.
- Placeholder alerts on software/vendor surfaces were removed or disabled.
- Regression coverage: `npm run test:ui-placeholders`.

### Contracts, budgets and assignments APIs

- Contracts API: collection and item routes with validation.
- Budgets API: collection and item routes with validation; `remainingAmount` is calculated server-side.
- Assignments API: collection and item routes with validation; `userId` is intentionally a plain string.
- Mutations are auth-protected; read endpoints remain public for now, matching the current app pattern.
- Regression coverage:
  - `npm run test:contracts`
  - `npm run test:budgets`
  - `npm run test:assignments`

### Product UI and import/export

- New dashboard routes and sidebar entries:
  - `/contracts`
  - `/budgets`
  - `/assignments`
- Import/export now covers contracts, budgets, assignments and users.
- Import uses shared validators where practical and avoids duplicate budget/assignment records.
- Regression coverage:
  - `npm run test:ui-surfaces`
  - `npm run test:import-export`

### Minimal real UI CRUD

- Budgets UI CRUD:
  - Add/edit/delete dialogs.
  - Real `POST`, `PUT`, `DELETE` wiring.
  - No client-side `remainingAmount` submission.
  - Regression coverage: `npm run test:budgets-ui`.

- Contracts UI CRUD:
  - Add/edit/delete dialogs.
  - Real vendor selection via `GET /api/vendors`.
  - Real `POST`, `PUT`, `DELETE` wiring.
  - Regression coverage: `npm run test:contracts-ui`.

- Assignments UI CRUD:
  - Add/edit/delete dialogs.
  - Real software selection via `GET /api/software`.
  - `userId` remains a plain text field, consistent with Prisma/API.
  - Real `POST`, `PUT`, `DELETE` wiring.
  - Regression coverage: `npm run test:assignments-ui`.

## Last full verification

Last successful verification before pause:

```bash
npm run test:deployment
npm run test:seed
npm run test:db
npx tsc --noEmit
npm run build
npm run verify:running
git diff --check
```

`verify:running` currently chains:

```bash
npm run smoke \
  && npm run test:api-auth \
  && npm run test:reports \
  && npm run test:crud \
  && npm run test:ui-placeholders \
  && npm run test:ui-surfaces \
  && npm run test:contracts \
  && npm run test:contracts-ui \
  && npm run test:budgets \
  && npm run test:budgets-ui \
  && npm run test:assignments \
  && npm run test:assignments-ui \
  && npm run test:import-export
```

Last running probes returned:

- `/contracts` → `200`
- `/budgets` → `200`
- `/assignments` → `200`

## Review status

Each functional slice was reviewed by Kurt before commit. Final review outcomes were PASS/no blockers for:

- Reports/charts
- CRUD validation
- Placeholder honesty
- Assignments API
- Contracts API
- Budgets API
- Product UI/import-export
- Budgets UI CRUD
- Contracts UI CRUD
- Assignments UI CRUD

Known non-blocking limitation: the new UI CRUD regression tests are source-level surface guards, not full browser form E2E tests. API CRUD tests cover backend behavior.

## Open next steps

Recommended next slice after the pause:

1. Add one real browser/E2E CRUD smoke path, probably Budgets first because it is the simplest.
2. Then repeat the browser smoke pattern for Contracts and Assignments if useful.
3. Revisit security/auth separately:
   - public read endpoints for contracts/budgets/assignments
   - open signup behavior
   - dashboard route protection/session consistency
4. Optional product polish:
   - better assignment `userId` UX if a real user directory is introduced
   - richer import error reporting in settings
   - table-level filters/search for the new product surfaces

## Safety / scope notes

- No secrets or credentials are stored here.
- No push/PR/deployment was performed.
- Git author identity is repo-local: `Marian <marian@local>`.
