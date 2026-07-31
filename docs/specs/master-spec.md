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

**Trimmed 2026-07-31**: this file used to carry the full AC-level decision
trail for every ticket (screenshot-grounding notes, grill-me back-and-forth,
exact class names, dated corrections) inline, and had grown to ~3000
lines of mostly-historical detail. That detail wasn't thrown away — it
moved into one doc per epic in this same folder (`foundations.md`,
`auth.md`, `library.md`, `templates.md`, `trips.md`, `profile.md`,
`shared-ui.md`), each holding that epic's completed tickets verbatim. This
file now stays high-level: goals, architecture facts as they stand today,
and a roadmap that tracks what's done/open with a pointer to the doc that
has the detail. Update the epic docs only when there's new history to
record; update this file when the high-level picture itself changes
(a new epic, a status flip, a genuinely cross-cutting architecture change).

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

No ADRs on this branch — these are stated as facts, decided once and
unchanged since unless noted. Revisit inline in this doc if one stops
fitting. Each epic doc (linked from the Roadmap below) carries the dated
grill-me trail behind these facts, plus feature-specific decisions that
don't belong here.

- **Stack**: React 19, Vite, TypeScript, Tailwind v4, TanStack Query,
  React Router.
- **Routing**: React Router, nested under an authenticated `AppShell`
  (see `foundations.md`). Detail screens (Templates, Trips) are
  route-driven (`/templates/:id`, `/trips/:id`), not local-state-driven —
  see `templates.md`'s "Route-driven template selection" entry for the
  reasoning, which Trips also follows.
- **State**: TanStack Query for server state (all fetch/mutation hooks
  colocated per-entity in `src/api/<entity>.ts`, mirroring
  `packing-list-go`'s structs field-for-field); Context + `useState`/
  `useReducer` for client UI state.
- **Component structure**: feature folders
  (`src/features/{auth,trips,templates,library,profile}/`, flat until 8
  files) + `src/components/`, split by reusability shape rather than
  feature: `ui/` (zero-domain primitives — `Button`, `Modal`, `Toast`,
  `TextField`, etc., see `shared-ui.md`), `nav/` (app-shell navigation,
  see `foundations.md`), `detail/` (composites shaped around the
  recurring list+detail screen pattern shared by Library/Templates/Trips
  — `CategoryGroupCard`, `RailRow`, `QuantityStepper`, etc.). Full rule
  in `CLAUDE.md`'s Structure conventions section.
- **Responsive/breakpoint strategy**: default to one responsive component
  per screen, reflowed with Tailwind breakpoint utilities, when mobile
  and desktop show the same elements just rearranged. Split into separate
  variants sharing logic via a hook (not shared markup) only when a
  breakpoint changes _what's there_ (a different nav pattern, a different
  interaction model). Templates was the first screen to fail that test
  and need a real JS-driven breakpoint switch (`useMediaQuery`); see
  `templates.md`.
- **Shared UI primitives**: `Modal` (mobile bottom-sheet / desktop dialog
  shell, built on `@radix-ui/react-dialog`), `Toast`, `ConfirmDialog`,
  and the `Button`/`TextField`/`InteractiveButton` family live in
  `src/components/ui/`. Full build history and API shape for each in
  `shared-ui.md`.
- **Auth/session**: httpOnly refresh cookie + refresh-on-load, access
  token in memory only, never in a URL or `localStorage`. Has a
  cross-repo dependency on `packing-list-go`. Full build history in
  `auth.md`.
- **API contract**: hand-written types, colocated per-entity with their
  fetch functions in `src/api/<entity>.ts` (e.g. `src/api/categories.ts`,
  `src/api/items.ts`), mirroring `packing-list-go`'s Go structs
  field-for-field, until that project ships an OpenAPI spec.
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

A personal reference, not a ticket-tracking system. Each closed epic
below is a one-line status + a pointer to its doc, which carries the full
per-piece checklist, screenshot grounding, and decision trail. Only Epic 9
(the current, open work) keeps its checklist inline here — that's the
active punch list, so it stays visible without a click-through.

