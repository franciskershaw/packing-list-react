# 006 — API client design

## Status

Accepted (2026-07-17, PACKFE-002 kickoff)

## Decision

`src/api/client.ts` exposes typed verb helpers built on one internal
request function:

```ts
apiGet<T>(path: string): Promise<T>
apiPost<T>(path: string, body?: unknown): Promise<T>
apiPatch<T>(path: string, body?: unknown): Promise<T>
apiDelete<T>(path: string): Promise<T>
```

- **Paths are bare Go route paths** (`apiGet('/categories')`, not
  `apiGet('/api/categories')`). The wrapper prepends `/api` internally
  before calling `fetch`, matching PACKFE-001's Vite proxy
  (`/api/* → localhost:8080`, prefix stripped). Every future call site
  reads identically to the Go route it hits; the proxy prefix stays an
  internal detail.
- **Errors throw, they don't return a Result.** Non-2xx responses throw
  `ApiError` (`status: number`, `body: unknown`, parsed from the response
  if present). This matches TanStack Query's own convention — its
  `queryFn`/`mutationFn` are expected to throw on failure, which it
  catches and exposes via `isError`/`error` — so no unwrapping step is
  needed at every call site.
- **204 responses are auto-detected.** The wrapper checks for
  `status === 204` (confirmed via source: `DELETE` and
  `pack-all`/`unpack-all` endpoints return `204` with no body) before
  attempting `.json()`, returning `undefined` in that case. Callers never
  need to know or declare which endpoints have a body.

## Session/token state — supersedes part of ADR 001, amends ADR 004

ADR 001 described the access token as "held in memory via `AuthContext`."
That undersold a real problem this ticket surfaced: `client.ts` is a
plain module, not a React component — it cannot call `useContext`. Two
things need to cross that boundary:

1. **Read**: `client.ts` needs the current token to attach as
   `Authorization: Bearer <token>` on every request.
2. **Write-back**: on a `401`, `client.ts` needs to clear the token —
   and whatever the user sees needs to reactively reflect that (e.g. a
   nav bar showing "signed in"), even though the clear was triggered from
   outside React entirely.

**Decision**: the token lives in TanStack Query's `QueryClient` cache
(`src/lib/queryClient.ts`, already established in PACKFE-001 for server
state), under a dedicated query key, via a small wrapper
(`src/api/authToken.ts`):

```ts
const TOKEN_KEY = ["authToken"];
export function getAccessToken(): string | null {
  return queryClient.getQueryData<string | null>(TOKEN_KEY) ?? null;
}
export function setAccessToken(token: string | null) {
  queryClient.setQueryData(TOKEN_KEY, token);
}
```

`client.ts` calls these directly — no React involved. Any component
using `useQuery({ queryKey: TOKEN_KEY, ... })` (built in `PACKFE-003`,
inside `AuthContext`) reactively re-renders when `setQueryData` changes
it, regardless of what triggered the change. On a `401`, `client.ts`
just calls `setAccessToken(null)` — no separate navigation-signaling
mechanism is needed; whatever reacts to the token becoming `null` (built
in `PACKFE-003`) does so the same way whether that happened via an
explicit logout or a `401`.

`staleTime: Infinity` and no real `queryFn` are required wherever this
key is consumed via `useQuery` — the token is never "fetched" in
TanStack Query's normal server-resource sense; the _only_ thing that
ever changes it is an explicit `setAccessToken` call. This must be
documented at each consumption site, not just here, since it's a
non-obvious constraint on an otherwise-normal-looking `useQuery` call.

This does not reopen ADR 004's "no Zustand" call in general — it reuses
the _already-adopted_ `QueryClient`, rather than introducing a second
state library. It does still meet ADR 004's own revisit-when spirit
(a concrete, non-hypothetical need to read/write a piece of state from
outside the component tree), just via a different concrete trigger than
ADR 004 anticipated (cross-boundary reactivity, not component-subtree
fan-out).

## Alternatives rejected

- **Plain module-level variable** (`let accessToken; export function
getAccessToken() {...}`): solves the _read_ problem but not the
  _write-back_ one — a plain variable mutation doesn't trigger a React
  re-render, so a `401`-triggered clear would silently desync from what
  the UI shows. Rejected once this gap was identified, not before.
- **Zustand**: solves both problems (outside-React read/write, inside-
  React reactivity) but as a _second_ state-management library alongside
  TanStack Query, which ADR 004 already rejected in general. Since
  `QueryClient` already provides the same properties, adding Zustand
  would be redundant, not necessary.
- **Custom browser event for 401 → navigate** (`window.dispatchEvent(new
Event('auth:unauthorized'))`): works, but is a second, separate
  mechanism from the token-state one. Superseded once the token-state
  fix (`QueryClient`) was chosen — a component can just react to the
  token value itself going `null`, for any reason, rather than listening
  for a bespoke event that only covers the 401 case specifically.
- **Full page reload to `/login`** (`window.location.href = ...`) on
  401: simplest possible fix, rejected because it destroys all in-memory
  app state (TanStack Query cache, unsaved UI state) on every
  unauthorized response, not just genuine session expiry.
- **Result-style return** (`{ ok, data } | { ok, status, body }`) instead
  of throwing `ApiError`: more explicit per call site, but fights
  TanStack Query's throw-based convention — every query/mutation
  function would need an unwrapping step.
- **Explicit per-call 204 flag** (e.g. `apiDelete(path, { noContent:
true })`): rejected — every call site would need to already know and
  correctly declare each endpoint's response shape, when the wrapper can
  just detect it.

## Revisit when

- If a second, unrelated piece of state needs the same "outside-React
  read/write + inside-React reactivity" treatment and reusing
  `QueryClient` for it would be a worse fit than a real state library
  (e.g. the state isn't naturally key-value shaped, or the
  `staleTime: Infinity` workaround stops feeling appropriate) — revisit
  Zustand then, scoped to that specific case, per ADR 004's own
  revisit-when.
- If `PACK-026` (OpenAPI spec) ships in `packing-list-go` and the client
  is regenerated per ADR 002 — confirm the generated client preserves
  this error-throwing/204-detection/path-prefix behavior, or document
  the deltas.
