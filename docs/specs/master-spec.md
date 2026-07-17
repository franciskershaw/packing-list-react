# Packing List Frontend — Master Spec

> Working title only — "Packing List" is a placeholder naming convention
> shared with `packing-list-go`, not a final product name. Avoid
> introducing a product name into code, docs, or route naming until one
> is chosen.

This spec was produced via the `project-kickoff` skill on 2026-07-17,
grounded in the existing `packing-list-go` API (its master spec, models,
`.http` request files, and 2026-07-11 audit) and two design prototype
exports (`Packing App Desktop - bundled.html`,
`Packing App Prototype - bundled.html`).

## Goals

A responsive web frontend for the personal packing-list API in
`packing-list-go`. A user signs in with Google, browses/manages their
item library, builds reusable packing templates, and creates packing
lists for specific trips — optionally seeded from a template — ticking
items off as they pack.

## Core use cases

(Mirrors the API's own core use cases — see
`packing-list-go/docs/specs/master-spec.md` — expressed as UI flows:)

- Sign in with Google; stay signed in across visits without re-clicking
  sign-in every time (session restore).
- Browse the item library: system-provided categories/items alongside
  the user's own; create/rename/delete personal categories and items.
- Build a named template (e.g. "Weekend hiking") with items organized by
  category, quantities, and notes.
- Create a packing list ("trip") for an actual event, optionally seeded
  from a template, then add/remove/adjust items independently of the
  template it came from.
- Tick items off individually while packing; bulk pack-all/unpack-all.
- Archive a trip when it's done; restore (unarchive) it later; view
  archived trips separately from active ones.
- View and sign out from a profile screen (avatar, name, email).

## Non-goals (current scope)

Inherited from the backend's own non-goals, confirmed at kickoff:

- No sharing/collaboration UI between users — the API enforces strict
  per-user ownership with no sharing endpoints.
- No offline/sync support.
- No native mobile app — responsive web only, matching the
  Desktop/Prototype design variants.

## Key architecture decisions

- **Stack**: React 19, Vite, TypeScript, Tailwind v4, TanStack Query.
  (Already scaffolded in the repo before this kickoff.)
- **Routing**: React Router — see [ADR 003](../adr/003-routing.md).
- **State management**: TanStack Query for server state, Context +
  `useState`/`useReducer` for client UI state — see
  [ADR 004](../adr/004-state-management.md).
- **Component structure & styling**: feature folders + Tailwind design
  tokens sourced from the design files — see
  [ADR 005](../adr/005-component-structure-and-styling.md).
- **Auth/session model**: httpOnly refresh cookie + refresh-on-load,
  access token held in memory only, never in a URL or
  `localStorage`/`sessionStorage` — see
  [ADR 001](../adr/001-auth-session-model.md). **Has a cross-repo
  dependency on `packing-list-go`** — see that ADR's "Cross-repo
  dependency" section before starting PACKFE-003.
- **API contract**: hand-written TypeScript types mirroring
  `packing-list-go`'s Go structs field-for-field, swapped for a
  generated client once `PACK-026` (OpenAPI spec) ships in
  `packing-list-go` — see [ADR 002](../adr/002-api-contract.md).
- **Local dev connectivity**: Vite dev-server proxy (`/api` →
  `http://localhost:8080`), not CORS. No backend change needed to start
  frontend work. Requires `packing-list-go` running locally on `:8080`
  alongside `npm run dev`.
- **Ticket ID prefix**: `PACKFE-NNN`, distinct from the backend's
  `PACK-NNN`, to avoid collisions when the two are referenced together
  (e.g. in this same doc, or in a shared standup).
- **Manual verification**: a Playwright spec per acceptance criterion is
  this project's analog to the backend's `.http` request files — same
  "per-AC checkpoint before that criterion's commit" discipline, and the
  same specs double as the eventual E2E suite. See the project
  `CLAUDE.md` for the tests-first redefinition this implies for
  presentation-only work.

## Non-functional requirements