- **Epic 1: Foundations** — PACKFE-001 (App shell & plumbing) — **Done**.
  Full detail: `foundations.md`.
- **Epic 2: Auth** — PACKFE-002 (Google sign-in & session restore) —
  **Done**. Full detail: `auth.md`.
- **Epic 3: Item library** — PACKFE-003 (Categories & items CRUD) —
  **Done** (2026-07-25). Full detail: `library.md`.
- **Epic 4: Templates** — PACKFE-004 (Reusable packing templates) —
  **Done** (2026-07-26); PACKFE-009 (batched item-adding modal) —
  **Done** (2026-07-29). Full detail: `templates.md`.
- **Epic 5: Trips** — PACKFE-005 (Trip creation & packing, absorbs
  PACKFE-006) — **Done** (2026-07-29). Full detail: `trips.md`.
- **Epic 6: Trip lifecycle** — PACKFE-006 (Archive & restore) — **Done**
  (2026-07-29), folded into PACKFE-005. Full detail: `trips.md`.
- **Epic 7: Profile** — PACKFE-007 (Profile & sign-out) — **Done**
  (2026-07-24). Full detail: `profile.md`.
- **Epic 8: Shared UI primitives** — PACKFE-008 (Modal shell component)
  — **Done** (2026-07-24). Full detail: `shared-ui.md`.

### Epic 9: Polish & bug-fix pass

