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
