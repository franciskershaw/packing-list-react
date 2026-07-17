# PACKFE-002 — Hand-written API client & types

## Context

Every feature ticket from `PACKFE-003` onward needs a way to call the Go
API. This ticket builds that: hand-written TypeScript types mirroring
`packing-list-go`'s Go structs (per [ADR 002](../adr/002-api-contract.md)),
and a fetch wrapper (`src/api/client.ts`) with typed verb helpers,
consistent error handling, and a way to attach the current access token —
even though the thing that will actually _manage_ that token
(`AuthContext`) doesn't exist until `PACKFE-003`.

**Design gate**: this ticket introduces a genuinely new pattern — no
prior ticket has established API-client conventions (error handling
shape, path convention, session-state access from outside React) — so it
gets its own ADR: [ADR 006](../adr/006-api-client-design.md). That ADR
also amends [ADR 001](../adr/001-auth-session-model.md) (the token's
actual storage mechanism) and [ADR 004](../adr/004-state-management.md)
(why this doesn't reopen the Zustand rejection in general). Read ADR 006
in full before touching `client.ts` — this doc summarizes, it doesn't
replace it.

Key decisions from the interview (2026-07-17):

- **Verified wire shapes against handler source, not just the model
  structs.** Category/Item/Template/TemplateItem/PackingList/
  PackingListItem CRUD handlers all return the raw model directly
  (`c.JSON(status, category)`), so the model's own `json` tags are the
  accurate wire format. The one exception: `GET /me` builds a custom
  `gin.H` response (`id`, `email`, `name`, `avatarUrl`) that does **not**
  match the full `User` model (which also has `googleId`, `displayName`,
  `createdAt`, `lastLoginAt`) — this gets its own `UserProfile` type, not
  a reuse of `User`. Confirmed `DELETE` and `pack-all`/`unpack-all`
  return `204` with no body; bulk-add endpoints return a plain array of
  the existing item type, not a new shape.
- **Session/token state lives in the TanStack Query cache**, not a plain
  variable or Zustand — see ADR 006's full reasoning. `client.ts` reads/
  writes it via `src/api/authToken.ts`, no React involved.
- **Errors throw `ApiError`** (status + parsed body), matching TanStack
  Query's expected `queryFn`/`mutationFn` behavior.
- **Call sites use bare Go route paths** (`apiGet('/categories')`) — the
  wrapper prepends `/api` internally, matching PACKFE-001's Vite proxy.
- **204 responses are auto-detected** by the wrapper, not declared by
  callers.
- **Fetch is mocked via `vi.stubGlobal('fetch', ...)`**, no new test
  dependency (MSW considered, deferred until mocking needs grow more
  complex than this ticket's).

## Acceptance criteria

- [ ] `src/api/types.ts` defines, each citing the Go struct/handler it
      mirrors: `Category`, `Item`, `Template`, `TemplateItem`,
      `PackingList`, `PackingListItem`, `PackingListDetail`,
      `PackingListCategory`, `PackingListDetailItem`, `User` (the full
      model, for completeness), `UserProfile` (the actual `GET /me`
      shape — `id`, `email`, `name`, `avatarUrl`), and `ApiErrorBody`
      (`{ error: string }`, the consistent error-response shape).
- [ ] `src/api/authToken.ts` exports `getAccessToken()`/
      `setAccessToken(token)`, backed by `queryClient.getQueryData`/
      `setQueryData` under a dedicated query key — no `useState`, no
      plain module variable.
- [ ] `src/api/client.ts` exports `apiGet<T>`, `apiPost<T>`,
      `apiPatch<T>`, `apiDelete<T>`, each built on one internal request
      function that: - Prepends `/api` to the given path before calling `fetch`. - Attaches `Authorization: Bearer <token>` when
      `getAccessToken()` returns non-null; omits the header entirely
      when it's null (no `Authorization: Bearer null`). - On `401`, calls `setAccessToken(null)` before throwing. - On any non-2xx status, throws `ApiError` with the status and
      parsed body (falling back to `undefined` body if parsing fails
      or the body is empty). - On `204` (or an empty body), returns `undefined` instead of
      calling `.json()`. - On `2xx` with a body, returns the parsed JSON as `T`.
- [ ] `ApiError` is exported from `src/api/client.ts`
      (`class ApiError extends Error { status: number; body: unknown }`).

## Non-goals

- `AuthContext`, the login screen, or anything that actually calls
  `setAccessToken` on login/refresh/logout — that's `PACKFE-003`. Today,
  `getAccessToken()` will simply always return `null` since nothing sets
  it yet; that's expected, not a bug.
- Reacting to the token becoming `null` (e.g. navigating to `/login`) —
  also `PACKFE-003`. This ticket only clears the token on a `401`; it
  does not navigate anywhere.
- Any actual feature call sites (`apiGet('/categories')` used from a real
  component) — those start at `PACKFE-004`.
- Request retries, caching beyond what TanStack Query provides by
  default, or request cancellation/`AbortController` wiring — not
  discussed, not scoped here.
- Swapping to a generated client — deferred to whenever `PACK-026`
  (OpenAPI spec) ships in `packing-list-go`, per ADR 002.

## Expected test files

- **`src/api/client.test.ts`** (Vitest, `vi.stubGlobal('fetch', vi.fn())`):
  - Attaches `Authorization: Bearer <token>` when `authToken.ts` has a
    token set; omits it when not.
  - Prepends `/api` to the request path.
  - On a `401` response, calls `setAccessToken(null)` (verify via
    `getAccessToken()` afterward) and throws `ApiError` with
    `status: 401`.
  - On a `409` (or other non-2xx) response, throws `ApiError` with the
    correct status and parsed body — traces to the `ApiError` AC, using
    a realistic status (409, matching the category/item/template
    "already exists"/"has items" conflict responses verified in this
    ticket's own source exploration) rather than an arbitrary one.
  - On a `204` response, resolves to `undefined` rather than throwing or
    attempting to parse JSON.
  - On a `2xx` response with a JSON body, resolves to the parsed body.
- **`src/api/authToken.test.ts`** (Vitest): `setAccessToken` followed by
  `getAccessToken` round-trips the value; defaults to `null` before
  anything is set.
- No Playwright spec for this ticket — nothing user-visible changes yet
  (no real call sites, no UI). Manual verification is `npm run build` +
  `tsc -b` confirming the types compile cleanly against
  `packing-list-go`'s current model definitions.
