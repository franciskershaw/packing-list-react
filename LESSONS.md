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

## 2026-07-17 — PACKFE-002 — API client shipped clean; the user's own pushback beat my first design

- No rework on the final implementation — all 10 tests passed first try
  against the real `authToken.ts`/`client.ts`. But the design got there
  through real back-and-forth, not straight to right: my first
  token-access proposal (a plain module variable) only solved reading
  the token outside React, not React reactively noticing a
  401-triggered clear. Caught by the user directly asking whether
  repeated "we're outside React" friction meant something was off, not
  by me catching it myself — and their own follow-up ("can't React
  Query solve this?") beat my own fix (Zustand): reused the
  already-adopted `QueryClient`, added no new dependency, and didn't
  reopen ADR 004's Zustand rejection. Produced ADR 006 plus addenda to
  ADR 001/004.
- **Pattern**: when a structured question needs re-asking because the
  user needs more context first, drop to plain prose, then re-ask as
  options — worked cleanly twice this ticket, worth defaulting to
  rather than re-presenting the same dense options a second time.
- Third instance (after PACK-030, PACK-032 in `packing-list-go`) of
  verifying an API surface before relying on it: the response-parsing
  helper's first draft assumed `.text()` was available on a fetch
  `Response`; only `.json()` (wrapped in try/catch) is reliable, which
  also matches real `fetch` throwing on an empty body. Already covered
  by existing global rules (precedent-verification + the simulator-
  capability-gap rule from `PACKFE-001`) — no new global rule needed,
  just another confirming instance.
- **Epic 1 demotion check** (first run since the rule requiring this
  trace was added): skimmed the three rules added to
  `~/.claude/CLAUDE.md` during this epic (frontend tooling baseline,
  test-carve-out re-check, simulator-capability-gap) — all already
  principle-plus-citation, none read as incident narrative. Nothing
  compressed.
