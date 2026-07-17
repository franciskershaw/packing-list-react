# 001 — Auth/session model: cookie + refresh-on-load

## Status

Accepted (2026-07-17, project kickoff)

## Decision

The frontend never receives an access token in a URL. Sign-in works as:

1. User clicks "Continue with Google" → full-page navigation to
   `GET {API}/auth/google/login` (not a fetch — this is a real OAuth
   redirect flow).
2. Google redirects back to `GET /auth/google/callback` on the Go API.
   That handler sets the httpOnly refresh cookie (already does today) and
   must be changed to **redirect to `http://localhost:5173/auth/callback`
   with no token in the URL**, instead of its current behavior of
   returning the access token as JSON in the browser tab.
3. The frontend's `/auth/callback` route mounts, immediately calls
   `POST /auth/refresh` (browser sends the httpOnly cookie automatically),
   receives `{ accessToken }` in the response body, and stores it
   in-memory via `AuthContext` — never in `localStorage` or
   `sessionStorage`.
4. It then calls `GET /me` to hydrate the user's profile (name, email,
   avatar) and navigates to `/trips`.
5. On any subsequent full page load, `AuthContext` silently repeats step
   3–4 (refresh → `/me`) before rendering protected routes, so a
   returning user doesn't need to click sign-in again as long as the
   refresh cookie is valid.
6. Sign out calls `POST /auth/logout` (clears the refresh cookie
   server-side) and clears `AuthContext`.

## Cross-repo dependency

Step 2 required a change in `packing-list-go`:
`internal/handler/auth_handler.go`'s `GoogleCallback` used to render the
access token as JSON; it now redirects to the frontend's `/auth/callback`
route instead, with no token in the URL. Shipped as **`PACK-032`**
(2026-07-17, Done) — see `packing-list-go/docs/specs/master-spec.md` and
`docs/handoffs/PACK-032.md` there. Separate from `PACK-027`
(refresh-token rotation — related but distinct, still not started).
`PACKFE-003` (this project's sign-in ticket) is unblocked as of
`PACK-032` shipping.

## Addendum (2026-07-17, PACKFE-002)

Step 3's "in-memory via `AuthContext`" undersold the actual mechanism —
`AuthContext` doesn't itself own token storage. The token lives in
TanStack Query's `QueryClient` cache, read/written via
`src/api/authToken.ts`'s `getAccessToken()`/`setAccessToken()`, because
`src/api/client.ts` (a plain module, not a component) needs to read and
clear it without React involved at all. `AuthContext` (when built) reads
the same underlying value reactively via `useQuery`. Full reasoning and
rejected alternatives (a plain module variable; Zustand; a custom browser
event for 401-triggered redirects) are in
[ADR 006](006-api-client-design.md). This is a mechanism-level
refinement, not a reversal — the token is still in-memory only, still
never in a URL/`localStorage`/`sessionStorage`.

## Alternatives rejected

- **One-time code exchange**: backend redirects with a short-lived opaque
  code in the URL, frontend exchanges it server-side for tokens via a new
  endpoint. More robust against referrer-leakage/back-button replay, but
  requires a new backend endpoint + server-side code store — a bigger
  backend lift than the redirect-only change above, for marginal benefit
  at this app's threat level (personal single-user app, not a
  multi-tenant SaaS).
- **Keep current JSON-in-tab response**: rejected outright — this is the
  exact anti-pattern the 2026-07-11 API audit (finding S9) warned against.

## Revisit when

- The refresh-token rotation work (PACK-027 in `packing-list-go`) lands —
  confirm the rotated-token response shape still fits step 3 above
  unchanged.
- If a real production deployment target is chosen (see the master spec's
  NFR section, currently "undecided, local only") — cross-origin cookie
  behavior (`SameSite`, `Domain`) needs re-verifying once frontend and
  backend are on different real domains, not just different localhost
  ports.
