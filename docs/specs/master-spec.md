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
        **Superseded 2026-07-31** by the desktop sticky-rail item further
        down this list — that fix gave Trips' `<main>` its own
        `overflow-y-auto` (matching Templates) and reverted this row back
        to a fixed `h-full`, which handles the divider-height problem more
        robustly than growing the row ever did (the border now always
        matches the row's fixed box exactly, regardless of content
        length, instead of needing to keep pace with growth).
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
  - [x] **[Desktop, Trips]** Unselected rows in the trip rail have no
        border at all (`RailRow`'s `border-transparent` treatment,
        `TripsDesktop.tsx`) while the selected row gets `border-accent`
        — unselected rows need a visible, contrasting border of their
        own so the row shape reads even when nothing's selected. Match
        against the mobile design's treatment of the same state as the
        reference. **Fixed 2026-07-31, developer-confirmed**: `RailRow`
        (`components/detail/RailRow.tsx`) is the shared component behind
        both `TripsDesktop.tsx`'s and `TemplatesDesktop.tsx`'s rails, so
        the fix necessarily applies to both, not Trips alone — matches
        mobile's own `TripListCard`/`TemplateListCard`, which always use
        `border-border` (no selected state exists on mobile, every row
        gets the same neutral border). Changed unselected's
        `border-transparent` → `border-border`; selected's `border-accent
