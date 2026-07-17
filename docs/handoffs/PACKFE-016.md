# PACKFE-016 — Shared test fixtures & mock helpers

## Context

From the 2026-07-17 tech-debt pass
(`docs/handoffs/tech-debt-2026-07-17-findings.md`): three duplicated
mock patterns across the existing auth test suite, one already visibly
drifted (different `name`/`avatarUrl` values across copies of the same
mock `UserProfile`). Flagged priority — pick up before `PACKFE-004`, so
future feature test suites don't copy-paste the same patterns further.

This is a pure refactor: no test assertions, coverage, or behavior
change. Every existing test must still pass, asserting exactly what it
already asserts — only _how each test sets up its mocks_ changes.

**Design gate**: no dedicated ADR — matches the precedent set by
`PACK-032`/`PACKFE-001`/`PACKFE-002`/`PACKFE-003` for comparably-scoped
internal conventions. Documented here instead.

Key decisions from the interview (2026-07-17):

- **New shared location**: `src/test/fixtures.ts`, a new top-level
  folder parallel to `api/`, `app/`, `components/`, `features/`, `lib/`
  — not nested inside any single feature/layer, since fixtures used
  across features shouldn't belong to one of them.
- **`api/client`'s mock uses Vitest's `__mocks__` folder convention**,
  verified working in this project's exact config before deciding on it
  (not assumed): `src/api/__mocks__/client.ts` exports `apiGet`/
  `apiPost` as `vi.fn()` and re-exports the real `ApiError`. Consuming
  test files call the bare `vi.mock("../api/client")` — no factory body
  to write or copy-paste at all, not just a shorter one.
- **`AuthContext`'s `useAuth` mock gets the same treatment**:
  `src/app/__mocks__/AuthContext.tsx` exports both `useAuth` (calling
  the mock) and `mockUseAuth` (the `vi.fn()` itself) so consuming tests
  can still do `mockUseAuth.mockReturnValue({...})` per test case —
  centralizes _where_ the mock is defined without losing the per-test
  dynamic reconfiguration `ProtectedRoute.test.tsx` and
  `CallbackScreen.test.tsx` already rely on.
- **`UserProfile` fixture is a factory, not a static object**:
  `createMockUserProfile(overrides?: Partial<UserProfile>)` — returns a
  fresh object each call (no shared-reference mutation risk across
  tests) and lets a test needing a specific value override just that
  field, which is the flexibility the current drifted copies were
  reaching for without coordinating on it.
- **Mock reset logic stays per-file**, not centralized in
  `setupTests.ts` — considered, but a global reset would risk touching
  files that don't mock `client.ts`/`AuthContext` at all (calling
  `.mockReset()` on something that was never actually mocked in that
  file). Out of scope for what the three findings actually asked for.

## Acceptance criteria

- [ ] `src/test/fixtures.ts`: `createMockUserProfile(overrides?)`,
      defaults matching the current `AuthContext.test.tsx` values
      (`id: "1"`, `email: "sam@example.com"`, `name: "Sam Rivera"`,
      `avatarUrl: "https://example.com/avatar.png"`).
- [ ] `src/api/__mocks__/client.ts`: `apiGet`/`apiPost` as `vi.fn()`,
      `ApiError` re-exported from the real module.
- [ ] `src/app/__mocks__/AuthContext.tsx`: `mockUseAuth` (`vi.fn()`)
      and `useAuth` (calling it) both exported.
- [ ] `src/App.test.tsx` refactored to use the bare `vi.mock("./api/client")`
      and `createMockUserProfile()` — same assertion, same behavior.
- [ ] `src/app/AuthContext.test.tsx` refactored the same way (bare
      `vi.mock("../api/client")`, `createMockUserProfile()`).
- [ ] `src/app/ProtectedRoute.test.tsx` refactored to use the bare
      `vi.mock("./AuthContext")` + imported `mockUseAuth`, and
      `createMockUserProfile()` for its one inline user object.
- [ ] `src/features/auth/CallbackScreen.test.tsx` refactored the same
      way (bare `vi.mock("../../app/AuthContext")` + `mockUseAuth`).
- [ ] Every existing test in all four files still passes, asserting
      exactly what it already asserted.

## Non-goals

- No new test coverage, no new assertions, no behavior change anywhere
  — pure setup/mock deduplication.
- `renderProtected()`/`renderCallback()` router-wrapping helpers — the
  tech-debt pass explicitly watched, not flagged, this (only two
  instances, per this project's "three similar lines beats a premature
  abstraction" convention). Not touched here.
- The two Playwright specs (`smoke.spec.ts`,
  `auth-unauthenticated.spec.ts`) — the tech-debt pass didn't flag
  these as duplicated, not touched here.
- Centralizing mock-reset (`mockReset`/`clearAllMocks`) logic in
  `setupTests.ts` — considered and declined; see "Design gate" above.
- Any change to `client.ts`, `AuthContext.tsx`, or any other real
  (non-test, non-mock) source file.

## Expected test files

No new test files — this ticket _is_ the refactor of the four existing
ones listed in the ACs above. Manual verification: run the full suite
(`npm run test`) before and after, diff the test-name list (same
technique `packing-list-go`'s `PACK-019`/`PACK-020` used for a
comparable mechanical retrofit) to confirm nothing was silently dropped
or renamed, not just that the pass count matches.

## Close-out

Completed 2026-07-17. Retro entry in LESSONS.md.
