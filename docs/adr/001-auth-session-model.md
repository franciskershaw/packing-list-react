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

Step 2 requires a change in `packing-list-go`:
`internal/handler/auth_handler.go`'s `GoogleCallback` currently renders
the access token as JSON. It needs to redirect to the frontend's
`/auth/callback` route instead, with no token in the URL. This is filed
as **`PACK-032`** in `packing-list-go/docs/specs/master-spec.md`
(2026-07-17, filed from this kickoff), separate from `PACK-027`
(refresh-token rotation — related but distinct, see that ticket's own
entry). `PACKFE-003` (this project's sign-in ticket) is blocked on
`PACK-032` landing first.

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