- **PACKFE-010** — Trips/Templates polish + bug fixes (opened 2026-07-31,
  once the core Trips/Templates/Library feature set was functionally
  complete — combines the `[UX polish]` items accumulated in the old
  "Later / polish" parking lot below with a fresh punch list from
  hands-on use). Desktop/mobile called out explicitly per item below so
  the wrong breakpoint doesn't get touched by mistake.
  - [x] **[Desktop, Trips]** The rail/detail divider (`border-r
border-border` on the `<aside>`, `TripsDesktop.tsx`) doesn't run
        the full height of the page — on a packing list long enough to
        scroll, scrolling past the border's own height loses the
        left/right separation entirely. **Fixed 2026-07-31**: the
        `<aside>`/`<main>` row's outer wrapper was `h-full`, which caps
        its height at the initial viewport size — `AppShell`'s `<main>`
        (`overflow-y-auto`) is the real scroll container, so once the
        selected trip's detail content grew taller than that cap, it
        overflowed silently below the row box with no aside/border next
        to it. Changed `h-full` → `min-h-full` so the row (and the
        aside's border, via default `align-items: stretch`) grows to
        match whichever pane is taller instead of being capped.
        Same latent bug exists in `TemplatesDesktop.tsx` (identical
        `h-full` wrapper) — not touched here, out of this item's scope.
  - [x] **[Desktop, Trips + Templates]** Same divider (`TripsDesktop.tsx`
        and `TemplatesDesktop.tsx`, both `border-r border-border` on the
        `<aside>`) doesn't reach the very top or bottom of the page —
        looks like an invisible margin/padding somewhere is holding it
        back short of the viewport edge. **Fixed 2026-07-31, one commit
        across both files**: the culprit was `p-12` on the shared outer
        row wrapper (`<div className="flex ... p-12">`) — since the
        border is drawn on `<aside>`'s own box, an ancestor's padding
        insets that whole box (border included) away from the row's true
        edges. Moved the padding down a level so it insets _content_
        without insetting the border-bearing box itself: outer row lost
        `p-12` entirely; `<aside>` gained `py-12 pl-12` (later corrected to
        `pl-6`, see the item directly below — kept its existing `pr-6`);
        the main pane gained `py-12 pr-12`. Net visual position of all
        existing content is unchanged (same total inset from the page
        edge as before, just contributed by the child instead of the
        parent) — only the border's own extent changed, now running the
        full row height edge-to-edge on both screens.
  - [x] **[Desktop, Trips + Templates]** Rail column's left inset
        (button + rows, both `TripsDesktop.tsx`/`TemplatesDesktop.tsx`)
        was noticeably wider than its right inset before the divider —
        noticed 2026-07-31, right after the divider fix above landed.
        Pre-existing asymmetry, not introduced by that fix: `<aside>`'s
        content had always had 48px on the left (`pl-12`, formerly
        contributed by the outer row's `p-12` before the divider fix
        moved it onto `<aside>` itself) against only 24px on the right
        (`pr-6`, the gap to the divider). **Fixed**: `<aside>`'s `pl-12` →
        `pl-6`, matching `pr-6` — the whole rail column now sits an equal
        24px from both the divider and the page edge. Left the main
        pane's own `pr-12` alone — this item was specifically about the
        rail column's own left/right symmetry, not the two-pane group's
        overall page margins, which the developer didn't flag as an issue.
  - [x] **[Desktop, Trips + Templates]** "+ New trip" / "+ New template"
        button reads too large — too tall, or too much padding between
        the label and the button's own top/bottom edge. Needs a look to
        find the actual cause (height vs. padding) rather than guessing.
        **Fixed 2026-07-31, developer-confirmed**: cause was `Button`'s
        `primary` variant's `py-4` (16px top/bottom) — same variant used
        elsewhere for full-page modal-submit CTAs, too tall for a sidebar
        action button. Added a `primary` entry to `Button.tsx`'s
        `COMPACT_VARIANT_CLASSES` (same `w-full`/color/shape/weight,
        `py-4` → `py-2` after two rounds of feedback) and applied
        `size="compact"` on `TripsDesktop.tsx`/`TemplatesDesktop.tsx`
        only — mobile already uses a different variant (`accent`) for
        this button and was intentionally left untouched.
  - [ ] **[Desktop, Trips]** Unselected rows in the trip rail have no
        border at all (`RailRow`'s `border-transparent` treatment,
        `TripsDesktop.tsx`) while the selected row gets `border-accent`
        — unselected rows need a visible, contrasting border of their
        own so the row shape reads even when nothing's selected. Match
        against the mobile design's treatment of the same state as the
        reference.
  - [ ] **[Mobile, Trips + Templates]** Detail-view header should be
        sticky on scroll — back button, archive, Edit/Done, title, "+
        Add items" (`BackHeader` + `TripDetailHeader`/
        `TemplateDetailHeader` in `TripsMobile.tsx`/`TemplatesMobile.tsx`).
        The progress-info block (packed count/percentage/progress bar,
        `TripProgressCard`) should **not** be part of the sticky region —
        pinning it too would eat too much vertical space for actually
        seeing items while scrolling.
  - [ ] **[Desktop, Trips + Templates]** Desktop equivalent of the mobile
        sticky-header item above: the rail column (trip/template list,
        `<aside>` in `TripsDesktop.tsx`/`TemplatesDesktop.tsx`) shouldn't
        be scrollable-past just by scrolling a long packing list/template
        in the main pane — it should stay in view (noticed 2026-07-31).
        **Context for whoever picks this up**: `TemplatesDesktop.tsx`'s
        main pane already has its own `overflow-y-auto` (self-scrolling,
        capped at the row's height) — on that screen the rail likely
        already stays put, worth confirming first. `TripsDesktop.tsx`'s
        main pane has no independent scroll — the whole page scrolls as
        one unit via `AppShell`'s `<main>`, which is exactly why the
        divider-height fix earlier in this ticket changed the row wrapper
        to `min-h-full` (let the row grow with content so the border keeps
        pace). Giving Trips' main pane its own `overflow-y-auto` (matching
        Templates) would likely solve **both** problems at once — the row
        could go back to a fixed `h-full` (no more need to grow), and the
        aside would naturally stay in view since it'd no longer share a
        scroll container with the overflowing detail content. Worth
        reconciling with that earlier fix when this is picked up rather
        than layering a second, separate scroll mechanism on top.
  - [ ] **[Copy]** Trips greeting ("Where to next, {name}?",
        `TripsDesktop.tsx`/`TripsMobile.tsx`) uses the full `user.name`
        from Google sign-in — reads oddly formal/impersonal. Default to
        first name where one can be derived from the full name.
  - [ ] **[Copy]** Templates screen's subtitle "Build once, pack forever."
        (`TemplatesDesktop.tsx`/`TemplatesMobile.tsx`) reads as odd/cringe
        copy — needs replacing. Not decided yet; candidates to consider
        at pickup: "Pack it once. Reuse it forever.", "Your go-to lists,
        ready when you are.", "Set it up once, grab it every trip."
  - [ ] A real loading-state visual treatment (noticed during PACKFE-003
        Piece 6, 2026-07-25 — first screen to hit this gap). No screen in
        this project has a designed loading pattern yet; screens render
        nothing during their brief fetch window rather than a "Loading…"
        placeholder. Worth designing something real (skeleton rows, etc.)
        now that it recurs across every screen rather than being a
        one-off.
  - [ ] Manage-categories modal (`CategoriesModal.tsx`) scrolling UX needs
        improvement (noticed at PACKFE-003 close-out, 2026-07-25) — not
        diagnosed further yet, just flagged.
  - [ ] `ItemFormModal` closes on successful add — poor for adding several
        items in a row (noticed 2026-07-25: adding many items one at a
        time meant repeatedly reopening the modal). Instead: on
        successful create, keep the modal open and just clear the name
        field (leave the selected category as-is, since consecutive adds
        are often to the same category). Only applies to the create
        flow — edit-mode save should still close as it does now.
  - [ ] Template/trip item notes are read-only (noticed 2026-07-26,
        PACKFE-004's grill-me) — the data model carries them and rows
        display them, but neither design export has an affordance for
        _writing_ one. Needs a design before it can be built.
  - [ ] Horizontal scroll on the Templates desktop rail (reported
        2026-07-26, developer testing PACKFE-004 Piece 6) — not resolved.
        Tried `min-w-0` down the flex chain + `truncate` on `RailRow`'s
        title/meta text, developer still saw it after a hard refresh;
        not reproducible via automated browser testing at
        1600px/1280px/430px with the seed data at the time
        (`scrollWidth === clientWidth` every width tried). Next step: get
        a screenshot or recording of it actually happening rather than
        guessing at more defensive CSS.
  - [ ] A trip's date can't be edited after creation (noticed 2026-07-27,
        PACKFE-005's grill-me) — set once in the New-trip modal, shown
        everywhere, no affordance anywhere edits it afterward. Trip
        detail's Edit mode is the obvious home once this gets designed.
  - [ ] **[Desktop, Trips + Templates] Clean-up**: extract a shared rail
        shell for `TripsDesktop.tsx`/`TemplatesDesktop.tsx` into
        `components/detail/` — the outer flex row, `<aside>`'s classes
        (width, border, padding, header-slot + scrollable-list-slot
        structure) are now identical between the two after this ticket's
        fixes, and three of those fixes had to be pasted into both files
        verbatim in one session (noticed 2026-07-31 — real, demonstrated
        duplication, not speculative). Keep the main/detail pane itself
        un-merged — Templates' pane already self-scrolls with its own
        max-width while Trips' relies on the page-level scroll, a real
        behavioral difference, not just a styling one.
  - **Open question carried over, not yet part of this ticket's scope**:
    whether deleting a template that a trip was seeded from is blocked
    server-side (flagged during PACKFE-004, never confirmed either way —
    see `templates.md`'s Piece 4c entry).
  - **Tech debt carried over, not yet part of this ticket's scope**:
    `src/features/templates/` is at 11 files, past the 8-file flat-folder
    threshold in `CLAUDE.md`'s Structure conventions — a real folder
    split (by concern vs. by shape) is its own decision, not bundled in
    here.

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
