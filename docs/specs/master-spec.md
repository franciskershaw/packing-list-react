# Packing List Frontend — Master Spec

> Working title only — "Packing List" is a placeholder naming convention
> shared with `packing-list-go`, not a final product name.

This spec was produced via a redo of the `project-kickoff` skill on
2026-07-19, on the `undo-entire-process` branch — a deliberate reset of
the first attempt at this project. It exists as a personal roadmap
reference, not a handoff artifact: you (the developer) are building most
of this yourself, hand-coding UI directly against two design exports
(`desktop.html`, `prototype.html`, living one level up from this repo at
`../../desktop.html` / `../../prototype.html` — intentionally not
committed, see project `CLAUDE.md`). AI's role on this branch is pairing,
review, and test suggestions — see `CLAUDE.md` for the full breakdown of
what changed from the global process and why.

The backend (`packing-list-go`) and the designs are both unchanged from
the first attempt — only the process changed. See the root `LESSONS.md`
in this repo's git history (`main` branch, pre-reset) if you want the
full retro on what went wrong the first time; the short version is in
`CLAUDE.md`.

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

- No sharing/collaboration UI between users — the API enforces strict
  per-user ownership with no sharing endpoints.
- No offline/sync support.
- No native mobile app — responsive web only, matching the
  Desktop/Prototype design variants.
