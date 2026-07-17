# Lessons

Running retro log, appended at the close of every ticket (`close-out`
skill) and reviewed at the start of every `grill-me` and project kickoff.

## 2026-07-17 — PACKFE-001 — Foundations shipped; surfaced a real test-coverage gap on its own first component

- No rework on the four commits (core wiring, design tokens, UI
  primitives, app shell) — each went green first pass. But `Modal`
  changed shape mid-ticket (static div → native `<dialog>`, per your
  suggestion) and picked up real behavior (a `useEffect` driving
  `showModal()`/`close()`); the original "presentation-only, no test
  needed" call predated that change and was never re-checked against it.
- **Pattern**: when a component's design changes mid-implementation such
  that it gains real behavior, re-check whether the tests-first
  presentation-only carve-out still applies — don't let a classification
  made before the change silently carry over. Flagged as a candidate for
  the global file (see below).
- Checking just now: `jsdom` doesn't implement `<dialog>.showModal()` at
  all (throws `not a function`) — Vitest can't exercise `Modal`'s
  open/close behavior even retroactively; only Playwright (real browser)
  can. Worth knowing before assuming Vitest coverage is always available
  for a given component.
- Added this ticket, not originally scoped: Prettier + import sorting +
  a Husky/lint-staged pre-commit hook (verified working directly, not
  just configured) and oxlint's `jsx-a11y` plugin, which immediately
  required fixing a real false-positive in `Modal.tsx`. See project
  `CLAUDE.md` for the resulting conventions.
- Open gap, not resolved: the pre-commit hook only runs lint/format, not
  the test suites, and there's no CI — nothing currently enforces tests
  actually get run before a commit.
