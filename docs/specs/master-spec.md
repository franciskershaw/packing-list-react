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
- **Overlay/dialog primitive** (decided 2026-07-24 during PACKFE-008's
  grill-me): `Modal.tsx` applies the responsive-strategy test above to
  its mobile bottom-sheet vs. desktop centered-dialog shells — same
  content and DOM structure either way, so it's one component switching
  shell classes at the `lg:` breakpoint, not two. Built on
  `@radix-ui/react-dialog` for the behavioral contract (focus trap,
  focus restoration, Escape/backdrop-close, portal-to-body, ARIA)
  rather than hand-rolled, since that contract is exactly the kind of
  thing worth getting from a tested primitive instead of a first pass.
- **Toast/notification primitive** (decided 2026-07-24 during PACKFE-003's
  grill-me): built on `@radix-ui/react-toast` for the same reason as
  `Modal.tsx` above — auto-dismiss timing, ARIA live-region announcement,
  swipe-to-dismiss, and stacking multiple toasts are a behavioral contract
  worth getting from a tested primitive. A single `ToastProvider` mounts
  once near the app root; any screen triggers one via a `useToast()` hook.
  Unlike `Modal`, no design artifact exists for the toast's visual styling
  (no screenshot, no handoff spec beyond a passing behavior mention) — AI
  authored a first pass anyway (sourced from the existing token palette:
  `notice-bg`/`notice-text` for errors), a deliberate one-off exception to
  the "no design artifact → developer authors" rule, same reasoning as
  `DesktopSidebar.tsx` in PACKFE-007. Developer reviews/iterates on the
  styling once built. **Scope decision**: every rejected/blocked action
  surfaces via toast — including duplicate-name conflicts on create/rename
  forms — rather than splitting toast (no-form-context actions) from
  inline field errors (form actions). Simpler for a single-user personal
  app; revisit only if a future screen's forms get complex enough that
  losing the error-to-field association actually causes confusion.
  **Concrete shape** (decided 2026-07-24 during PACKFE-003 Piece 1's
  grill-me): one file, `src/components/ui/Toast.tsx`, exporting both
  `ToastProvider` and `useToast` — matches `Modal.tsx`'s one-file-per-
  primitive precedent despite being provider/hook-shaped rather than a
  single controlled component. Mounted in `App.tsx` alongside
  `AuthProvider` (no ordering dependency between the two). `useToast()`
  exposes a minimal `toast(message: string)` — no `variant` prop yet,
  since this ticket only requires error/rejected-action toasts and no
  second variant is confirmed anywhere in the roadmap; adding one later
  is a deliberate, visible API change, not pre-built now. The queue
  (array of active toasts, `crypto.randomUUID()` ids, no cap on
  concurrent toasts) is hand-rolled state sitting on top of Radix's
  per-toast primitives — same category as `Modal.tsx`'s hand-rolled
  focus-restore in PACKFE-008, so it gets a Vitest test (written first,
  before the provider) rather than being left to Radix's own test
  coverage.
- **Auth/session**: httpOnly refresh cookie + refresh-on-load, access
  token in memory only, never in a URL or `localStorage`. Has a
  cross-repo dependency on `packing-list-go` — check that project before
  starting the sign-in ticket.