- No automated E2E test suite — ruled out, not deferred (see
  `CLAUDE.md`'s testing section for why).

## Architecture (decided, not re-litigated)

No ADRs on this branch — these are stated as facts, decided once during
the original kickoff and unchanged since. Revisit inline in this doc if
one stops fitting; no formal record-keeping process around it.

- **Stack**: React 19, Vite, TypeScript, Tailwind v4, TanStack Query,
  React Router.
- **Routing**: React Router.
- **State**: TanStack Query for server state; Context + `useState`/
  `useReducer` for client UI state.
- **Component structure & styling**: feature folders
  (`src/features/{auth,trips,templates,library,profile}/`) + shared
  primitives in `src/components/ui/` + Tailwind design tokens sourced
  from the design files.
- **Responsive/breakpoint strategy** (decided 2026-07-19 during grill-me
  on the landing screen, not at original kickoff — kickoff left this
  unset): default to one responsive component per screen, reflowed with
  Tailwind breakpoint utilities, when mobile and desktop show the same
  elements just rearranged. Split into separate variants sharing logic
  via a hook (not shared markup) only when a breakpoint changes _what's
  there_ — a different nav pattern, a different interaction model,
  elements added/removed rather than repositioned. Test: same DOM
  elements, different arrangement → one component; different elements or
  interaction pattern → two components, shared logic.
- **Auth/session**: httpOnly refresh cookie + refresh-on-load, access
  token in memory only, never in a URL or `localStorage`. Has a
  cross-repo dependency on `packing-list-go` — check that project before
  starting the sign-in ticket.
- **API contract**: hand-written types in `src/api/types.ts` mirroring
  `packing-list-go`'s Go structs field-for-field, until that project
  ships an OpenAPI spec.
- **Local dev connectivity**: Vite dev-server proxy (`/api` →
  `http://localhost:8080`), not CORS. Requires `packing-list-go` running
  locally on `:8080` alongside `npm run dev`.

## Non-functional requirements

**Load & performance**: single-user personal app — no concurrency
concerns beyond one browser tab talking to one locally-running API
instance. No client-side rate limiting or pagination planned unless a
specific screen's build surfaces a real need. Latency budget:
interactions should feel instant against a local API; TanStack Query's
default retry/staleness settings are the starting point.

**Session & data lifecycle**: access token lives in memory only for the
tab's lifetime (15 min validity, matching the backend); the httpOnly
refresh cookie persists a session for 7 days. No client-side token
persistence beyond that. Archived trips are retained indefinitely
client-side.

**Deployment target**: undecided — local dev only for now. Revisit
before needing a public URL (affects the Google OAuth redirect URI and
cross-origin cookie behavior).

## Roadmap

A personal reference, not a ticket-tracking system. Check items off
directly in this file as you build them — no separate close-out process.
Each ticket is a rough scope + a checklist, not a full acceptance-
criteria contract; expand in chat with AI as needed when you actually
start one, rather than writing it all up front.

### Epic 1: Foundations

- **PACKFE-001** — App shell & plumbing
  - [x] React Router installed, one placeholder route renders (`src/app/AppRoutes.tsx`)
  - [ ] `QueryClientProvider` wired in `main.tsx`
  - [ ] Tailwind config extended with design tokens (color palette, font)
        pulled from `desktop.html`/`prototype.html`
  - [ ] `src/components/ui/` scaffolded with Button, Modal, Badge, Input
        primitives (styling only)
  - [ ] Base app shell renders: nav matching Trips/Templates/Library, a
        profile entry point - [ ] Two components sharing data via a hook, per the responsive
        strategy above (different elements/interaction, not just
        rearrangement): `MobileTabBar.tsx` (bottom, floating) +
        `DesktopSidebar.tsx` (left rail), both in
        `src/components/nav/`, driven by a shared `navItems.ts`
        (Trips/Templates/Library/Profile, each with a
        `showAs: "tab" | "accountRow"` flag) - [ ] `AppShell.tsx` (`src/components/nav/`) wraps authenticated
        routes via nested `<Route>` + `<Outlet>`; `AppRoutes.tsx`
        restructured so `/trips`, `/templates`, `/library`,
        `/profile` nest under it. Sign-in stays outside the shell. - [ ] Switch point: Tailwind `lg` (1024px) - [ ] Mobile bar: `fixed` (not `absolute`), bottom offset adds
        `env(safe-area-inset-bottom)`; main content gets a shared
        bottom-padding constant from the shell, not hardcoded per
        screen - [ ] Desktop: `h-screen flex` in the shell, sidebar `shrink-0`,
        sidebar and content each independently `overflow-y-auto` - [ ] Desktop account row navigates to `/profile` (same
        destination as mobile's Profile tab), no dropdown menu;
        shows real `user.avatarUrl`, not a fabricated-initials
        placeholder - [ ] `/templates`, `/library`, `/profile` get minimal "coming
        soon" placeholder screens matching `TripsScreen.tsx`'s
        existing pattern - [ ] Add `--color-accent-subtle: #f6e3d9` to `index.css`'s
        `@theme` - [ ] `useActiveNavKey` hook (pathname → active key) gets a
        Vitest unit test for its branching; presentational nav
        components stay untested
  - [ ] `DesktopSidebar.tsx` renders real content (currently a
        placeholder box) — matches `../../profile-page-handoff.html`'s
        desktop state (screenshotted 2026-07-24): logo header,
        Trips/Templates/Library rows via shared `navItems.ts`,
        bottom-pinned account row (avatar + name + email, shared
        `Avatar` component, navigates to `/profile`, highlighted when
        active). Built alongside PACKFE-007, tracked here since it's
        shell scope, not profile-screen scope.

### Epic 2: Auth

- **PACKFE-002** — Google sign-in & session restore
  - [ ] Sign-in screen matches the design's Google button treatment
  - [ ] Access token held in memory; refresh-on-load restores a session
        without a visible re-login
  - [ ] Protected routes redirect to sign-in when unauthenticated

### Epic 3: Item library

- **PACKFE-003** — Categories & items CRUD
  - [ ] Browse system + personal categories, with system ones
        non-editable
  - [ ] Create/rename/delete personal categories
  - [ ] Create/rename/delete personal items within a category

### Epic 4: Templates

- **PACKFE-004** — Reusable packing templates
  - [ ] Create a named template
  - [ ] Add items to a template with quantity + notes, organized by
        category
  - [ ] Edit/delete a template

### Epic 5: Trips

- **PACKFE-005** — Trip creation & packing
  - [ ] Create a trip, optionally seeded from a template
  - [ ] Add/remove/adjust items on a trip independently of its template
  - [ ] Tick items individually; bulk pack-all/unpack-all

### Epic 6: Trip lifecycle

- **PACKFE-006** — Archive & restore
  - [ ] Archive a trip; restore it later
  - [ ] Archived trips listed separately from active ones

### Epic 7: Profile

- **PACKFE-007** — Profile & sign-out
  - [ ] `ProfileScreen.tsx` renders the profile card (avatar, name,
        email, "Signed in with Google" badge) — matches
        `../../profile-page-handoff.html`'s mobile + desktop states
        (screenshotted 2026-07-24). No stats row (Trips/Items/Archived
        counts) — no backend support exists yet; not planned as a
        follow-up unless revisited later.
  - [ ] Shared `Avatar` component (`src/components/ui/Avatar.tsx`):
        renders `user.avatarUrl` as the primary image, falls back to an
        initials circle (via a pure `getInitials(name)` helper) on a
        missing/broken image. Used by both `ProfileScreen` and
        `DesktopSidebar`'s account row.
  - [ ] `getInitials(name)` unit-tested with Vitest, same pattern as
        `useActiveNavKey.test.ts`; the `<img onError>` fallback swap
        itself is presentational — manual verification only.
  - [ ] `Button.tsx` gets a `variant?: "default" | "danger"` prop;
        Sign out uses `variant="danger"` (`--color-notice-bg` /
        `--color-notice-text` tokens)
  - [ ] Sign-out button wired to the existing `useLogout` hook
        (`src/features/auth/useLogout.ts`) — no new redirect logic
        needed, `RequireAuth` already redirects to `/` once
        `isAuthenticated` flips false
  - [ ] Temporary sign-out button + comment removed from
        `TripsScreen.tsx`

### Later / polish

Not tickets yet — a parking lot for things noticed mid-build that aren't
worth stopping for. Promote to a numbered ticket above when you actually
want to do it.

- (empty — add as you go)
