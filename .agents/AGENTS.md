# Git Permissions Rule

- **Do NOT perform git commits, staging, or other git-modifying operations automatically.**
- Always present the changes and ask the user for explicit permission/confirmation before executing any `git commit`, `git add`, `git push`, or related git commands.

# Test File Location Standard

- **All unit test files must be located inside the `pages/__tests__/` directory within each feature module (`src/features/<feature_name>/pages/__tests__/`).**
- Do NOT place unit test files inside `components/__tests__/` or outside of `pages/__tests__/`.

# No Emojis Rule

- **Do NOT use emojis anywhere in generated code, titles, log messages, notifications, UI text, or responses.**

# Test Failure Handling Rule

- **When a test fails, do NOT alter, weaken, skip, or delete the test to make it pass.**
- Genuinely investigate the root cause: check whether the implementation is broken, whether the test's expectations are actually correct, and whether everything being tested behaves as intended.
- Only change a test if it is proven to be genuinely wrong (bad assertion, wrong setup, outdated expectation) — never simply to bypass a failure.
- Fix the underlying problem in the code being tested rather than adjusting the test to match broken behavior.

# Navigation Contract

Four layers have to agree about what a role can reach. They are edited at different
times by different people, and when they drift a user is told to open a page their
menu does not show.

| Layer | File | Role |
|---|---|---|
| Router | `src/app/router/routes.tsx` | `RoleRoute` gates - the real access decision |
| Menu | `src/lib/roles.ts` (`HOSPITAL_NAV`) | what is declared |
| Sidebar | `src/app/layout/navGroups.ts` | how the menu is arranged into sections |
| Assistant | backend `report-service` content pack | names screens to staff in chat answers |

Rules when touching any of them:

- **Adding a page:** add the route, add a `HOSPITAL_NAV` entry, put it in a group in
  `navGroups.ts`, then run `npm run nav:manifest` and commit `nav-manifest.json`.
- **`HOSPITAL_NAV` roles must be a subset of the route's `RoleRoute` roles.** Offering
  a menu item that redirects to `/unauthorized` is a bug, not a permission.
- **Never drop a permitted item in `navGroups.ts`.** Unclaimed items fall into the
  `More` group so nothing is invisible in production; `navContract.test.tsx` fails so
  you still file it properly.
- **`nav-manifest.json` is generated, not hand-edited.** It is how report-service
  checks that every screen the assistant names is one the asking role can see.

Guarded by `src/app/layout/__tests__/navContract.test.tsx`,
`src/lib/__tests__/navManifest.test.ts`, and report-service's
`tests/unit/test_assistant_content_locations.py`.

**Exception to the Test File Location Standard:** these two are cross-cutting contract
tests, not feature unit tests, so they sit beside the code they pin rather than in a
feature's `pages/__tests__/`. Feature tests still follow the standard.