**Load & performance**: single-user personal app — no concurrency
concerns beyond one browser tab talking to one locally-running API
instance. No client-side rate limiting or request-queuing needed. Data
volumes are small (one person's items/templates/trips), so no pagination
is planned for any list view unless a specific ticket's `grill-me`
surfaces a real need. Latency budget: interactions should feel
instant against a local API (sub-100ms typical); TanStack Query's default
retry/staleness settings are the starting point, revisited per-ticket
only if a specific screen's behavior warrants it.

**Session & data lifecycle**: access token lives in memory only for the
tab's lifetime (15 min validity, matching the backend); the httpOnly
refresh cookie persists a session for 7 days per the backend's existing
policy. No client-side token persistence beyond that — a closed tab
means a silent re-auth via the refresh cookie on next visit, or a
re-login if the cookie itself has expired. Client-side revocation posture
is whatever the backend currently supports (logout clears the cookie;
no rotation/reuse-detection yet — tracked as `PACK-027` in
`packing-list-go`, deliberately deferred there until the auth-integration
ticket, i.e. `PACKFE-003`, is underway). Archived trips are retained
indefinitely client-side (no local data retention/cleanup beyond the
TanStack Query cache, which is memory-only and clears on reload).

**Deployment target**: undecided — local dev only for now. Revisit
before the first ticket that needs a public URL (e.g. a real Google
OAuth redirect URI beyond `localhost`), since that also affects
cross-origin cookie behavior assumed in ADR 001.

## Ticket backlog

Epic order follows dependency order: auth gates every authenticated API
call; categories/items must exist before templates or trips can
reference them.

### Epic 1: Foundations

- **PACKFE-001** — Project scaffolding: routing, query client, design
  tokens, base layout.
  - [x] React Router installed; route skeleton in place (see ADR 003) —
        each route may render a placeholder, but the skeleton itself
        must exist and be navigable.
  - [x] `QueryClientProvider` wired in `main.tsx`.
  - [x] Tailwind config extended with design tokens (color palette +
        Bricolage Grotesque font) extracted from the two design files.
  - [x] `src/components/ui/` scaffolded with minimal Button, Modal,
        Badge, Input primitives (styling only, no feature logic).
  - [x] Base app shell renders: nav matching Trips/Templates/Library,
        a profile entry point.
  - [x] Vite dev-server proxy configured (`/api` → `localhost:8080`).
  - [x] Playwright installed and configured; one smoke spec verifies the
        app shell renders and nav links are present.
  - [x] Vitest + Testing Library installed and configured; one smoke
        test verifies the project's test runner works end to end.
  - **Status: Done.** See `docs/handoffs/PACKFE-001.md`. Also shipped,
    not originally scoped: Prettier + import sorting + a Husky/
    lint-staged pre-commit hook, and oxlint's `jsx-a11y` plugin — see
    project `CLAUDE.md`. Surfaced a real test-coverage gap on `Modal`
    (see `LESSONS.md`), not yet resolved.

- **PACKFE-002** — Hand-written API client & types.
  - [x] `src/api/types.ts` mirrors every `packing-list-go`
        `internal/models/*.go` struct field-for-field (exact `json` tag
        casing), each type citing the Go struct it mirrors.
  - [x] `src/api/client.ts`: fetch wrapper reading the base URL from the
        Vite proxy, attaching the `Authorization` header from the token
        store (`src/api/authToken.ts` — not `AuthContext` directly; see
        ADR 006).
  - [x] 401 responses from the wrapper trigger a defined behavior
        (clear the token) — redirect-to-`/login` deferred to
        `PACKFE-003`, since it's the piece that reacts to the token
        becoming `null`, not the piece that clears it. Decided in this
        ticket's own `grill-me`, per ADR 006.
  - [x] Vitest tests cover the wrapper's header-attachment and
        401-handling behavior.
  - **Status: Done.** See `docs/handoffs/PACKFE-002.md`. Produced
    [ADR 006](../adr/006-api-client-design.md) plus addenda to ADR 001
    and ADR 004 — the session-state mechanism evolved during the
    interview (plain variable → Zustand → reusing `QueryClient`), see
    `LESSONS.md` for how.

### Epic 2: Auth

- **PACKFE-003** — Google sign-in & session bootstrap. **Blocked on
  `PACK-032` in `packing-list-go`** (OAuth callback redirect change —
  filed 2026-07-17, not started) — see
  [ADR 001](../adr/001-auth-session-model.md)'s cross-repo dependency
  note.
  - [ ] `/login` screen matches the design ("Continue with Google"
        button, "One tap. No passwords, ever." subtext).
  - [ ] Clicking the button performs a full-page navigation to
        `GET {API}/auth/google/login` (not a fetch).
  - [ ] `/auth/callback` route: on mount, calls `POST /auth/refresh`,
        then `GET /me` on success, populates `AuthContext`, navigates to
        `/trips`.
  - [ ] On app load at any protected route, `AuthContext` attempts
        silent session restore (refresh → `/me`) before rendering;
        failure redirects to `/login`.
  - [ ] Sign out calls `POST /auth/logout`, clears `AuthContext`,
        redirects to `/login`.
  - [ ] Vitest tests cover `AuthContext`'s state transitions
        (unauthenticated → authenticated → signed out).
  - [ ] Playwright spec covers the callback → `/trips` happy path
        against a real locally-running backend session.

### Epic 3: Library

- **PACKFE-004** — Category browsing & management.
  - [ ] `/library` lists system categories and the user's own
        (`GET /categories`).
  - [ ] Create a personal category (`POST /categories`); name-uniqueness
        violation surfaces the backend's error clearly.
  - [ ] Rename a personal category (`PATCH /categories/:id`); system
        categories are read-only in the UI (no edit affordance shown).
  - [ ] Delete a personal category (`DELETE /categories/:id`); a 409
        (items still exist under it) surfaces as a clear, non-crashing
        error.

- **PACKFE-005** — Item browsing, search/filter & management.
  - [ ] Items list filterable by category and name search
        (`GET /items?category_id=&search=`).
  - [ ] Create a personal item under an accessible category
        (`POST /items`); name-uniqueness-within-category violation
        surfaces clearly.
  - [ ] Edit a personal item, including moving it to a different
        category (`PATCH /items/:id`); system items are read-only.
  - [ ] Delete a personal item (`DELETE /items/:id`); a 409 (referenced
        by a template or packing list) surfaces as a clear error.

### Epic 4: Templates

- **PACKFE-006** — Template CRUD.
  - [ ] `/templates` lists the user's templates (`GET /templates`).
  - [ ] Create a template with name + optional description
        (`POST /templates`).
  - [ ] `/templates/:id` shows the template with its items grouped by
        category (`GET /templates/:id`).
  - [ ] Rename/edit description (`PATCH /templates/:id`).
  - [ ] Delete a template (`DELETE /templates/:id`), with a confirm step
        matching the design's "Delete template" affordance.

- **PACKFE-007** — Managing items on a template.
  - [ ] Add an item with optional quantity/notes
        (`POST /templates/:id/items`).
  - [ ] Update an item's quantity/notes
        (`PATCH /templates/:id/items/:itemId`).
  - [ ] Remove an item (`DELETE /templates/:id/items/:itemId`).
  - [ ] Bulk-add every item from a chosen category
        (`POST /templates/:id/items/bulk`), matching the design's
        category-driven add flow.

### Epic 5: Trips (Packing Lists)

- **PACKFE-008** — Packing list creation & list view.
  - [ ] Create a trip with name + optional event date, optionally
        seeded from a template ("Start from" field in the design)
        (`POST /lists`).
  - [ ] `/trips` shows active (non-archived) trips
        (`GET /lists`).
  - [ ] Toggle to archived trips (`GET /lists?archived=true`), matching
        the design's "Archived" tab.

- **PACKFE-009** — Trip detail: items grouped by category.
  - [ ] `/trips/:id` shows items grouped by category
        (`GET /lists/:id`).
  - [ ] Add/remove/update individual items on the trip
        (`POST` / `PATCH` / `DELETE /lists/:id/items/:itemId`).
  - [ ] Bulk-add every item from a chosen category
        (`POST /lists/:id/items/bulk`).
  - [ ] Rename the trip / edit its event date (`PATCH /lists/:id`).

- **PACKFE-010** — Packing/ticking items, archive/restore.
  - [ ] Tick an individual item packed/unpacked (`PATCH .../items/:itemId`
        with `is_packed`).
  - [ ] "Pack it all" / "Reset all" bulk actions
        (`POST /lists/:id/pack-all`, `POST /lists/:id/unpack-all`),
        matching the design's button labels.
  - [ ] Archive a trip (`DELETE /lists/:id`); "Restore" un-archives it
        (`POST /lists/:id/unarchive`), matching the design's reversible
        archive toggle.

### Epic 6: Profile

- **PACKFE-011** — Profile screen.
  - [ ] Shows avatar initials, display name, email, "Signed in with
        Google" (from `GET /me`), matching the design.
  - [ ] Sign out affordance (reuses the `AuthContext` sign-out flow from
        PACKFE-003).

### Epic 7: Production readiness & polish

_(Filed as placeholders at kickoff — each gets its own `grill-me` before
implementation, per the standard pipeline.)_

- **PACKFE-012** — Loading/error/empty states audit across all screens.
- **PACKFE-013** — Responsive pass, checked against both the Desktop and
  Prototype design variants (the two design files use different fixed
  widths — confirm the intended breakpoint strategy as part of this
  ticket's `grill-me`, since it wasn't decided at kickoff).
- **PACKFE-014** — Accessibility pass: keyboard navigation, focus
  management, ARIA on tab nav and modals.
- **PACKFE-015** — E2E coverage consolidation: promote the per-AC
  Playwright specs written across Epics 1–6 into a cohesive smoke suite;
  decide whether/how to wire it into CI as part of this ticket.
