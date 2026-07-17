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

## 2026-07-17 — PACKFE-003 — Auth shipped clean; closes Epic 2; three live process changes

- No rework on the final implementation (21/21 Vitest, 2/2 Playwright,
  real Google login manually verified) — but real design iteration got
  there: the restore mechanism was correctly unified after being pushed
  on directly, and the Playwright happy-path AC was dropped entirely
  after an explicit cost/benefit conversation (a dev-only auth-bypass
  endpoint needed to seed a session was judged disproportionate security
  surface for a personal app — reversing my own earlier recommendation,
  not the user catching an error).
- **A real blind spot, caught by the user, not me**: responsive/mobile
  strategy was never decided anywhere, despite an explicit "any huge
  issues" review of this project earlier. It's the identical shape of
  mistake as the tooling-baseline gap from `PACKFE-001` — a cross-cutting
  concern deferred to one big end-of-backlog ticket instead of decided
  early. Resolved with real design-data verification (decoded both
  design files again, confirmed genuinely different container widths)
  and ADR 007, applied immediately rather than just documented for
  later.
- Two regressions in `PACKFE-001`'s own tests, and one testing-
  infrastructure bug (`@testing-library/react`'s auto-cleanup silently
  never registering, fixed once at the shared `setupTests.ts` level) —
  the auto-cleanup gap is another instance of the already-covered
  simulator-capability-gap pattern, not a new one.
- **Three process changes promoted live this ticket** (not waiting for
  this close-out, per the two-speed rule): (1) generalized the
  `PACKFE-001` tooling-baseline global rule to cover cross-cutting
  frontend concerns broadly, since responsive strategy is the second
  occurrence of the identical mistake; (2) new global rule — don't add
  standing production surface purely to make a test automatable, weigh
  it against what's already covered first; (3) the handoff doc now gets
  its own stop-and-confirm checkpoint, separate from the tests-first one
  — requested directly, since rolling straight from doc to tests left no
  room to review/commit the doc on its own.
- **Epic 2 demotion check**: Epic 2 was one ticket (`PACKFE-003`) touching
  no prior-epic global rules directly. Nothing to compress.

## 2026-07-17 — Tech-debt pass — first run, test-suite duplication found early

First pass for this project, whole codebase (nothing to diff against —
no prior entry). Scoped to test-suite duplication specifically, per
direct request drawing on a `packing-list-go` precedent (duplication
discovered late was costly to retrofit). Found real, already-drifted
duplication at just 3 tickets in: a mock `UserProfile` object duplicated
with different values across 3 test files, and two verbatim-duplicated
mock-setup blocks (`api/client`, `useAuth`) across 2 files each. Filed as
`PACKFE-016`, flagged priority-before-`PACKFE-004` so it lands before
more feature test suites copy-paste the same patterns further. Findings
archive: `docs/handoffs/tech-debt-2026-07-17-findings.md`.

## 2026-07-17 — PACKFE-016 — Clean mechanical refactor; zero behavior change confirmed by diff

- No rework. All four test files refactored to the new shared
  fixture/mocks; exact before/after test-name diff came back empty.
- One real finding: Vitest's `__mocks__` auto-mock swaps modules at
  runtime, but TypeScript resolves imports to the real file for
  type-checking, which doesn't export mock-only symbols — fixed by
  importing those directly from the `__mocks__` path, then verified
  empirically (not assumed) that it's the same instance at runtime.
  Already covered by the existing simulator-capability-gap global rule —
  no new rule needed.
