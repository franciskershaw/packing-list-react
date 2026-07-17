# Tech-debt pass — 2026-07-17

First pass for this project (no prior entry in `LESSONS.md`, no existing
findings archive) — whole codebase in scope by default, though at 3
tickets shipped there isn't much codebase yet. Scoped per direct request
to test-suite duplication specifically, ahead of more feature tickets
(Library, Templates, Trips, Profile) adding their own test suites on top
of the same copy-pasted patterns. The production-readiness/NFR half of
the usual two-part pass was explicitly out of scope this time (backend-
shaped concerns largely inapplicable to a frontend project this early,
and the NFR section's actual commitments — session lifecycle, deployment
target — don't show drift yet with this little built).

All 8 test files read together: `src/App.test.tsx`,
`src/api/authToken.test.ts`, `src/api/client.test.ts`,
`src/app/AuthContext.test.tsx`, `src/app/ProtectedRoute.test.tsx`,
`src/features/auth/CallbackScreen.test.tsx`, `e2e/smoke.spec.ts`,
`e2e/auth-unauthenticated.spec.ts`.

## Findings

**1. Mock `UserProfile` objects duplicated and already drifted.**
`AuthContext.test.tsx` (`testUser`), `App.test.tsx` (inline), and
`ProtectedRoute.test.tsx` (inline) each define their own mock user
object with the same shape (`id`, `email`, `name`, `avatarUrl`) but
different values — `name: "Sam Rivera"` vs. `"Sam"`, a real-looking
`avatarUrl` vs. `""`. Not just duplicated, already drifting, three
tickets in. A shared fixture removes both problems at once.

**2. The `api/client` mock factory is duplicated verbatim.**
`App.test.tsx` and `AuthContext.test.tsx` both have the identical block:

```ts
vi.mock("<path>/api/client", async () => {
  const actual =
    await vi.importActual<typeof import("<path>/api/client")>(
      "<path>/api/client",
    );
  return { ...actual, apiPost: vi.fn(), apiGet: vi.fn() };
});
```

Only the relative import path differs. Every future ticket whose
component ultimately calls `apiGet`/`apiPost` (directly or via
`AuthContext`) will need this same mock — worth extracting now, before
it's copy-pasted a third and fourth time.

**3. The `useAuth` mock pattern is duplicated verbatim.**
`ProtectedRoute.test.tsx` and `CallbackScreen.test.tsx` both have:

```ts
const mockUseAuth = vi.fn();
vi.mock("<path>/AuthContext", () => ({ useAuth: () => mockUseAuth() }));
```

Again, only the relative path differs. Any future component that reads
`useAuth()` directly (not just ones behind `ProtectedRoute`) will need
this same setup.

## Not filed as findings — watched instead

- `ProtectedRoute.test.tsx`'s `renderProtected()` and
  `CallbackScreen.test.tsx`'s `renderCallback()` are structurally
  similar (both wrap the component under test in a `MemoryRouter` +
  stub destination routes) but not literally duplicated — the actual
  routes and components under test differ meaningfully. Only two
  instances exist. Per this project's own "three similar lines beats a
  premature abstraction" convention, not worth collapsing yet — revisit
  if a third similar case appears.
- `e2e/smoke.spec.ts` and `e2e/auth-unauthenticated.spec.ts` both
  ultimately land on asserting `/login`, but they exercise genuinely
  different entry routes (`/` vs. `/auth/callback`) through the routing
  tree. Not flagged as redundant — the entry-point coverage is real, and
  both specs are cheap.