- **API contract**: hand-written types, colocated per-entity with their
  fetch functions in `src/api/<entity>.ts` (e.g. `src/api/categories.ts`,
  `src/api/items.ts`), mirroring `packing-list-go`'s Go structs
  field-for-field, until that project ships an OpenAPI spec. Revised
  2026-07-24 during PACKFE-003 Piece 1's grill-me from an earlier plan of
  a single shared `src/api/types.ts` — colocating type + fetch function
  per entity matches the one real existing precedent (`User` in
  `features/auth/api.ts`) and `CLAUDE.md`'s Structure convention (a type
  stays with its data-producing module until it has a real second
  consumer). `Category`/`Item` get the shared `src/api/` location rather
  than staying feature-scoped in `library/` specifically because a real
  second consumer is already confirmed, not speculative:
  `packing-list-go`'s `template_item_handler.go` (`BulkAddItems`) already
  calls `itemRepo.GetItems` with a `categoryId` filter for PACKFE-004's
  item-picker. `User` itself isn't retroactively migrated — it has no
  second consumer. TanStack Query hooks (list + all mutations) live in
  the same per-entity file as their fetch functions, not split out
  separately — keeps query-key ownership next to the invalidation calls
  that reference it. `useItems(params?: { categoryId?: string; search?:
string })` accepts optional server-side filters now (key `["items",
params]`) since the filtered variant's consumer is already confirmed
  above, even though Library's own call stays unparameterized (piece 6
  filters client-side).
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
  - [ ] `src/components/ui/` scaffolded with Button, Badge, Input
        primitives (styling only). Modal split out to PACKFE-008 — bigger
        in scope (new dependency, accessibility contract) than "styling
        only" covers.
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
  - [x] `DesktopSidebar.tsx` renders real content (currently a
        placeholder box) — matches `../../profile-page-handoff.html`'s
        desktop state (screenshotted 2026-07-24): "Pack-It" wordmark (no
        tick icon — deliberate deviation from the design, see
        `LESSONS.md`), Trips/Templates/Library rows via shared
        `navItems.ts`, bottom-pinned account row (avatar + name + email,
        shared `Avatar` component, navigates to `/profile`, highlighted
        via `bg-accent-subtle` when active — same treatment as active
        nav rows). Built alongside PACKFE-007, tracked here since it's
        shell scope, not profile-screen scope.

### Epic 2: Auth

- **PACKFE-002** — Google sign-in & session restore
  - [ ] Sign-in screen matches the design's Google button treatment
  - [ ] Access token held in memory; refresh-on-load restores a session
        without a visible re-login
  - [ ] Protected routes redirect to sign-in when unauthenticated

### Epic 3: Item library

