# Epic 5: Trips (absorbs Epic 6: Trip lifecycle)

Full implementation history for PACKFE-005 (which absorbed PACKFE-006 —
see the merge note under Related architecture decisions below) and the
still-open PACKFE-010 polish/bug-fix ticket lives in `master-spec.md`'s
roadmap, not here — this doc only covers finished, historical work. Split
out from `master-spec.md` on 2026-07-31 — see `foundations.md`'s header
note for why. Also carries the Trips-specific decisions that used to live
in `master-spec.md`'s old Architecture section (the packed-toggle
optimistic-update pattern, the Edit/Done toggle's scope, etc.) — moved
here since they're this screen's decisions, not cross-cutting ones.

### Epic 5: Trips

- **PACKFE-005** — Trip creation & packing (absorbs PACKFE-006, see
  Architecture section's merge note) — **Done** (2026-07-29). Grilled
  2026-07-27 against
  `../../trips-screen-handoff.html` (an unusually thorough handoff — it
  already proposed a 7-piece build order, a component reuse ledger, and
  its own list of open questions) plus 12 fresh screenshots covering
  mobile list/archived/New-trip-modal/detail-view/detail-packing/detail-
  edit, desktop full-shell view + edit, and the existing
  `AddItemsPickerModal` being reused for trip items. The screenshots
  settled two of the handoff's own "design offers two variants" questions
  in favor of its own recommendation (compact ring-rows on both
  breakpoints, not a "bold card" mobile variant; plain checklist rows,
  not a tap-card grid) — no further decision needed on those. Every
  `packing-list-go` API question the handoff flagged as unverified (§00b)
  was answered by reading current source during this grill-me rather than
  guessed — see the Cross-repo gap note in the Architecture section above
  for the full list; only one real gap surfaced (list-endpoint counts,
  same shape as Templates' already-fixed gap), and it blocks only piece 7
  (renumbered 2026-07-29) below, nothing earlier.
  - [x] **Piece 1 — Data layer** — **Done** (2026-07-27). `src/api/trips.ts`, matching
        `templates.ts`'s shape at ~12 hooks. `PackingListDetail` mirrors
        the API's wire shape 1:1 (`categories: [{ id, name, items: [...] }]`,
        already grouped and empty-category-filtered server-side — see
        Architecture section's entry below; no client-side grouping
        anywhere in this ticket). `TRIPS_QUERY_KEY = ["trips"] as const`,
        shared prefix for list and detail alike. `useTrips(archived =
false)` — one hook/fetch-function, boolean param selects
        `GET /lists` vs. `GET /lists?archived=true`, query key
        `[...TRIPS_QUERY_KEY, "list", archived]`; `useTripsScreen` (Piece 3) calls it twice. Detail: `useTrip(id)` (`enabled: !!id`, key
        `[...TRIPS_QUERY_KEY, id]`), create (optional `templateId` +
        `eventDate`), update (name/eventDate), archive (`DELETE
/lists/:id`, variables `{ id }` — no name needed, archive's toast
        copy doesn't interpolate one, unlike `useDeleteTemplate`), restore
        (`POST .../unarchive`, `{ id }`), add-item, update-item
        (quantity/notes/isPacked — one hook, all three optional per the
        real `PATCH` shape), remove-item, bulk-add-items, pack-all,
        unpack-all. **Invalidation, simplified from the original plan
        during implementation**: every trips mutation — trip-level,
        item-level, and packed-state alike — invalidates the bare
        `TRIPS_QUERY_KEY` prefix and nothing narrower. A prefix-match
        invalidate already catches both list variants and every open
        detail query in one call, so there was never a real reason to
        separately target `[...TRIPS_QUERY_KEY, tripId]` — that query's
        key already starts with the prefix. **No `exact: true` anywhere,
        correcting an assumption in the original plan**: `useDeleteTemplate`
        needs `exact: true` because Templates' `DELETE` is a genuine hard
        delete — refetching the deleted template's still-mounted detail
        query would 404. Re-verified against actual Go source while
        implementing this piece: `GetByID`'s own comment says archiving
        "doesn't change whether a list's detail is reachable" — `DELETE
/lists/:id` is a soft delete, so `GetByID` keeps resolving
        correctly for an archived trip. Refetching its detail query on
        invalidate is harmless, not a 404 risk, so the protection
        Templates needed doesn't apply here. Toasts: archive ("Tucked
        away in the archive"), restore ("Back on the board"), create
        (seeded: `` `Seeded from ${template.name}` ``; blank: "A fresh
        trip awaits"). No toast on packed toggle, pack-all,
        quantity, add/remove item, or rename — instantly visible,
        matching Templates' existing reasoning.
    - [x] `features/trips/formatTripDate.ts` (+ test) — feature-root, not
          `api/trips.ts`: a pure formatter with no fetching role, same
          placement pattern as `groupTemplateItems.ts`.
          `formatTripDate(date: string | null)` → `"2 Aug 2026"` (`en-GB`
          day/short-month/year) or `"No date yet"` when null; parses
          date-only strings at midday to dodge timezone-shift bugs.
    - [x] Optimistic packed-toggle (`useUpdateTripItem`): `onMutate`
          snapshots the `[...TRIPS_QUERY_KEY, tripId]` cache entry,
          patches the target item's `isPacked` (or whichever of
          quantity/notes/sortOrder is present) in place inside its
          category's `items` array (immutable copy, not mutated in
          place), rolls back to the snapshot in `onError`, invalidates in
          `onSettled` — see the Architecture section entry above for why
          this can't reuse `useDebouncedQuantity`'s local-draft-state
          approach. `usePackAllTripItems`/`useUnpackAllTripItems` share
          the same optimistic-patch shape (every item's `isPacked` set to
          `true`/`false` at once) via a shared internal
          `useBulkSetPacked` helper, against the real
          `pack-all`/`unpack-all` endpoints (confirmed to exist,
          204/no-body) — no client-side N-PATCH loop. **Required
          extending `useApiMutation`'s generic signature** with a 4th
          `TOnMutateResult` type parameter (defaulted to `unknown`, so
          every existing call site is unaffected) — the wrapper didn't
          thread it through originally since no prior mutation in this
          codebase used `onMutate`; without it, the rollback context
          returned from `onMutate` would type as `unknown` in `onError`/
          `onSettled` instead of `{ queryKey, previous }`.
    - [x] "Reset all" ships with **no** `ConfirmDialog` — consistent with
          the existing non-destructive-actions-don't-confirm line already
          drawn for template item removal (cheap to redo by ticking
          again), matching the handoff's own recommendation. (Decision
          recorded here; the actual button is Piece 4's build.)
    - [x] **Test files**: `formatTripDate.test.ts` (formatting + null
          branch, 2 tests). `trips.test.tsx` (not `.ts` — needs JSX for
          the `QueryClientProvider`/`ToastProvider` wrapper) — first
          trips-api test file, `renderHook` +
          fetch-mocking harness (mirrors `ItemFormModal.test.tsx`'s
          mock-`fetch` shape, cited from its current source). Two cases
          for `useUpdateTripItem`'s optimistic packed-toggle: `isPacked`
          flips in the cache before the mocked fetch resolves and stays
          flipped once it does; a rejected mock fetch rolls the cache
          back to the pre-`mutate` snapshot. The rollback test was
          verified to actually guard the regression — temporarily
          disabled the `onError` rollback, watched that specific test
          fail with the exact reported symptom, then restored it (same
          practice as PACKFE-004 Piece 3's bug-fix test). No coverage
          needed for the other ~10 hooks — thin wrappers over `apiFetch` + `useApiQuery`/`useApiMutation`, already covered by those two
          primitives' own tests, matching `templates.ts`'s existing
          precedent of no per-hook tests. Full suite: 95/95 passing
          (19 files), clean `tsc --noEmit`, clean `oxlint`.
    - [x] **Post-build cleanup, same day**: developer review caught two
          real duplication patterns the first pass missed — the same
          `invalidateQueries({ queryKey: TRIPS_QUERY_KEY })` line repeated
          verbatim across 9 mutations (collapsed into a one-line
          `invalidateTrips(queryClient)` helper), and `useUpdateTripItem`/
          `useBulkSetPacked` duplicating an entire ~25-line
          `onMutate`/`onError`/`onSettled` skeleton, differing only in how
          each patches an item — collapsed into a shared generic
          `useOptimisticTripPatch<TVariables, TData>(mutationFn,
patchItem)`, with `useUpdateTripItem` and `useBulkSetPacked` as
          its two thin call sites. Also trimmed several 2–3 line comments
          to one line each. `src/api/trips.ts`: 410 → 368 lines; re-ran
          the full verification pass (tsc, 95/95 tests, lint, format)
          after.
  - [x] **Piece 2 — Shared-atom changes** — **Done** (2026-07-27). No screenshot review needed
        (behavior/prop changes to shared atoms, verified by re-checking
        Library/Templates render pixel-unchanged afterward, not by a new
        design comparison). **No `groupTemplateItems` promotion** — see
        the Architecture section's entry below: `GET /lists/:id` already
        returns categories pre-grouped server-side, so Trips never calls
        a grouping helper at all. `groupTemplateItems` stays exactly
        where it is, untouched, in `features/templates/`.
    - [x] `CategoryGroupCard` gains `collapsible?`, `expanded?`,
          `onToggle?`, and widens `count` to `number | string` (trips
          pass `"3/7"`). Collapsible header becomes an
          `InteractiveButton` with `aria-expanded` + a `lucide` `ChevronDown`
          rotating 180° via `transition-transform`. **No collapse
          animation** — children are simply conditionally rendered
          (`(!collapsible || expanded) && children`), not height-animated;
          matches `Modal`'s existing precedent of no exit animation
          (`open` is hardcoded `true`, per `LESSONS.md` 2026-07-24) and no
          design artifact specifies a collapse transition. Collapsed state
          lives in `useTripsScreen`, keyed by category id, not persisted.
          Library/Templates keep passing neither prop, unaffected.
    - [x] `CollectionItemRow` gains `onClick?: () => void`, `checked?:
boolean`, and `struck?: boolean` (line-through + `muted` name
          when packed; applies to the name only, not `notes` — confirmed
          against the mobile packing-in-progress screenshot, where
          "Sun cream" is struck but its "Factor 50" note stays plain
          `secondary`). **Two distinct interaction contracts, decided
          2026-07-27 during Piece 2's grill-me** — the handoff's own §3.4
          explicitly left this as a "pick one, don't ship both" question
          that PACKFE-005's original grill-me never actually settled:
          when `checked` is passed (the trip row), the row is
          `role="checkbox" aria-checked={checked}`, keyboard responds to
          **Space only** — matches the WAI-ARIA APG Checkbox Pattern and
          native `<input type="checkbox">` exactly, since this is a
          persistent boolean toggle, not an "activate an action" like
          `LibraryItemRow`'s click-to-edit. When `checked` is omitted
          (every other consumer — template rows, picker rows), the row
          keeps today's `role="button" tabIndex={0}` + Enter/Space
          `onKeyDown` (`LibraryItemRow`'s pattern, same accepted
          `jsx-a11y` warnings) — those _are_ genuine activate-an-action
          clicks, so `role="button"` is the correct mapping for them.
          `PackedCheckbox` stays a purely decorative `aria-hidden` span
          either way — the row itself owns the checkbox semantics. Ships
          one accepted `jsx-a11y(no-static-element-interactions)`
          warning — oxlint's shallow AST check can't confirm the
          `role`/`aria-checked`/`tabIndex` ternaries always resolve
          together when `onClick` is truthy (they do), same accepted
          category as `ConfirmDialog`'s wrapper div.
    - [x] `RailRow` gains `leading?: ReactNode` (the progress ring),
          `flex items-center gap-3` + `min-w-0 flex-1` text column.
          Templates passes nothing, renders identically. **Horizontal-
          scroll re-check**: applied the same `min-w-0 flex-1` defensive
          wrapping the parked bug's own notes describe: static analysis
          only (`tsc`/tests/lint), since this project's dev-server
          ownership convention means AI doesn't run/drive the browser —
          developer to confirm at a narrow desktop width per that "Later
          / polish" entry when next running the app.
    - [x] `BackHeader` gains `trailing?: ReactNode`, `label` becomes
          optional (trip detail's mobile header: back circle · spacer ·
          archive circle · Edit/Done pill, no eyebrow label — `trailing`
          content right-aligned via `ml-auto`). Template detail passes
          neither, unaffected.
    - [x] `TextField` gains `type?: "text" | "date"` (default `"text"`)
          and an optional `id` (forwarded straight to the `<input>`) —
          **not** a `label` string prop, decided 2026-07-27 during Piece
          2's grill-me: the New-trip modal's "When" field is the first
          `TextField` with a genuinely visible section label above it
          (checked against `ItemFormModal.tsx`'s current source — its
          `TextField` has no visible label at all today, `aria-label`
          derives entirely from `placeholder`). Per WCAG 2.5.3 (Label in
          Name), once a visible label exists it should be the accessible
          name via real association, not duplicated into a second
          hardcoded string that can drift out of sync. `NewTripModal`
          (Piece 7) renders its own `<label htmlFor="trip-date">When</label>`
          — same uppercase-section-label markup the design already calls
          for — pointing at `id="trip-date"` on the `TextField`. Every
          existing call site (no `id` passed) is unaffected, keeping
          today's placeholder-as-`aria-label` behavior exactly as-is.
    - [x] New `detail/ProgressBar { packed, total }` (7px track, accent
          fill on `#F0E6D6`, radius `full`, `transition-[width]
duration-[350ms]`) and `detail/ProgressRing { packed, total,
size = 34 }` (two SVG circles, r=13, 3.5px stroke,
          `stroke-linecap="round"`, rotated −90° via `-rotate-90`, fixed
          `viewBox="0 0 34 34"` so `size` scales the whole rendering
          proportionally). Both take counts, not a percentage — rounding
          lives in one place. Both `aria-hidden` — adjacent text always
          states "n of m packed". **`total === 0` clamps to 0%** (empty
          trip), not a `NaN` from `0/0` — the only mobile-list `8px`
          variant the handoff mentioned was the "bold card" style the
          screenshots already ruled out (§5), so `ProgressBar` only has
          one real consumer/height, no size prop needed.
    - [x] New `detail/PackedCheckbox` (26px circle, `#D8CBB6` outline →
          filled `accent-secondary` + `lucide` `Check` in `text-on-accent`
          when packed — same cream-on-green pairing already established
          for `Avatar`/`Toast`'s success variant): a non-interactive
          `aria-hidden` span, with the row itself carrying `role="checkbox"
aria-checked` — chosen over a nested interactive control since
          the row already owns click/
          keyboard semantics via `CollectionItemRow`'s new `onClick`.
  - [x] **Piece 3 — Route + breakpoint split** — **Done**, checkbox
        corrected 2026-07-29 (was built 2026-07-28 but never ticked off —
        the session moved straight into add-items territory afterward,
        discovered the PACK-035 gap, and never came back to close this
        piece out formally). `/trips/:tripId` route. `useTripsScreen()`
        (flat return shape, mirroring `useTemplatesScreen`): `trips,
archivedTrips, isLoading, selectedTripId, selectedTrip,
isSelectedLoading, selectTrip, goToList, archiveTrip,
restoreTrip, isNewTripOpen/openNewTrip/closeNewTrip,
isAddItemsOpen/openAddItems/closeAddItems,
showArchived/toggleArchived, isEditMode/toggleEditMode` + test
        (`MemoryRouter` + `QueryClientProvider` harness, same precedent as
        `useTemplatesScreen.test.tsx`). `isEditMode` and the
        collapsed-group set both live here, both reset on trip switch (key
        the detail block by trip id, as Templates already does).
        `TripsMobile`/`TripsDesktop` (in `features/trips/components/` —
        see Architecture section's folder-split note) with placeholder
        detail bodies wired to real create/archive so both loops prove out
        end-to-end. `TripsScreen` stays a pure breakpoint switch
        (`useMediaQuery(DESKTOP_QUERY)`) + the two modals mounted once,
        gated on hook state — same shape as `TemplatesScreen`.
        **`isEditMode`/`toggleEditMode` are not dead code** despite the
        2026-07-29 architecture change below — narrower job, but a real
        one (see that entry).

  **Resequenced 2026-07-29** (this session, replacing the original
  Piece 4→7 order below): the previous attempt worked through pieces in
  their original numeric order and got tangled trying to build
  add-items behavior (a Piece 5 concern) before Piece 4's real detail
  view even existed to test against — there was no real screen to look
  at, which is part of how the PACK-035 gap went undiscovered until it
  became a real problem. Explicit process request this session:
  prioritize a working new-trip-creation flow and add-items ahead of
  detail/list polish, so there's real, visually-checkable trip data to
  build the rest against sooner. New order: add-items → new-trip modal
  → detail rows/header rebuild → list/rail + lifecycle polish. Piece
  numbers below reflect the new order, not the original one.

  - [x] **Piece 4 — Add items** — implemented 2026-07-29, manual
        verification confirmed 2026-07-31 (see the checklist below). No new screenshot review
        needed (reuses `detail/AddItemsPickerModal` exactly as built for
        Templates, already screenshot-grounded there — see PACKFE-009).
        Testable immediately against the existing Piece-3 placeholder
        detail body, per this session's reordering.
    - [x] **Fixed `api/trips.ts`'s dead `bulkAddTripItems`/
          `useBulkAddTripItems`** before building anything else —
          confirmed zero call sites (per PACK-035's own audit), still
          targeting the deleted categoryId `POST` endpoint. Replaced with
          `bulkUpdateTripItems`/`useBulkUpdateTripItems` against
          `PATCH /lists/:id/items/bulk`, mirroring
          `bulkUpdateTemplateItems`/`useBulkUpdateTemplateItems`
          (`api/templates.ts`) exactly — same delta contract, same
          `{ items: [{ itemId, quantity }] }` shape. No breaking-change
          risk (confirmed no live caller existed), unlike Templates' own
          fix.
    - [x] `TripAddItemsModal` (`features/trips/components/`) — thin
          adapter over `detail/AddItemsPickerModal`, mirroring
          `TemplateAddItemsModal` exactly (`useItemsDraft` + `onDone`
          flushing via `useBulkUpdateTripItems`, closing only on success,
          no-op close on an empty delta). `trip.categories.flatMap(c =>
c.items)` flattens the pre-grouped wire shape into
          `useItemsDraft`'s flat `{ itemId, quantity }[]` input; the delta
          it produces back out is the same flat shape either way.
    - [x] **Temporary, this piece only**: plain `+ Add items` button added
          to `TripsDesktop`/`TripsMobile`'s placeholder detail body (opens
          `screen.isAddItemsOpen`, mirroring Piece 3's existing
          throwaway-button style) plus a bare, unstyled item list
          (`selectedTrip.categories.map(...)` → per-category `<ul>` of
          `name ×quantity`, no `CategoryGroupCard`/checkbox/stepper) so
          adds are actually visually confirmable. Both to be replaced
          wholesale by Piece 6's real `TripDetailHeader`/`TripDetailBody`.
    - [x] Manual verification (developer): add several items with varying
          quantities via search, via "+ All [Category]", and via "create
          & add," hit Done, confirm exactly one network request fires and
          the bare item list reflects everything added. Confirmed
          2026-07-29.
  - [x] **Piece 5 — New-trip modal + wiring the Templates stub** —
        implemented 2026-07-29, manual verification confirmed 2026-07-31
        (see the checklist below). Screenshot-grounded: mobile + desktop New-trip modal
        screenshots (reviewed 2026-07-27, re-confirmed this session).
        Pulled forward from its original last-piece position so real,
        nameable/dated trips (optionally seeded from a template) exist for
        the rest of this ticket's manual testing, instead of the
        Piece-3 placeholder's hardcoded "Untitled trip." No shared
        "selectable stacked row" primitive extracted for the Start-from
        list — plain `<button>`s with inline Tailwind, single call site,
        matching the row-shape reuse already established (`border-accent
bg-bg` selected / `border-border bg-bg` unselected, same convention
        as the rail's selected-row treatment) rather than a pixel hunt
        against the screenshot's subtle tint.
    - [x] `NewTripModal` (`features/trips/components/`, `Modal
desktopWidth="lg:w-[460px]"`, reused as-is): Name (`TextField`,
          placeholder "e.g. Cornwall camping"), When (`TextField
type="date"`), Start-from — radio-semantics stacked rows ("Start
          from scratch" + every template with `` `${itemCount} items` ``
          right-aligned, always exactly one selection, default "Start from
          scratch" or the incoming preselected template). Submit disabled
          on blank name (no suffixing needed — lists have no
          duplicate-name constraint, confirmed server-side). Full-width
          accent "Create trip". Replaced Piece 3's throwaway inline
          `Modal` + "Create untitled trip" button in `TripsScreen.tsx`
          wholesale.
    - [x] On success: close, invalidate the list, navigate to
          `/trips/:newId` (mobile pushes detail; desktop lands with the
          new row selected — one route-driven behavior covers both, no
          breakpoint-specific branching needed), toast per Piece 1.
    - [x] Wired `TemplateDetailBody`'s "Use for a new trip" (was
          `toast("Trip creation is coming soon")`) to navigate to
          `/trips?new=<templateId>`; `useTripsScreen` reads the param,
          opens the modal with that template preselected via new
          `preselectedTemplateId` state, then clears the param
          (`setSearchParams(..., { replace: true })`) so it doesn't
          reopen on refresh/back-nav — `closeNewTrip` also resets
          `preselectedTemplateId` so a later plain "+ New trip" open
          doesn't inherit a stale preselection. Two new
          `useTripsScreen.test.tsx` cases cover this (open+preselect+
          param-clear; close clears the preselection) — real new
          conditional logic, not thin wiring, per this project's testing
          policy.
    - [x] Manual verification (developer): create a trip from scratch
          with a name/date and one seeded from a template, confirm both
          land on `/trips/:newId` selected; confirm "Use for a new trip"
          on a template's detail page opens the New-trip modal with that
          template pre-selected.
  - [x] **Piece 6 — Detail rows/header rebuild** — implemented 2026-07-29,
        manual verification confirmed 2026-07-31 (see the checklist below). Screenshot-grounded:
        mobile detail-view-mode + packing-in-progress + detail-edit-mode
        screenshots, desktop full-shell view-mode + edit-mode screenshots
        (all reviewed 2026-07-27, re-grounded this session against the
        edit-mode-scope change below). Built against real trips/items from
        Pieces 4–5, replacing their bare placeholder body wholesale.
    - [x] **`isEditMode`'s scope, settled this session after real back-
          and-forth** (see Architecture section's full entry): the toggle
          controls a row's leading+trailing pair together — packing mode
          is `PackedCheckbox` (click toggles packed, optimistic per Piece 1) + read-only `×N` badge (only shown when `quantity > 1`);
          edit/removal mode is a delete cross (`DeleteIconButton
confirm={false}`) + a live `QuantityStepper`
          (`useDebouncedQuantity`, same per-row-debounce precedent as
          `TemplateItemRow`) — `TripItemRow`
          (`features/trips/components/`) branches on `isEditMode` between
          the two full row shapes rather than conditionally assembling one.
          **Title and "+ Add items" are both always-on regardless of
          mode** — title via `InlineEditableHeading` (Templates' exact
          pattern, one `PATCH` per change, no `isEditMode` gating; date
          line is static, matching the ticket's own non-goal that dates
          aren't editable), "+ Add items" a permanent `variant="accent"`
          `Button` owned by `TripDetailHeader` itself. The empty-trip
          `EmptyStatePanel`'s own CTA still opens the picker directly,
          unaffected.
    - [x] **Mobile is two rows, not one — clarifying the original piece
          text's literal "back circle · spacer · archive circle ·
          Edit/Done pill · + Add items" description**: mirrors Templates'
          actual established structure exactly (`BackHeader` as its own
          row, a separate title+button row below), not five controls
          crammed into a single row. `BackHeader`'s existing `trailing`
          slot carries the archive circle + Edit/Done pill;
          `TripDetailHeader` (title/date/"+ Add items") sits on the row
          below it — same division `TemplatesMobile.tsx` already uses for
          `BackHeader` + `TemplateDetailHeader`. Desktop has no
          `BackHeader` (persistent rail instead, same as Templates), so
          archive+Edit/Done pill pass into `TripDetailHeader`'s own new
          `trailing?: ReactNode` slot instead, landing inline with the
          title as the screenshots show.
    - [x] New `ArchiveButton` (`features/trips/components/`, 36px neutral
          circle + `lucide` `Archive`, matching `BackHeader`'s own
          back-button circle styling) — genuine second consumer
          (`TripsMobile`/`TripsDesktop` both need the identical control),
          not a premature extraction. Edit/Done pill itself stays inline
          (`Button variant="outline"`) in both call sites — trivial enough
          not to warrant its own wrapper.
    - [x] **Verified against the actual recorded decision, not just
          present-but-unused code**: `Button.tsx` has an unused
          `size="split"` variant pair (`success`/`default`) that looks
          purpose-built for a `Pack it all`/`Reset all` pairing, but the
          Architecture section's own dated entry explicitly settled on
          plain `success` + `default size="compact"` instead (accepted as
          "close enough" over adding a new variant). Built `new
TripProgressCard` (`features/trips/components/`) against that
          recorded decision, not the tempting-looking unused code.
    - [x] `TripDetailHeader` (`components/detail/`, mirrors
          `TemplateDetailHeader`'s file placement — entity-specific but
          part of the shared list+detail shape): title + static date line + always-on "+ Add items", `trailing?: ReactNode` slot for
          archive/Edit-pill on desktop. No "TRIP" eyebrow anywhere.
    - [x] `TripDetailBody` (`features/trips/components/`, matching
          Templates' precedent in structure, **not** in data shape — maps
          `trip.categories` directly, no grouping helper call, see Piece
          2's note above): `TripProgressCard` ("n of m packed" + `%` +
          `ProgressBar` + Pack-it-all/Reset-all — visible regardless of
          `isEditMode`, unaffected by the row-shape toggle), all-packed
          banner (only `total > 0 && packed === total`, packing mode only
          — `#E9EFE3` bg, `accent-secondary` border, "All packed! Have a
          great trip."), collapsible category groups (`"3/7"` counts) of
          `TripItemRow`.
    - [x] Empty-trip dashed panel (`EmptyStatePanel`, reused as-is) when
          the trip has no items, its CTA opening the add-items picker.
    - [x] Desktop no-selection pane: centred "Pick a trip" / "Pick one on
          the left to start packing." — distinct from loading (`isSelectedLoading` short-circuits to `null`, matching
          `TemplatesDesktop`'s exact handling).
    - [x] Removed Piece 4's temporary bare item list and placeholder
          "+ Add items" button from both `TripsMobile`/`TripsDesktop`. The
          no-selection **list** body (left rail/mobile list) is still
          Piece 3's placeholder, untouched — that's Piece 7's job, not
          this piece's.
    - [x] Manual verification (developer): toggle Edit/Done and confirm
          every row swaps shape together (checkbox+badge ↔ cross+
          stepper); tick items packed and confirm the progress
          card/all-packed banner update optimistically; edit the title
          inline; confirm "+ Add items" and the empty-trip CTA both open
          the picker in both modes; check the desktop no-selection pane
          and mobile back/archive/Edit-pill row.
  - [x] **Piece 7 — List/rail assembly + lifecycle** (absorbs PACKFE-006)
        — implemented 2026-07-29, manual verification confirmed 2026-07-31
        (see the checklist below). Screenshot-grounded: mobile list + archived-section
        screenshots, desktop rail screenshots. **Raised/landed the
        `packing-list-go` `ItemCount`/`PackedCount` gap as its own ticket
        first** (PACK-036, done — see that repo's
        `docs/handoffs/PACK-036.md`), before writing any frontend code
        here, per this piece's own stated blocker.
    - [x] `api/trips.ts`'s `PackingList` gains `itemCount`/`packedCount`
          (list-mode-only, matching PACK-036's response shape).
    - [x] New `TripListCard` (`features/trips/components/`, mirrors
          `TemplateListCard`'s mobile-card-button shape — Templates
          already splits mobile-card vs. desktop-rail into two
          components, not one shared shape, so this follows that same
          division rather than reusing `RailRow` on mobile too):
          `ProgressRing` leading + name/meta + trailing `ChevronRight`
          (not in `TemplateListCard`, since mobile trip rows navigate
          into a fresh screen rather than just re-selecting in place).
          Desktop rail reuses `RailRow` + `leading` `ProgressRing`,
          `selected = border-accent bg-bg` (unchanged from Templates').
    - [x] New `ArchivedTripRow` (`features/trips/components/`): name/meta,
          non-tappable, trailing `Button variant="success"` "Restore"
          pill — the row itself carries no `onClick`, unlike
          `TripListCard`.
    - [x] New `sortTripsByDate` (`features/trips/`, + unit test — real
          branching worth covering per this project's testing policy:
          ascending by date, undated last, non-mutating) applied to the
          **active** list only inside `useTripsScreen`; archived trips
          keep the backend's own `archived_at DESC` order as-is (most
          recently archived first makes more sense there than a
          date-in-the-future re-sort).
    - [x] Archived section: bare-text toggle (`"Show archived
(1)"`/`"Hide archived (1)"`, hidden when none — both
          `TripsMobile`/`TripsDesktop`), expanded rows render
          `ArchivedTripRow`.
    - [x] Zero-trips state: `EmptyStatePanel` ("Nowhere to be?" / "Start a
          list anyway — future you says thanks."), same CTA on both
          breakpoints, header subtitle also switches to "A blank slate."
          alongside it (confirmed by the mobile zero-state screenshot —
          both texts render together, not one or the other).
    - [x] Archive action — already wired in Piece 6 (`useTripsScreen`'s
          `archiveTrip` navigates to `/trips` on success via
          `useArchiveTrip`'s existing toast + invalidate); nothing new
          needed here.
    - [x] Loading treatment: unchanged existing precedent, already
          satisfied by Piece 6's `isLoading`/`isSelectedLoading` handling
          — no new loading state introduced by the list/rail work.
    - [x] Greeting header: `` `Where to next, ${user.name}?` `` (via
          `useAuth()`) / `"Your trips"` fallback, subtitle pluralizing
          trip count (`"1 trip in the works."` / `"N trips in the
works."`), both `TripsMobile`/`TripsDesktop`.
    - [x] Removed every remaining Piece 3 placeholder — the `<ul>`/plain
          `<button>` rail/list markup is gone from both breakpoints.
    - [x] Manual verification (developer): confirm mobile/desktop trip
          rows show real rings and counts from PACK-036; confirm sort
          order (create a dated + an undated trip, confirm undated sorts
          last); toggle archived and confirm Restore moves a trip back to
          the active list; confirm the zero-trips empty state and CTA on
          both breakpoints; confirm the greeting header/subtitle render
          correctly signed in.
  - **Explicit non-goals, decided during this grill-me**: no delete-trip
    affordance anywhere (archive is the only exit, matching the backend —
    `DELETE /lists/:id` **is** archive, there's no separate hard-delete
    endpoint); no confetti (the all-packed banner already delivers the
    moment; noted as a possible future delight-pass, not built); date is
    not editable after trip creation (a real gap, no design exists for
    it — logged in "Later / polish" below); item notes stay read-only
    (same shared gap as Templates — no design exists for writing one).

### Epic 6: Trip lifecycle

- **PACKFE-006** — Archive & restore — **Done** (2026-07-29). Folded into
  PACKFE-005's Piece 7 (renumbered 2026-07-29 — see that ticket's header
  note and the Architecture section's merge decision) rather than built
  as a separately sequenced ticket — closes the same day PACKFE-005 does.
  - [x] Archive a trip; restore it later — built in PACKFE-005 Piece 7
  - [x] Archived trips listed separately from active ones — built in
        PACKFE-005 Piece 7

## Related architecture decisions

Moved here from `master-spec.md`'s old Architecture section.

- **Superseded 2026-07-29 (this session)** — see the entry below,
  "Edit/Done toggle narrows to row shape only." Kept here, struck through
  in spirit rather than deleted, as the record of what changed and why:
  ~~Trip detail's Edit/Done toggle controls title editability, not
  `InlineEditableHeading`~~ (decided 2026-07-27 during PACKFE-005's
  grill-me, reversed once mid-interview): the design handoff's own §4.1
  recommended reusing Template detail's always-editable inline-heading
  pattern for consistency, and the fresh screenshots show the literal
  design (Edit mode swaps the title into a filled `TextField`-styled
  input; Done mode shows plain static text) without settling which one
  should ship. Landed on the literal design: template detail is
  essentially always in edit/curate mode, so an always-editable title fits
  it; trip detail's primary mode is checking things off, so the title
  becomes editable only when the same toggle that swaps item rows into
  remove+stepper mode is on. One toggle, one meaning ("edit mode for this
  trip"), covering both the title and the rows — `TripDetailHeader` owns
  `isEditMode` (sourced from `useTripsScreen`) directly; no
  `useInlineEditableField` reuse on this screen.

- **Edit/Done toggle narrows to row shape only; title and "+ Add items"
  both become always-on, like Templates** (decided 2026-07-29, follow-up
  session to PACKFE-005's original grill-me — see the "Flag for a later
  session" note this replaces, further down this section). Real back-
  and-forth during this session's interview, worth recording plainly: the
  developer first asked to drop `isEditMode` entirely (title always-
  editable, add-items always visible, checkbox+stepper co-existing on
  every row, no toggle at all); then reconsidered — a toggle is still
  useful, but only to swap a row's leading control between a `PackedCheckbox`
  (packing mode) and a delete cross (removal mode); then reconsidered once
  more to land here: **the toggle keeps controlling the row's full
  leading+trailing pair together** — `PackedCheckbox` + read-only `×N`
  badge (packing mode) vs. delete cross + live `QuantityStepper` (removal/
  edit mode) — which is actually the _same row-shape switch the original
  2026-07-27 decision already had_. What actually changed, net of all the
  back-and-forth: **title editability and "+ Add items" visibility both
  come out from under the toggle** — both always-on regardless of mode,
  matching Templates — where the original decision gated all three (title,
  add-items, row shape) behind one flag. `useTripsScreen`'s already-built
  `isEditMode`/`toggleEditMode` (Piece 3) turns out **not** to be dead
  code after all — it survives, just with a narrower job and fewer
  consumers (`TripItemRow` only; `TripDetailHeader`'s title and
  add-items button stop reading it).

- **Packed toggle uses an optimistic `onMutate`/`onError`/`onSettled`
  cache patch — the first real use of this pattern in the codebase**
  (decided 2026-07-27, PACKFE-005's grill-me): `useDebouncedQuantity`
  (PACKFE-004 Piece 4b) deliberately used row-local draft state instead,
  because a stepper's effect is confined to its own row. That reasoning
  doesn't transfer here — ticking one item must instantly move the
  progress bar, the percentage, the "n of m packed" line, the group's
  `3/7` count, the rail row's `ProgressRing`, and possibly the all-packed
  banner, all of which read from the trip detail query, not the row. So:
  snapshot → optimistic patch → rollback in `onError`, invalidate in
  `onSettled`, one `PATCH` per tap (a tap is a discrete intent, unlike a
  quantity burst — no debounce). "Pack it all"/"Reset all" reuse the same
  patch shape against the dedicated `pack-all`/`unpack-all` endpoints
  (confirmed to exist server-side, see the Cross-repo note below — no
  N-PATCH fan-out needed). Gets two tests: optimistic-then-confirmed and
  rollback-on-error — the first real branching test for this mechanism.

- **Cross-screen New-trip modal opens via a `/trips?new=<templateId>`
  search param, not a context/provider** (decided 2026-07-27, PACKFE-005's
  grill-me): Template detail's "Use for a new trip" button (currently a
  stub toast) needs to open Trips' New-trip modal with that template
  preselected, but the modal's state lives in `useTripsScreen`, which only
  mounts on the Trips screen. `TemplateDetailBody` navigates to
  `/trips?new=<templateId>`; `useTripsScreen` reads the `new` search param
  on mount and opens the modal itself. Rejected lifting modal state to an
  app-wide context/provider as more architectural surface than this single
  cross-screen use case deserves.

- **`TripProgressCard`'s bulk-action buttons reuse existing `Button`
  variants as-is** (decided 2026-07-27, PACKFE-005's grill-me): the design
  shows solid-green/outline buttons at `radius-10`, matching neither
  `success` (a compact pill) nor `default size="compact"` exactly for
  "Reset all." Accepted the close-enough existing pair (`success` /
  `default size="compact"`) rather than adding a new self-contained
  variant pair for a few px of radius — consistent with this project's
  existing bias toward reusing variants over one-off additions once
  something is "close enough" side-by-side with the rest of the screen.

- **Trip list is sorted client-side, date ascending, undated last**
  (decided 2026-07-27, PACKFE-005's grill-me): neither design export
  sorts the list, and `GetPackingLists` (`packing-list-go`,
  `internal/repository/packing_list.go`) orders by `updated_at DESC` —
  confirmed by reading current source, not assumed — which has no
  relationship to trip chronology. `useTripsScreen` re-sorts the fetched
  list client-side rather than requesting a backend change; NFRs already
  rule out pagination/large-list concerns for a single-user app, so a
  client-side sort has no real cost.

- **`features/trips/` splits into a `components/` subfolder from the
  start** (decided 2026-07-27, PACKFE-005's grill-me): ~11 files
  (`TripsMobile`/`TripsDesktop`, `TripDetailHeader`/`Body`,
  `TripItemRow`/`TripEditItemRow`, `TripListCard`, `NewTripModal`,
  `ArchivedTripRow`, `TripAddItemsModal`) is past the 8-file flat-folder
  threshold before a line of code is written, so the split is decided up
  front rather than mid-ticket. `TripsScreen.tsx` and `useTripsScreen.ts`
  (+ its test) stay at the feature root, matching
  `TemplatesScreen`/`useTemplatesScreen`'s precedent; everything else
  goes in `features/trips/components/`.

- **PACKFE-005 and PACKFE-006 are built as one piece of work, not
  sequenced** (decided 2026-07-27, PACKFE-005's grill-me, per the design
  handoff's own §4.5 flag): PACKFE-005's trip list can't ship silently
  hiding archived trips with no way to see them, so the archive action,
  restore action, and archived section are built together with the
  list/rail-assembly piece rather than deferred to a separate follow-on
  ticket. PACKFE-006 stays in the roadmap as a cross-reference, closed
  the same day PACKFE-005 closes.

- **Cross-repo gap, `packing-list-go`**: `GetPackingLists`
  (`internal/repository/packing_list.go`) leaves every list's `Items`
  empty — confirmed by reading current source during PACKFE-005's
  grill-me — the exact same gap `GetTemplates` had before its `ItemCount`
  fix (already shipped: `internal/models/template.go`,
  `internal/repository/template.go`). Every list/rail row here needs both
  a total count and a packed count, so this needs the same treatment
  (`ItemCount` + `PackedCount`, both `COUNT` subqueries) plus a small
  `packing-list-go` ticket, raised when PACKFE-005's list/rail piece
  (piece 7, renumbered 2026-07-29) actually needs it — every earlier
  piece can build against detail-view data alone. Everything else needed for this ticket already
  exists server-side and was verified by reading source during this
  grill-me, not assumed: `/lists` resource (not `/trips` — UI keeps
  "trip" vocabulary regardless), the per-item `PATCH
/lists/:id/items/:itemId { isPacked }` shape (same endpoint as
  quantity/notes/sortOrder), dedicated `POST /lists/:id/pack-all` /
  `.../unpack-all` (204, no N-PATCH fan-out needed), server-side atomic
  template seeding on create (`CreatePackingList` copies
  `template_items` → `packing_list_items` in one transaction, confirmed
  independent copies), `DELETE /lists/:id` as archive (soft delete via
  `archived_at`, idempotent — this **is** the archive action, there is no
  separate hard-delete endpoint, matching the design's "archive is the
  only exit") / `POST /lists/:id/unarchive` as restore (also idempotent),
  active/archived as two separate `GET /lists` / `GET /lists?archived=true`
  calls (not one endpoint split client-side), no duplicate-name
  constraint on lists (`Update`'s own comment: "duplicate list names are
  fine, per PACK-010" — no `nextUntitledName()` suffixing needed, a blank
  name just disables submit), and `packing_lists.template_id` is `ON
DELETE SET NULL` (deleting a template safely nulls a trip's back-
  reference, doesn't touch its already-copied items — no ticket needed).

- **Trips' "+ Add items" control moves into `TripDetailHeader`, edit-mode
  only** (decided 2026-07-27, follow-up to PACKFE-005's grill-me): the
  design's literal default keeps it as a full-width dashed row below the
  category groups (bottom of the screen, scroll required), which the
  handoff itself flagged as worth revisiting "if it bothers you in
  practice" — it does. Mirrors `TemplateDetailHeader`'s existing
  `variant="accent"` placement next to the title, with one deliberate
  difference: Templates shows it unconditionally (template detail is
  always in curate mode), Trips shows it only when `isEditMode` is true
  (view mode is read/tick only — no add-items entry point there at all,
  matching the Edit/Done toggle's now-broader "edit mode for this trip"
  meaning established above).

- **`PackingListDetail` mirrors its wire shape 1:1 — no client-side
  grouping, no `groupTemplateItems` promotion** (decided 2026-07-27,
  Piece 1's grill-me, correcting an assumption in the design handoff's
  §00 "extend" ledger): the handoff assumed Trips would need the same
  flatten-then-group step Templates does, and recommended promoting
  `groupTemplateItems` → `detail/groupEntriesByCategory.ts` with Trips as
  its "real second consumer." Re-reading `GET /lists/:id`'s actual
  response shape (`packing-list-go/internal/models/packing_list.go`)
  during this piece's grill-me shows that assumption was wrong: unlike
  `Template.items` (flat, joined client-side against separately-fetched
  items/categories), `PackingListDetail.categories` already arrives
  pre-grouped server-side — empty categories omitted, items pre-sorted.
  `TripDetailBody` maps `trip.categories` directly into
  `CategoryGroupCard`; no grouping helper exists or is called anywhere in
  this ticket. `groupTemplateItems` stays exactly where it is,
  untouched, in `features/templates/` — no second consumer, so per
  `CLAUDE.md`'s own promotion rule it doesn't move.

- **Trips' list hooks: one `useTrips(archived = false)`, one shared
  `TRIPS_QUERY_KEY` prefix** (decided 2026-07-27, Piece 1's grill-me):
  active and archived trips are two real `GET /lists` calls (with/without
  `?archived=true`), but exposed as a single parameterized hook/fetch
  function rather than two separately named ones — mirrors `useItems`'s
  existing optional-server-side-filter precedent (PACKFE-003 Piece 1)
  rather than introducing a new two-hooks-per-resource shape.
  `useTripsScreen` (Piece 3) calls it twice (`useTrips(false)` +
  `useTrips(true)`) since it needs both simultaneously. `TRIPS_QUERY_KEY
= ["trips"] as const` is a shared prefix for every trips query — list
  (`[...TRIPS_QUERY_KEY, "list", archived]`) and detail
  (`[...TRIPS_QUERY_KEY, id]`) alike — so a trip-level mutation
  (create/update) invalidates the bare prefix once and catches both list
  variants plus every open detail query in a single call, rather than
  needing a separate `invalidateQueries` call per resource.
