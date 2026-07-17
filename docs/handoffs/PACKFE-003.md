# PACKFE-003 — Google sign-in & session bootstrap

## Context

Unblocked as of `PACK-032` shipping in `packing-list-go`. This ticket
builds the actual sign-in flow ADR 001 already designed: a `/login`
screen, session bootstrap on `/auth/callback`, silent session restore on
protected-route loads, route guarding, and sign-out — all wired through
`AuthContext`, which consumes (but does not own) the token store built in
`PACKFE-002` (ADR 006).

**Design gate**: follows precedent — ADR 001 already specifies the full
flow, ADR 006 already settled the client/token mechanics. No new ADR.
The real open decisions from this ticket's interview are recorded here:

- **`AuthContext`'s shape**: `{ user: UserProfile | null; status:
'checking' | 'authenticated' | 'unauthenticated'; logout: () =>
Promise<void> }`. Three-state `status`, not a boolean — a boolean
  can't distinguish "still checking on initial load" from "confirmed
  logged out," and a route guard needs to tell those apart (checking →
  wait; unauthenticated → redirect now) or it redirects to `/login` for
  a flash on every page load before the silent restore finishes. No
  `accessToken` field — that stays `authToken.ts`'s job.
- **One shared restore mechanism**, not two. The AC describes the
  callback's restore and the general silent-restore-on-load as if
  separate, but they're the same operation (refresh → `/me`). `