- **PACKFE-003** — Categories & items CRUD ("Library screen")
  - Grilled 2026-07-24 against `../../library-screen-handoff.html` (screenshotted
    the same day) plus 7 supporting screenshots of the live prototype/handoff.
    The most complex screen built so far — real interactivity (two modal
    flows, filtering, category management) — so per `CLAUDE.md`'s AI-authorship
    rule this is broken into sequenced pieces rather than one pass, roughly
    following the handoff's own §4 "suggested build order" but with the
    data/toast layer pulled forward as its own foundation piece first.
  - **Screenshot coverage gaps, resolved during grill-me**: no render existed
    of the new `LibraryItemRow` chevron affordance, the Edit-item modal, or
    the category-rename interaction. Two more screenshots (chevron
    before/after, category-rename-in-place) closed the first and third gaps.
    **The Edit-item modal has no screenshot anywhere and none is obtainable**
    — built instead as an explicit, named inference: the handoff's own text
    says to "extend the existing New-item sheet with an edit mode," so it
    reuses the exact New-item shell (screenshotted), retitled, with the name
    field pre-filled and the matching category chip pre-selected. Agreed:
    **no delete button inside the modal** — delete stays exclusively on the
    row's existing `×` control, which the chevron treatment keeps as-is.
  - **Non-goal, explicitly deferred rather than dropped**: seeding
    `packing-list-go`'s system categories/items. `db/seeds/categories.sql`
    exists but its `ON CONFLICT DO NOTHING` is currently a no-op (no unique
    constraint on `categories.name`, so re-running it duplicates rows), and
    no items seed exists at all. This is Go-side work and that project
    hasn't opted out of the global spec→handoff→tests-first pipeline the way
    this repo has, so it becomes its own small `packing-list-go` ticket —
    addressed when it actually blocks building/testing against real data,
    not folded into this ticket's scope.

  - [x] **Piece 1 — API/data layer + toast foundation.** Pure logic, no
        design artifact needed, unblocks everything below.
    - [x] Fix `lib/api/client.ts`'s `apiFetch` — it currently does
          `await res.text()` for error messages, returning the raw JSON body
          (`{"error":"..."}`) instead of a clean string. Parse the JSON and
          extract `.error`, falling back to a generic message if parsing fails.
          Also fixed a related gap found while building the delete hooks
          below: `apiFetch` unconditionally called `res.json()` on success,
          which throws on the `204 No Content` empty body the Go delete
          handlers return — now short-circuits to `undefined` for `204`.
    - [x] `Category`/`Item` types mirroring `packing-list-go`'s structs,
          colocated per-entity with their fetch functions in
          `src/api/categories.ts` / `src/api/items.ts` (revised from the
          original `src/api/types.ts` plan — see Architecture section above).
    - [x] Fetch functions + TanStack Query hooks for categories/items
          (list/create/update/delete each), with cache invalidation on
          mutations. `useItems(params?: { categoryId?, search? })` supports
          server-side filtering for PACKFE-004's future item-picker; Library's
          own call stays unparameterized (client-side filtering, piece 6).
    - [x] Toast system on `@radix-ui/react-toast` (new dependency) — same
          reasoning as `Modal.tsx`/PACKFE-008: auto-dismiss, ARIA live-region,
          swipe-to-dismiss, and stacking are a behavioral contract worth
          getting from a tested primitive. Single `ToastProvider` near the app
          root (`App.tsx`), `useToast()` hook for any screen to call. See
          Architecture section above for the concrete shape decided during
          this piece's grill-me.
    - [x] Toast visual styling: **no design artifact exists for this** (no
          screenshot, no handoff spec beyond a passing behavior mention) — a
          deliberate one-off exception to "no design artifact → developer
          authors" (same reasoning as `DesktopSidebar.tsx`/PACKFE-007): AI
          drafts a first pass from the existing token palette
          (`notice-bg`/`notice-text`, `border`, `radius-card`), developer
          reviews/adjusts after.
    - [x] **Scope decision**: every rejected/blocked action surfaces via
          toast — delete-in-use, category-has-items, _and_ duplicate-name
          conflicts on create/rename forms. No inline field-level error state
          anywhere in this ticket; simpler for a single-user app, revisit only
          if a future form gets complex enough that this actually confuses.
          Implemented via a shared `useApiMutation` wrapper
          (`src/lib/Tanstack/useApiMutation.ts`) that every category/item
          mutation hook uses instead of `useMutation` directly, firing a
          toast from `ApiError.message` in `onError` — guarantees the
          behavior without repeating the wiring at each of the 8 hooks (or
          each future call site).
  - [x] **Piece 2 — Shared atoms** — **Done** (2026-07-25). Grilled 2026-07-25 against all 7 of
        PACKFE-003's screenshots (mobile anatomy, desktop list, desktop +
        mobile New-item modal, desktop Manage-categories, chevron
        before/after, category-rename-in-place) plus `library-screen-handoff.html`
        §3.2–3.5. `TextField`, `Chip` (filter variant), `SystemBadge`,
        `DeleteIconButton`, plus a new `dashed` variant on the existing
        `Button` (see consolidation note below) — straight into
        `src/components/ui/` (stays flat despite passing 8 files; the
        `src/features/<name>/` 8-file threshold in `CLAUDE.md`'s Structure
        conventions was confirmed feature-folder-specific, not extended to
        `components/ui/`) since each has ≥2 real consumers already (this
        screen + the Manage-categories sheet, some also the future item
        picker).
    - [x] **Chip selected-state conflict, resolved**: the handoff's §3.3
          prose ("solid `heading`-fill/`on-accent`-text") and the mobile
          anatomy screenshot both describe/show a solid dark fill, but
          three other real screenshots — desktop list's active "Clothing"
          chip, and the category-picker chips in both the desktop and
          mobile New-item modals — all show a white bg + `accent`
          (#c65f3d) border/text outline instead. Going with the outline
          treatment: it's consistent across 3 sightings, both breakpoints,
          and two different flows, against 1 sighting for solid-fill. The
          anatomy diagram and handoff prose are treated as the stale
          source here, consistent with `CLAUDE.md`'s screenshot-over-markup
          rule.
    - [x] `Chip`: `{ label: string; selected: boolean; onClick: () => void }`,
          stateless/presentational — selection state lives in the parent
          (filter row or category picker). No count-badge variant; no
          internal responsive behavior (mobile horizontal-scroll vs.
          desktop `flex-wrap` is the containing row's concern, not the
          atom's).
    - [x] **Renamed `SearchField` → `TextField`** during build (2026-07-25):
          re-checking the New-item modal screenshot for the styling
          question showed its "e.g. Bum bag" name field uses the identical
          `bg-subtle`/border/`rounded-xl` treatment as "Search your
          stuff…", for a plain name-entry purpose, not search. The
          component itself has no search-specific behavior (no debounce,
          icon, or clear button — just `value`/`onChange`/`placeholder`),
          so the name now matches what it actually is rather than one call
          site's purpose. Still not built on a generic `Input` primitive
          per se (PACKFE-001's unbuilt "Input primitive" line is
          superseded by naming specific atoms as they're actually
          needed) — `TextField` _is_ that atom, just named for its shape
          rather than left unbuilt.
    - [x] `SystemBadge`: no props beyond standard HTML attrs — literal
          "BUILT-IN" text hardcoded, no variant seen across any of the 4
          screenshots it appears in.
    - [x] `DeleteIconButton`: required `label: string` prop (the
          item/category name), builds `aria-label={`Delete ${label}`}`
          internally — guarantees an accessible name at every call site by
          construction rather than trusting each of the ~2 callers to pass
          one (icon-only button, oxlint's `jsx-a11y` would otherwise flag
          it). 26px circle, `notice-bg`/`notice-text`, "×" glyph. Purely
          presentational — the "blocked, here's the count" rejection-toast
          behavior the handoff mentions already lives in Piece 1's
          `useApiMutation` wrapper, not in this atom.
    - [x] **`DashedAddRow` folded into `Button` as a `dashed` variant**,
          revised during build (2026-07-25) after review: it's an
          action-firing button like `default`/`danger` (no toggle state,
          unlike `Chip`), just visually distinct — exactly what `Button`'s
          existing `VARIANT_CLASSES` pattern exists to express. Raw
          `className` overrides weren't the right mechanism (Tailwind
          resolves same-property conflicts by each utility's position in
          the _generated_ stylesheet, not by source order in the
          `className` string, so passing a conflicting `rounded-*`/`px-*`
          class isn't guaranteed to win without a merge library like
          `tailwind-merge`, not a current dependency). Instead
          `VARIANT_CLASSES["dashed"]` is a fully self-contained class
          string (`w-full rounded-2xl border border-dashed
border-[#c9bba6] py-3 text-sm font-bold text-tertiary`),
          matching how `default`/`danger` already work — `default` and
          `danger`'s own classes were relocated from a shared base string
          into their own complete entries too, byte-identical output, no
          visible change to `SignInScreen`/`ProfileScreen`'s existing
          `Button` usage. `DeleteIconButton` stays its own component (26px
          icon-only circle, no text/children slot — structurally
          incompatible with `Button`'s icon+children layout); `Chip` stays
          separate too (runtime toggle state per the note above, a
          different contract from `Button`'s developer-chosen variant).
          Confirms the Piece 5 note above: the Manage-categories sheet's
          "New category name…" input+button row is a distinct,
          separately-built element, **not** a consumer of the dashed
          variant — it likely reuses `TextField` instead, per the rename
          note above.
    - [x] **Second pass, post-review**: `Chip` and `DeleteIconButton` both
          shipped without `cursor-pointer` — caught by the developer
          twice, independently, direct evidence the "keep them fully
          separate" call above was incomplete. Extracted
          `InteractiveButton`, a shared low-level `<button>` primitive
          (`cursor-pointer`, `type="button"` so nothing built on it can
          accidentally submit a form) — colocated inside `Button.tsx`
          rather than its own file (too small to warrant one), exported
          for `Chip`/`DeleteIconButton` to build on. `Button` itself now
          renders through it too. Considered `tailwind-merge` first to let
          `className` reliably override conflicting base classes;
          rejected — no real case anywhere needed conflict resolution,
          every actual need fit as either a self-contained variant or a
          non-conflicting additive `className`, so the dependency would
          have solved a problem that doesn't exist.
    - [x] No automated tests — all 4 new atoms plus `Button`'s `dashed`
          variant are prop-driven presentational markup with no real
          branching/state, matching `CLAUDE.md`'s testing carve-out
          (suggestion-only, and this doesn't clear the bar for a suggested
          test).
    - [x] Manual verification: temporary demo harness on
          `LibraryScreen.tsx` rendering all 5 pieces with their key states
          (chip selected/unselected, a `mine`- and `sys`-style row each
          with `DeleteIconButton`/`SystemBadge`, `TextField`, `Button
variant="dashed"`) — same precedent as PACKFE-008's throwaway
          "Open modal" trigger. Checked against the source screenshots by
          the developer (2026-07-25) — held up. Demo harness still to be
          removed once Piece 3/6 wire the atoms into the real screen.
  - [ ] **Piece 3 — `LibraryItemRow`** (screenshot-grounded: chevron
        before/after screenshot + handoff §2's code sample). `mine` vs `sys`
        item states; chevron always visible (no hover dependency); row tap
        opens Edit-item modal; `×` delete keeps its own `stopPropagation`;
        row padding `py-3.5` so the tap target clears 44px.
  - [ ] **Piece 4 — New/Edit-item modal content** (screenshot-grounded for
        New; Edit is the named inference above). Built as `Modal` content,
        wired to `POST /items` (create) / `PATCH /items/:id` (edit). Conflict
        (409 duplicate name) surfaces via toast per the scope decision above.
  - [ ] **Piece 5 — Manage-categories modal content** (screenshot-grounded:
        desktop list + rename-in-place screenshots). System categories show
        the `BUILT-IN` badge, non-tappable; user-owned rows tap into an
        inline rename input + `accent-secondary` (green) "Save" button
        (first real use of that token), row's `×` hidden while renaming.
        Persistent "New category name…" + Add row at the bottom — note this
        is a distinct, always-visible input+button, **not** the same
        dashed-border `DashedAddRow` atom used for "+ New item" elsewhere.
        Delete-has-items conflict surfaces via toast.
  - [ ] **Piece 6 — Screen assembly** (screenshot-grounded: mobile anatomy +
        desktop list screenshots). Header/subtitle, search filtering
        (substring match, ANDed with the active chip, not ORed), category
        filter chips (`All` + one per category; horizontal-scroll mobile,
        `flex-wrap` desktop), category group cards (1-col mobile / 2-col CSS
        grid desktop, groups omitted entirely if zero matches after
        filtering — not shown empty), empty-search-results state (centered
        copy + "+ New item" still visible underneath), no true zero-state
        needed (system data always seeds the screen). Wires the `Categories`
        pill to the Manage-categories modal and the dashed row to the
        New-item modal.

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

- **PACKFE-007** — Profile & sign-out — **Done** (2026-07-24)
  - [x] `ProfileScreen.tsx` renders the profile card (avatar, name,
        email, "Signed in with Google" badge) — matches
        `../../profile-page-handoff.html`'s mobile + desktop states
        (screenshotted 2026-07-24). No stats row (Trips/Items/Archived
        counts) — no backend support exists yet; not planned as a
        follow-up unless revisited later.
  - [x] Shared `Avatar` component (`src/components/ui/Avatar.tsx`):
        renders `user.avatarUrl` as the primary image, falls back to an
        initials circle (via a pure `getInitials(name)` helper) on a
        missing/broken image. Used by both `ProfileScreen` and
        `DesktopSidebar`'s account row.
  - [x] `getInitials(name)` unit-tested with Vitest, same pattern as
        `useActiveNavKey.test.ts`; the `<img onError>` fallback swap
        itself is presentational — manual verification only.
  - [x] `Button.tsx` gets a `variant?: "default" | "danger"` prop;
        Sign out uses `variant="danger"` (`--color-notice-bg` /
        `--color-notice-text` tokens)
  - [x] Sign-out button wired to the existing `useLogout` hook
        (`src/features/auth/useLogout.ts`) — no new redirect logic
        needed, `RequireAuth` already redirects to `/` once
        `isAuthenticated` flips false
  - [x] Temporary sign-out button + comment removed from
        `TripsScreen.tsx`

### Epic 8: Shared UI primitives

- **PACKFE-008** — Modal shell component — **Done** (2026-07-24)
  - [x] `Modal.tsx` (`src/components/ui/`) built on `@radix-ui/react-dialog`
        (`Dialog.Root`/`Portal`/`Overlay`/`Content`), matching
        `../../modal-component-handoff.html`'s shell spec (screenshotted
        2026-07-24): one component covers both shells via `lg:`
        breakpoint classes (same DOM, different arrangement, per the
        responsive-strategy test in Architecture below) — mobile bottom
        sheet (`rounded-t-[26px]`, slides up + fades, `pb-11` + safe-area
        inset, `max-h-[78%]`/`h-[80%]` for `size="fixed"`), desktop
        centered dialog (`rounded-[22px]`, scales up + fades, 40px
        page-edge margin, fixed `desktopWidth` per use case)
  - [x] Props: `title`, `subtitle?`, `onClose`, `size?: "auto" | "fixed"`
        (default `"auto"`), `desktopWidth`, `footer?`, `children`, plus
        `showCloseButton?: boolean` (default `true`) — a deliberate
        addition beyond the handoff's spec (which had no close button at
        all); renders as a `lucide` `X` icon button, top-right,
        `aria-label="Close"`, wired to `onClose`
  - [x] Backdrop click closes; inner card click does not propagate
        (Radix default)
  - [x] Escape-to-close (Radix default)
  - [x] Focus trapped while open (Radix default); restored to the
        triggering element on close — **hand-rolled**, not a Radix
        default as originally assumed (see `LESSONS.md`, 2026-07-24, for
        why)
  - [x] `sheetUp`/`modalIn`/`overlayFadeIn` `@keyframes` added to
        `index.css` (first use of `@keyframes` in this codebase),
        applied via arbitrary Tailwind `animate-[...]` per shell.
        `overlayFadeIn` added post-review — the backdrop had no entrance
        animation in the first pass; exit-fade deferred, not in scope
  - [x] `@testing-library/react` added as a dev dependency — first real
        trigger for it per `CLAUDE.md`'s testing section. Vitest + RTL
        cover: backdrop-click closes, inner-click doesn't, Escape
        closes, focus restored on close
  - [x] Temporary throwaway trigger on `LibraryScreen.tsx` ("Open modal"
        button + minimal placeholder content) to prove the shell works
        end-to-end; removed once the first real use case is built
  - [x] Non-goal: the four real use cases (New trip, Add items picker,
        New library item, Manage categories) — shell only, content comes
        later per-feature
  - [x] `master-spec.md`'s Architecture section gets a short note
        recording the one-component-two-shells decision
  - [x] `npm test` script added (`vitest run`)

### Later / polish

Not tickets yet — a parking lot for things noticed mid-build that aren't
worth stopping for. Promote to a numbered ticket above when you actually
want to do it.

- Project-wide close-out once several more screens are built: review the
  development process itself (grill-me/close-out cadence,
  screenshot-grounded AI-authorship rule, ticket-order flexibility) and
  streamline it based on what's actually worked across multiple tickets,
  not just PACKFE-007's single retro. Include a discussion of how to
  practically bring back a test-driven approach — this branch dropped
  tests-first entirely during the process reset, and it's worth
  revisiting whether some lighter-weight version fits now that a few
  screens' worth of real experience exists, rather than assuming the
  original all-or-nothing tradeoff still holds. Not tied to a specific
  epic — revisit when it feels due.