bg-bg` unchanged.
  - [x] **[Mobile, Trips + Templates]** Detail-view header should be
        sticky on scroll — back button, archive, Edit/Done, title, "+
        Add items" (`BackHeader` + `TripDetailHeader`/
        `TemplateDetailHeader` in `TripsMobile.tsx`/`TemplatesMobile.tsx`).
        The progress-info block (packed count/percentage/progress bar,
        `TripProgressCard`) should **not** be part of the sticky region —
        pinning it too would eat too much vertical space for actually
        seeing items while scrolling. **Fixed 2026-07-31,
        developer-confirmed**: split each screen's single flex-column
        detail view into two blocks — a `sticky top-0 z-10 bg-bg` block
        holding `BackHeader` + the detail header, and a normal-flow block
        below it holding the body (progress card + items). Preserved the
        existing `key={id}`-driven remount-on-trip/template-switch
        behavior by keeping the same `key` on the split elements, and kept
        the original vertical rhythm (Trips' 16px header/body gap,
        Templates' tighter 8px one) by moving those gaps into the sticky
        block's own bottom padding.
  - [x] **[Desktop, Trips]** "Edit"/"Done" toggle button
        (`ArchiveButton`'s sibling in `TripsDesktop.tsx`'s/
        `TripsMobile.tsx`'s `BackHeader`/`TripDetailHeader` trailing slot)
        renders unconditionally whenever a trip is selected, even one with
        zero items — nothing to edit yet, so the button shouldn't appear
        until the trip has at least one item (noticed 2026-07-31). Same
        condition `TripDetailBody` already uses to decide whether to show
        `EmptyStatePanel` vs. the real category groups (`total === 0`) —
        reuse that, don't reinvent it. **Fixed 2026-07-31,
        developer-confirmed, desktop only per this item's own tag**: extracted
        `tripItemCount(trip)` (`features/trips/tripItemCount.ts`, new file
        — matches `formatTripDate.ts`'s existing pure-helper/feature-root
        precedent) so `TripDetailBody`'s `total` computation and
        `TripsDesktop.tsx`'s new conditional share one definition instead
        of two independently-written ones; `TripDetailBody` refactored to
        call it (same math, `tsc`/125-test suite confirm no behavior
        change). Edit/Done `Button` now wrapped in
        `tripItemCount(selectedTrip) > 0 &&`. **Not done**:
        `TripsMobile.tsx` has the identical unconditional button in its
        own `BackHeader` trailing slot — same one-line fix would apply,
        left untouched since this item's tag is Desktop-only.
        **Widened same day, two follow-ons from the same conversation**:
        (1) `TripDetailHeader`'s own "+ Add items" button also rendered
        unconditionally, duplicating the CTA `EmptyStatePanel` already
        shows in the zero-items case — same `tripItemCount(trip) > 0 &&`
        guard added there. `TripDetailHeader` is the shared component
        behind both `TripsDesktop.tsx`/`TripsMobile.tsx` (same situation
        as `RailRow` earlier in this ticket), so unlike the Edit/Done
        button above, **this half of the fix applies to mobile too**,
        not just desktop. (2) `isEditMode` could get stuck true across a
        delete-all-then-re-add-items cycle on the same trip (the existing
        reset-on-trip-switch `useEffect` in `useTripsScreen.ts` only fires
        on `tripId` changing, not on item count) — added a second
        `useEffect` there, keyed on `tripItemCount(selected.data)`,
        forcing `isEditMode` false whenever it hits `0`. **Flagged, not
        yet written**: this is real state-transition logic per
        `CLAUDE.md`'s testing section, and `useTripsScreen.test.tsx`
        already exists — a case for this isn't in it yet.
  - [x] **[Desktop, Templates]** Templates' detail pane (including its
        empty state) has diverged from Trips' — it doesn't take the full
        available width like Trips' does (noticed 2026-07-31). **Root
        cause, confirmed by reading current source**:
        `TemplatesDesktop.tsx` wraps its whole detail pane in a
        `max-w-160` (640px) constraint that `TripsDesktop.tsx` has no
        equivalent of anywhere — not a documented/deliberate decision
        (nothing in `templates.md` explains it), just an incidental choice
        from Piece 6 that was never revisited. Aim to replicate Trips'
        already-correct full-width behavior on Templates, i.e. remove or
        widen that constraint, rather than treating this as two designs to
        reconcile. **Widened same day**: developer flagged it's squashing
        more than just the empty state — the whole pane, always, not a
        one-off. **Fixed 2026-07-31, developer-confirmed**:
        dropped `max-w-160` and its accompanying narrow-column padding
        (`px-10 pt-7.5 pb-17.5`) from both split blocks the sticky-header
        item above just created, replacing them with the exact same
        padding Trips uses (`pt-12 pr-12 pb-4` header / `pr-12 pb-12`
        body, no left padding, no max-width) — full 1:1 match with Trips
        rather than a differently-tuned equivalent.
  - [x] The whole app has no maximum width — stretching the browser to
        fill a very wide monitor (e.g. 38") lets the layout stretch
        infinitely rather than capping out (noticed 2026-07-31). An edge
        case, not urgent. Needs a sensible max-width applied somewhere in
        the `AppShell`/route-content chain (`src/components/nav/AppShell.tsx`
        is the obvious candidate — nothing there today) so the app stops
        growing past some reasonable ceiling on very large screens.
        **Fixed 2026-07-31, developer-confirmed**: wrapped
        `<Outlet />` in `AppShell.tsx`'s `<main>` with a
        `mx-auto h-full max-w-[1600px]` div — content centers and stops
        growing past 1600px on very wide viewports, `<main>` itself stays
        `flex-1`/`overflow-y-auto` unchanged so its scrollbar still spans
        the true edge. Kept `h-full` on the new wrapper deliberately: a
        plain `height: auto` block wouldn't give
        `TripsDesktop.tsx`/`TemplatesDesktop.tsx`'s own `h-full` root divs
        a definite height to resolve against (the classic
        percentage-height-needs-a-definite-ancestor gotcha), which would
        have silently broken their layout. 1600px is a first estimate,
        not measured against anything — developer eyeballs/adjusts on an
        actual wide monitor.
  - [x] **[Desktop, Trips + Templates]** Desktop equivalent of the mobile
        sticky-header item above: the rail column (trip/template list,
        `<aside>` in `TripsDesktop.tsx`/`TemplatesDesktop.tsx`) shouldn't
        be scrollable-past just by scrolling a long packing list/template
        in the main pane — it should stay in view (noticed 2026-07-31).
        **Widened same day**: developer clarified this should also cover
        the detail pane's own header (title, "+ Add items", archive,
        Edit/Done), same as mobile — not just the rail.
        **Fixed 2026-07-31, developer-confirmed, two parts**:
        (1) rail — confirmed `TemplatesDesktop.tsx` already behaved
        correctly (its main pane already had its own `overflow-y-auto`,
        capped at the row's fixed `h-full` — the aside never shared a
        scroll container with the overflowing detail content, so it was
        already pinned by construction). Gave `TripsDesktop.tsx`'s
        `<main>` the same `overflow-y-auto` and reverted its outer row
        from `min-h-full` back to `h-full` to match — also supersedes the
        earlier divider-height fix (see that item's own updated note
        above) rather than stacking a second scroll mechanism on top.
        (2) detail header — same split-block technique as the mobile fix:
        `TripDetailHeader`/`TemplateDetailHeader` now sit in their own
        `sticky top-0 z-10 bg-bg` block ahead of the scrolling body.
        `TemplatesDesktop.tsx` needed its accumulated two-layer padding
        (the pane's own `py-12 pr-12` plus the nested `max-w-160` column's
        `px-10 pt-7.5 pb-17.5`) combined into each split block's own
        padding, replicating `max-w-160` on both halves so they stay
        column-aligned — `TripsDesktop.tsx` had no such nesting, simpler
        split.
  - [x] **[Copy]** Trips greeting ("Where to next, {name}?",
        `TripsDesktop.tsx`/`TripsMobile.tsx`) uses the full `user.name`
        from Google sign-in — reads oddly formal/impersonal. Default to
        first name where one can be derived from the full name. **Fixed
        2026-07-31, developer-confirmed**: `user.name.split("
")[0]`, inlined at both call sites (Google's `name` field has no
        separate given/family-name split to read from instead) rather
        than extracting a shared helper for a one-liner used in exactly
        two places.
  - [x] **[Copy]** Templates screen's subtitle "Build once, pack forever."
        (`TemplatesDesktop.tsx`/`TemplatesMobile.tsx`) reads as odd/cringe
        copy — needs replacing. **Fixed 2026-07-31, developer-confirmed**:
        developer picked "Your reusable packing lists." from four options
        (a rhythm-preserving rework of the original, a plain functional
        statement, a warmer benefit-focused line, and this one) offered
        before any change was made.
  - **Loading states — scoped via grill-me, 2026-08-01**, into two
    independent parts after diagnosis showed the originally-reported
    trigger ("click a trip, then click another, get a blank flash") and
    the original backlog framing ("no screen has a designed loading
    pattern") are two different problems, not one:
    - [x] **Part A — query fix (AI-authored, logic not UI).** The
          reported flash isn't a missing loading state at all: `useTrip`/
          `useTemplate` (`src/api/trips.ts`/`templates.ts`) embed the
          selected ID in the query key, so switching selection is treated
          as a brand-new, uncached query even though the trip/template
          was already present in the list data. **Fixed 2026-08-01,
          developer-confirmed**: added `placeholderData: keepPreviousData`
          (TanStack Query v5 API, `^5.101.2` installed; not used anywhere
          else in this codebase yet — a new pattern here, but TanStack's
          own established idiom, not something invented for this) to both
          hooks, so the previously-selected trip/template's content stays
          on screen while the new one loads in the background.
          Already-viewed trips/templates were fine before this (5 min
          `staleTime` cache) and stay fine. Verified live in Chrome:
          clicked between two different trips on the desktop rail,
          content switched cleanly with no blank flash. Suggested test
          opportunity, not yet written (flagged, not gating): a test
          asserting the previous trip's data stays rendered while a
          second trip's fetch is still in flight — genuine new
          conditional/timing behavior, cheap to assert against the
          existing mocked-fetch + real-`QueryClient` test harness already
          used elsewhere in this codebase.
    - [x] **Part B — first-load spinner.** Originally scoped as
          developer-authored per `CLAUDE.md`'s no-design-artifact
          authorship rule (no Claude Design export exists for a loading
          state) — **developer explicitly overrode this** ("you're
          authoring it all not just part a"), same override pattern as
          `DesktopSidebar.tsx` (PACKFE-007). A genuine blank-render gap
          exists on true first load (nothing cached yet), confirmed on
          three screens: Trips blanks the whole screen (`if (isLoading)
return null`), Templates blanks only the list area (header/
          `+ New template` button stay visible), Library blanks only the
          chips+item-groups (header/search stay visible). Profile has no
          query — out of scope. Detail panes' own first-ever load (before
          Part A's cache has anything to show) deliberately left alone:
          happens at most once per session, and detail panes have more
          varied/complex shapes that would need real design effort —
          revisit only if it's actually noticeable in practice, not
          preemptively. **Fixed 2026-08-01, developer-confirmed**: new
          `Spinner` component (`components/ui/Spinner.tsx`) — same
          arc/stroke/accent-color language as `ProgressRing`, but a fixed
          25%-of-circumference arc spun continuously via Tailwind's
          `animate-spin` instead of a percentage-filled one, so it reads
          as "the same visual family" rather than an unrelated spinner.
          Wired into each screen's _existing_ loading-gate boundary
          (`TripsDesktop`/`TripsMobile`'s `if (isLoading) return null` →
          centered `Spinner`; `TemplatesDesktop`/`TemplatesMobile`'s and
          `LibraryScreen`'s `{!isLoading && (...)}` → `{isLoading ? centered
Spinner : (...)}`) — deliberately not restructuring which
          regions each screen blanks, just filling the existing blank
          with a spinner. No minimum-visible-duration/anti-flicker timer —
          spinner syncs directly with `isLoading`; the local API is
          typically near-instant so it may rarely even be visible in
          practice — revisit only if a remote deployment ever makes
          latency (and therefore flicker) a real concern. Verified live in
          Chrome (screen renders correctly, no regressions on the
          list/detail flow) and via the full check suite.
  - [x] Manage-categories modal (`CategoriesModal.tsx`) scrolling UX needs
        improvement (noticed at PACKFE-003 close-out, 2026-07-25) — not
        diagnosed further yet, just flagged. **Fixed 2026-07-31,
        developer-confirmed**: brought in line with the Add-items modal's
        sticky-header pattern — switched to `Modal`'s `size="fixed"`, moved
        the new-category input + Add button out of the footer (removed;
        nothing left to pin there) into a non-scrolling block above the
        list, so only the category rows scroll. Also added a "Show
        built-in (N)" toggle in that same block, off by default, so
        built-in categories (which a user can't rename or delete) don't
        clutter the list — grill-me confirmed: toggle lives in the sticky
        block rather than inline above the scrolling list (mirrors the
        Add-items modal's control grouping over the Trips screen's
        scrolling "Show archived" precedent), and shown categories keep
        the API's existing order rather than being grouped/partitioned.
        `CategoriesModal.test.tsx`'s coverage updated: the old "shows
        Clothing's item count and Built-in badge" test assumed built-ins
        were visible by default, which is no longer true — replaced with
        a test asserting default-hidden state plus both toggle
        directions.
  - [x] Horizontal scroll on the Templates desktop rail (reported
        2026-07-26, developer testing PACKFE-004 Piece 6) — not resolved
        at the time. **Fixed 2026-07-31, developer-confirmed**: root cause
        was never the title/meta text — it was `InteractiveButton`
        (`components/ui/Button.tsx`)'s invisible tap-target-expansion
        `<span className="absolute -inset-2.5">` (added for the 44px
        touch-target guideline), which extends ~10px past every button's
        own box on all sides, including past the rail's scroll container.
        Combined with a real CSS quirk — a container with `overflow-y:
auto` and no explicit `overflow-x` gets that axis silently
        promoted from `visible` to `auto` too — that invisible sliver
        became genuinely scrollable. Confirmed live in Chrome (developer
        first noticed the trackpad "springy"/rubber-band behavior was
        confined to just the row cards, not the whole panel or the
        title/button above them — the key clue that narrowed it to the
        scroll container specifically) via `getComputedStyle` and
        `scrollWidth`/`clientWidth` measurements before touching any code,
        using temporary debug borders/outlines on every layer of
        `TripsDesktop.tsx`'s rail (aside, scroll wrapper, list wrapper,
        row content) plus a visible border/bg on the normally-invisible
        span — all removed again once the cause was confirmed. Fix: added
        `overflow-x-hidden` alongside the existing `overflow-y-auto` on
        the rail's scroll container — correct regardless of the
        invisible-span mechanism, since that container was never meant to
        scroll horizontally. Verified on `TripsDesktop.tsx` first per
        developer's request (simpler case, no `min-w-0`/flex-row
        complications), then applied identically to
        `TemplatesDesktop.tsx` once confirmed. An earlier detour this
        session — suspecting `TemplatesDesktop.tsx`'s baseline-row
        `<span>` (from today's `RailRow`-unification piece) needed
        `min-w-0` to fix `truncate` — was tried, found not to fix it, and
        reverted before this investigation started.
  - [x] **[Desktop + Mobile, Trips + Templates] Clean-up**: `RailRow`
        (desktop-only rail row), `TripListCard` (mobile-only), and
        `TemplateListCard` (mobile-only) were three near-duplicate row
        components — noticed 2026-07-31 while explaining `RailRow` to the
        developer. **Fixed 2026-07-31, developer-confirmed**: merged into
        one `RailRow` (`components/detail/RailRow.tsx`), now used by all
        four call sites. Shell (`leading`, `selected` — desktop only,
        `showChevron` — mobile only, `surface: "raised" | "flush"` for the
        white-card-on-desktop vs. flush-bordered-on-mobile elevation
        difference) is prop-driven; row content is passed as `children` so
        Templates keeps its own baseline-row-plus-description layout
        instead of being forced through a generic `title`/`meta` string
        API — deliberate per-conversation decision over a fully
        data-driven API. Two real fixes landed as a side effect of
        unifying rather than being separately diagnosed: mobile Templates
        rows were missing the chevron mobile Trips rows already had (now
        consistent on both), and mobile Templates' item count moved from
        a bespoke top-right slot next to the title into the meta line,
        matching how desktop already presents it. Trips' content
        (desktop and mobile) was left exactly as-is — developer explicitly
        wanted no change there. `TripListCard.tsx`/`TemplateListCard.tsx`
        deleted; no test files existed for either so no test updates
        needed.
  - [x] **[Mobile, Trips + Templates]** The sticky detail-header work
        earlier in this ticket introduced a regression: content now runs
        under the mobile bottom nav bar instead of stopping above it —
        noticed 2026-07-31. **Fixed 2026-07-31, developer-confirmed**:
        root cause was a known cross-browser quirk (most
        visible on iOS Safari) where a `position: sticky` descendant
        inside a scrolling container can cause that container's own
        `padding-bottom` to be excluded from the scrollable area — real
        content height isn't affected the same way, only padding is. Every
        other mobile screen relies on `AppShell`'s `<main>` padding-bottom
        for tab-bar clearance and was unaffected; only the two detail
        views with sticky headers broke. Fix: `AppShell.tsx` now exports
        two named class constants instead of one inline literal —
        `MOBILE_NAV_CLEARANCE_PB_CLASS` (the existing padding-bottom
        approach, still used by `<main>` itself and every screen without a
        sticky descendant) and `MOBILE_NAV_CLEARANCE_SPACER_CLASS` (same
        value, `h-` instead of `pb-`) — and `TripsMobile.tsx`/
        `TemplatesMobile.tsx`'s detail branches each render an explicit
        spacer `<div>` using the latter at the end of their scrolling
        body, rather than relying on ancestor padding. Extracted to a
        shared constant rather than duplicating the literal a third time,
        since a future tab-bar resize would otherwise need to stay
        manually in sync across three call sites.

## Parked backlog

Active development is paused as of 2026-08-01 — the core feature set
above is functionally complete. What's left is minor polish/UX
follow-ups and process retrospection, deferred indefinitely rather than
tracked ticket by ticket. Full context for each, if ever revisited, is
in `templates.md`/`trips.md` or this file's git history.

- Trip date can't be edited after creation — no affordance anywhere
  edits it once set in the New-trip modal.
- Clean-up: extract a shared rail shell for `TripsDesktop.tsx`/
  `TemplatesDesktop.tsx` (identical `<aside>` structure after PACKFE-010).
- Open question: whether deleting a template a trip was seeded from is
  blocked server-side — never confirmed either way.
- Tech debt: `src/features/templates/` is past the 8-file flat-folder
  threshold (`CLAUDE.md`'s Structure conventions).
- UX: Add-items picker's "Done" button gives no running count of queued
  items.
- Process retro: revisit the grill-me/close-out cadence and whether a
  lighter-weight tests-first approach fits, now that several screens'
  worth of real experience exists.