AuthProvider`'s mount effect runs it once, for any fresh page load
  (whether that lands on `/trips` or `/auth/callback` — Google's
  redirect is a real browser navigation, so the mount effect fires
  either way). `CallbackScreen` and `ProtectedRoute` both just read the
  resulting `status`; neither makes its own separate API calls.
- **Route guarding**: a new `src/app/ProtectedRoute.tsx`, not
  `AppLayout` itself. Keeps `AppLayout` purely presentational (nav +
  shell), matching `PACKFE-001`'s original intent — it never needs to
  know about auth.
- **Sign-out placement**: `src/features/profile/ProfileScreen.tsx`
  replaces the `/profile` placeholder now, deliberately minimal (a
  button calling `logout()`, no styling polish) — reuses the route
  slot `PACKFE-011` will build the real screen into, rather than
  inventing a temporary location that needs tearing down later.
- **Login link**: `<a href="/api/auth/google/login">`, not a `<button
onClick>`. Goes through the same Vite `/api` proxy every other request
  uses (per ADR 006 — no hardcoded backend origin anywhere in frontend
  code), and is a real anchor so native link behavior (middle-click,
  right-click-copy-link, working before React hydrates) isn't lost.
  Styled as a one-off rather than generalizing the `Button` primitive
  (which renders `<button>`, not `<a>`) for a single call site.
- **The authenticated happy path is deliberately not automated.** A
  real Google OAuth consent screen can't and shouldn't be scripted — no
  safe way to hold real credentials in a test, and Google actively
  blocks automated logins. The alternative considered was a dev-only
  `POST /auth/dev-login` backend endpoint (gated to non-production) that
  mints a session without Google, letting Playwright seed a valid cookie
  directly. **Rejected** after weighing it explicitly: the underlying
  restore logic is already fully covered by Vitest (no cross-repo
  dependency), the real risk being tested (does `client.ts`'s assumed
  response shape match the real backend) is already de-risked the same
  way `PACKFE-002` de-risked it — reading actual handler source, not
  guessing — and a standing authentication-bypass endpoint is a
  permanent, security-sensitive piece of production code whose entire
  purpose is circumventing auth, a disproportionate cost for a personal
  single-user app's test convenience. `packing-list-go`'s own
  `requests/auth.http` has documented since `PACK-020` that login/
  callback require a real manual browser round-trip — this isn't a new
  gap, it's consistent with that established practice.
- **Replacement Playwright coverage**: the **unauthenticated** case
  instead. With no cookie at all, landing on `/auth/callback` hits the
  real backend, gets a real `401` from `POST /auth/refresh`, and
  redirects to `/login`. Genuine integration coverage against the real
  running backend (uses `e2e/require-api.ts`'s `requireApi()`, unused
  since `PACKFE-001`), zero new backend surface, and arguably more
  important to get right than the happy path — a broken
  redirect-on-unauthenticated risks a protected route not actually
  being protected.
- **File locations follow ADR 005 exactly as already specified**:
  `AuthContext` lives in `src/app/` (not `features/auth/`) per ADR 005's
  explicit folder comment; `LoginScreen`/`CallbackScreen` live in
  `src/features/auth/`.

## Acceptance criteria

- [ ] `src/api/types.ts` gains `RefreshResponse: { accessToken: string
    }`, mirroring `POST /auth/refresh`'s actual response
      (`internal/handler/auth_handler.go`'s `RefreshToken`).
- [ ] `src/app/AuthContext.tsx` exports `AuthProvider` and `useAuth()`
      (throws a clear error if called outside `AuthProvider` — the raw
      Context object itself is not exported). On mount, `AuthProvider`
      calls `POST /auth/refresh`; on success calls `GET /me` and sets
      `status: 'authenticated'` with the returned `UserProfile`; on any
      failure sets `status: 'unauthenticated'`, `user: null`. Starts in
      `status: 'checking'`.
- [ ] `logout()`: calls `POST /auth/logout`, then `setAccessToken(null)`
      (mirrors `client.ts`'s own 401 behavior), sets `status:
    'unauthenticated'`, `user: null`.
- [ ] `src/app/ProtectedRoute.tsx`: renders `FullPageLoading` while
      `status === 'checking'`, `<Navigate to="/login" replace />` while
      `'unauthenticated'`, `<Outlet />` while `'authenticated'`.
- [ ] `src/app/FullPageLoading.tsx`: minimal shared loading state.
- [ ] `src/app/AppRoutes.tsx`: the existing `<Route element={<AppLayout
    />}>` wraps inside a new `<Route element={<ProtectedRoute />}>`.
      `/login` and `/auth/callback` stay outside it (must be reachable
      while unauthenticated).
- [ ] `src/features/auth/LoginScreen.tsx` replaces the `/login`
      placeholder: `<a href="/api/auth/google/login">Continue with
    Google</a>` + "One tap. No passwords, ever." subtext, styled per
      design tokens.
- [ ] `src/features/auth/CallbackScreen.tsx` replaces the
      `/auth/callback` placeholder: reads `status` from `useAuth()`,
      navigates to `/trips` (`replace: true`) once `'authenticated'`, to
      `/login` (`replace: true`) once `'unauthenticated'`, renders
      `FullPageLoading` while `'checking'`.
- [ ] `src/features/profile/ProfileScreen.tsx` replaces the `/profile`
      placeholder: a "Sign out" button calling `logout()`. Explicitly
      not the real Profile screen.
- [ ] `App.tsx` wraps `<AppRoutes />` in `<AuthProvider>`.

## Non-goals

- The real Google OAuth happy path is not automated — manual
  verification only (see below), not a gap being silently accepted but
  a deliberate, documented call.
- A dev-only auth-bypass backend endpoint — considered and rejected; see
  "Design gate" above.
- The real, designed Profile screen (avatar, email, styling) —
  `PACKFE-011`'s job. `ProfileScreen.tsx` here is deliberately minimal.
- An already-authenticated user manually navigating to `/login` seeing
  the login screen again (harmless — clicking through re-triggers OAuth
  — but not redirected away from `/login` automatically) — known,
  not solved here.
- Refresh-token rotation (`PACK-027` in `packing-list-go`) — unrelated,
  still deferred there.
- `gen_token.go` or any other `packing-list-go` change — none needed,
  since the dev-login endpoint idea was dropped.

## Expected test files

- **`src/app/AuthContext.test.tsx`** (Vitest, `vi.mock('../api/client')`
  to mock `apiPost`/`apiGet`):
  - Mount with a successful refresh + `/me` → `status` becomes
    `'authenticated'`, `user` populated with the mocked `UserProfile`.
  - Mount with a failed refresh (mocked `ApiError`) → `status` becomes
    `'unauthenticated'`, `user` stays `null`.
  - `logout()` → calls `apiPost('/auth/logout')`, resets `status` to
    `'unauthenticated'` and `user` to `null`.
- **`src/app/ProtectedRoute.test.tsx`** (Vitest + Testing Library +
  `MemoryRouter`): renders under each of the three `status` values
  (via a test-only auth-context override), asserts the correct output
  for each — loading state, redirect, or the wrapped outlet content.
- **`src/features/auth/CallbackScreen.test.tsx`** (Vitest): added during
  implementation planning, not in the original interview — `CallbackScreen`
  has real conditional logic (watching `status`, branching to different
  `navigate()` calls), the same category of behavior the `PACKFE-001`
  `Modal` lesson was about not silently carving out. Tests: `'checking'`
  renders `FullPageLoading` and calls no navigation; `'authenticated'`
  navigates to `/trips` with `replace: true`; `'unauthenticated'`
  navigates to `/login` with `replace: true`.
- **`e2e/auth-unauthenticated.spec.ts`** (Playwright, calls
  `requireApi()` in `beforeAll`): with no cookies set, navigate to
  `/auth/callback`, assert the final URL is `/login`.
- **No dedicated test for `LoginScreen`**: purely static markup (an
  anchor tag + text), no state, no conditionals, no JS event handler of
  its own — genuinely presentation-only, not a carve-out applied loosely.
- **No dedicated test for `ProfileScreen`**: its only behavior is a
  one-line delegate (`onClick={() => logout()}`), no branching logic of
  its own — `logout()`'s actual behavior is what `AuthContext.test.tsx`
  covers. Different from `CallbackScreen`'s case above (real conditional
  logic) — noted explicitly so this reads as a considered call, not an
  oversight.
- **Manual verification** (the authenticated happy path — see "Design
  gate" above for why this isn't automated):
  1. `npm run dev` + `go run main.go` both running.
  2. Navigate to `/login`, click "Continue with Google," complete the
     real Google consent screen.
  3. Confirm you land on `/trips`, not stuck on `/auth/callback` or
     bounced to `/login`.
  4. Reload the page on `/trips` — confirm the silent restore keeps you
     signed in (no flash back to `/login`).
  5. Navigate to `/profile`, click "Sign out" — confirm you land on
     `/login` and reloading `/trips` directly now redirects you back to
     `/login`.
