# Epic 3: Item Library

Full implementation history for PACKFE-003. Split out from
`master-spec.md` on 2026-07-31 as part of trimming that file down to a
lean, high-level reference — this doc holds the AC-level detail and
decision trail; `master-spec.md` just tracks the ticket as done and
points here.

- **PACKFE-003** — Categories & items CRUD ("Library screen") — **Done**
  (2026-07-25)
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
          original `src/api/types.ts` plan — see `master-spec.md`'s
          Architecture section).
    - [x] Fetch functions + TanStack Query hooks for categories/items
          (list/create/update/delete each), with cache invalidation on
          mutations. `useItems(params?: { categoryId?, search? })` supports
          server-side filtering for PACKFE-004's future item-picker; Library's
          own call stays unparameterized (client-side filtering, piece 6).
    - [x] Toast system on `@radix-ui/react-toast` (new dependency) — same
          reasoning as `Modal.tsx`/PACKFE-008 (see `shared-ui.md`):
          auto-dismiss, ARIA live-region, swipe-to-dismiss, and stacking are
          a behavioral contract worth getting from a tested primitive.
          Single `ToastProvider` near the app root (`App.tsx`), `useToast()`
          hook for any screen to call. See `shared-ui.md` for the concrete
          shape decided during this piece's grill-me.
    - [x] Toast visual styling: **no design artifact exists for this** (no
          screenshot, no handoff spec beyond a passing behavior mention) — a
          deliberate one-off exception to "no design artifact → developer
          authors" (same reasoning as `DesktopSidebar.tsx`/PACKFE-007, see
          `profile.md`): AI drafts a first pass from the existing token
          palette (`notice-bg`/`notice-text`, `border`, `radius-card`),
          developer reviews/adjusts after.
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
  - [x] **Piece 3 — `LibraryItemRow`** — **Done** (2026-07-26).
        (screenshot-grounded: chevron before/after screenshot + handoff
        §2's code sample). Grilled 2026-07-26. `mine` vs `sys` item states;
        chevron always visible (no hover dependency); row tap opens
        Edit-item modal; `×` delete keeps its own `stopPropagation`; row
        padding `py-3.5` so the tap target clears 44px.
    - Uses the real `Item.isSystem` field (`src/api/items.ts`), not the
      handoff code sample's illustrative `item.sys` shorthand.
    - **A11y gap in the handoff's own sample, resolved during grill-me**:
      its code wraps the whole `mine` row in a bare `<div onClick={onEdit}>`
      with no keyboard handler — a real gap against this project's
      `jsx-a11y` lint baseline, and a first for this codebase (every
      existing clickable element so far is a real `<button>` via
      `InteractiveButton`). Can't make the row itself a real `<button>`
      since the `×` delete control nests inside it (buttons can't nest).
      Resolved as `div role="button" tabIndex={0} onClick={onEdit}` plus an
      `onKeyDown` handler firing `onEdit` on Enter/Space — keeps the
      handoff's exact markup/classes, just closes the keyboard gap.
    - **File location**: `src/features/library/LibraryItemRow.tsx`
      (feature-local), not `src/components/ui/`. Unlike Piece 2's atoms
      (each with ≥2 real consumers), this is named in the handoff as
      specific to this one screen with no other consumer in sight.
      Confirmed against `CLAUDE.md`'s Structure conventions: feature
      folders stay flat until 8 files; `library/` will have ~4
      (`LibraryScreen`, this, plus Piece 4/5's modal content) by the time
      this ticket lands, well under threshold — no `components/` subfolder
      needed yet.
    - **Test decision, revised from Piece 2's precedent**: unlike Piece 2's
      atoms (pure prop-driven markup, no branching), this component has a
      real conditional (`isSystem` renders an entirely different subtree)
      and a real interaction contract (`×` click must `stopPropagation` so
      it never also fires `onEdit`; the new `onKeyDown` handler must fire
      `onEdit` on Enter/Space and do nothing on `isSystem` rows) — clears
      the bar for a suggested test per `CLAUDE.md`'s testing section.
      `LibraryItemRow.test.tsx`: render + `fireEvent` + `vi.fn()`, same
      shape as `Modal.test.tsx` (already-installed
      `@testing-library/react`, no re-add needed). Asserts: `×` click calls
      `onDelete` not `onEdit`; Enter/Space on a `mine` row calls `onEdit`;
      an `isSystem` row renders no chevron/`×`, isn't keyboard-focusable,
      and ignores clicks.
    - **Manual verification**: swap the two ad-hoc placeholder rows in
      `LibraryScreen.tsx`'s Piece 2 demo harness for real
      `<LibraryItemRow>` (one `mine`, one `sys`), `onEdit` wired to a
      temporary toast (`"Edit Socks (demo)"`) — same placeholder-via-toast
      pattern the harness already uses for delete, since Piece 4's real
      Edit-item modal doesn't exist yet. Demo harness still to be removed
      once Piece 6 assembles the real screen. Checked against the chevron
      before/after screenshot by the developer (2026-07-26) — held up.
  - [x] **Piece 4 — New/Edit-item modal content** — **Done** (2026-07-26).
        (screenshot-grounded for New: desktop + mobile "Add to your
        library" modal screenshots, 2026-07-24; Edit is the named
        inference above). Grilled 2026-07-26. Built as `Modal` content,
        wired to `POST /items` (create) / `PATCH /items/:id` (edit).
        Conflict (409 duplicate name) surfaces via toast per the scope
        decision above.
    - [x] **File/shape**: `src/features/library/ItemFormModal.tsx`
          (feature-local, same reasoning as Piece 3's `LibraryItemRow` — no
          consumer outside this screen). One component, not two — mode is
          inferred from an optional `item` prop (present → edit, absent →
          new) rather than a separate `mode` flag:
          `ItemFormModal({ item?: Item; defaultCategoryId?: string; onClose: () => void })`.
          Title: `item ? "Edit item" : "Add to your library"`. Submit
          label: `item ? "Save" : "Add to library"`, both `variant="primary"`.
    - [x] **New `Button` variant, `primary`**: solid accent-fill CTA
          (`bg-accent`/`text-on-accent`, hover `bg-accent-hover`) — no
          existing variant (`default`/`danger`/`dashed`) covers a solid CTA.
          Added as a self-contained `VARIANT_CLASSES` entry, matching the
          existing pattern (`Button.tsx`, PACKFE-003 Piece 2's consolidation
          note). First use here; Piece 5's "Add"/rename-"Save" buttons will
          likely reuse it or a sibling variant.
    - [x] **Category chip always has a selection** — matches both
          screenshots (never an unselected state shown): `categoryId` state
          initializes to `item?.categoryId ?? defaultCategoryId ?? categories[0]?.id`,
          never blank. Removes the "no category chosen" case entirely.
          `defaultCategoryId` is accepted as a prop now so Piece 6 can later
          pass the Library screen's active filter chip — Piece 4 itself
          doesn't wire that, it just accepts the optional prop.
    - [x] **Submit disabled** when `name.trim() === ""` — client-known-empty
          state, no reason to round-trip. Doesn't conflict with the
          no-inline-field-errors scope decision (that's about server-side
          rejections like duplicate-name, a different axis than disabling a
          button for blank input).
    - [x] **Success toasts** (new — see `shared-ui.md`'s Toast variant
          note): on successful create, `` `${item.name} joined
the library` ``; on successful edit, `` `${item.name} updated` ``,
          both `variant: "success"`, fired from `useCreateItem`/
          `useUpdateItem`'s own `onSuccess` in `src/api/items.ts` (entity
          name comes from the POST/PATCH response body, no signature change
          needed). Modal closes via a **call-site** `onSuccess` passed to
          `.mutate(input, { onSuccess: () => onClose() })` — runs alongside
          the hook-level `onSuccess` (toast + cache invalidation), no
          conflict between the two.
    - [x] **Scope expansion, decided during this grill-me**: delete-item,
          delete-category, and rename-category also get success toasts —
          `` `${name} removed` `` (delete, either entity), `` `Renamed to
${name}` `` (rename) — even though none of the three has real UI
          wired to it yet (`LibraryItemRow`'s `onDelete` in the real screen
          is still Piece 3's demo-toast stub; category rename UI is
          Piece 5, unbuilt). Wired into the hooks now, **unverifiable until
          Piece 5/6 actually call them** — flag this explicitly at those
          pieces' manual-verification step, don't assume it silently works.
          Required a **mutate-variable shape change**: `useDeleteItem`/
          `useDeleteCategory` took a plain `id: string`; DELETE returns `204`
          (no body), so there's no name to read in `onSuccess(data)`.
          Changed to `{ id: string; name: string }` so `onSuccess(_data,
variables)` has it. No real call sites exist yet, so this is a
          free change now, but Piece 5/6 must call `.mutate({ id, name })`,
          not `.mutate(id)`. `useUpdateCategory` needed no shape change —
          its PATCH response already returns the renamed `Category`.
    - [x] **Desktop width**: `lg:w-[420px]`, estimated from the screenshot's
          proportions (no exact prior measurement exists — the shell demo's
          `460px` was an arbitrary placeholder, not measured from this
          screen). Developer eyeball-corrects against the real render,
          same as every other screenshot-grounded piece. Confirmed
          (2026-07-26) the estimate held, no correction needed.
    - [x] No delete button inside the modal (already settled above) —
          delete stays exclusively on the row's `×`.
    - [x] **Test decision**: `ItemFormModal.test.tsx` — first test
          combining `QueryClientProvider` + mocked `fetch` + RTL render
          (closest precedents, `client.test.ts`'s fetch-mocking and
          `Toast.test.tsx`'s render/fireEvent, don't overlap). Clears the
          bar per `CLAUDE.md`'s testing section: real branching (edit vs.
          new prefill, disabled-submit, correct mutation + payload chosen).
          Covers: edit mode prefills name + selects the item's category
          chip and calls `useUpdateItem` with `{ id, name, categoryId }`;
          new mode calls `useCreateItem` with `{ name, categoryId }`; submit
          disabled while name is blank/whitespace; `onClose` fires on
          mutation success. All 4 pass; full suite (35 tests across 7
          files) and `tsc --noEmit` stay green.
          **New dev dependency surfaced while writing it**:
          `@testing-library/jest-dom` — the assertions this test needed
          (`toHaveAttribute`, `toBeDisabled`, `toHaveValue`) aren't covered
          by plain Vitest `expect`, and no existing test file in this repo
          had pulled it in yet. Wired via `@testing-library/jest-dom/vitest`
          in `src/setupTests.ts` (v7 ships that subpath with its own
          Vitest-typed `expect` augmentation). Considered rewriting the 5
          assertions as plain DOM-property checks instead, matching
          `Modal.test.tsx`/`LibraryItemRow.test.tsx`'s existing style with
          no new dependency — developer chose to add the dependency
          instead.
    - [x] **Manual verification** — developer confirmed the full
          create-item flow end-to-end 2026-07-26 (unblocked by PACK-033's
          category seed fix, `packing-list-go`), against the real desktop + mobile "Add to your library" screenshots; `lg:w-[420px]`
          estimate held, no correction needed. `LibraryScreen.tsx`'s demo
          harness's "+ New item" button opens the real `ItemFormModal` in
          new mode (replacing PACKFE-008's temporary "Open modal" shell
          trigger — this is its first real use case); one demo row's
          `onEdit` opens it in edit mode. Edit mode verified structurally
          only, per the named-inference agreement (no screenshot exists
          for it).
    - [x] **Post-verification feedback, addressed same day**:
      - Success-toast contrast bug: `Toast.tsx`'s success variant paired
        `bg-accent-secondary` with `text-on-accent-secondary` — two
        near-identical dark greens, effectively unreadable. Fixed to
        `text-on-accent` (the cream token), matching `Avatar.tsx`'s
        existing pairing for the same background color.
        `--color-on-accent-secondary` is now unused anywhere in the
        codebase — left in place, not removed, developer's call.
      - Demo harness's static "Socks" row replaced with real items:
        `LibraryScreen.tsx` now maps `useItems()`'s live (non-system)
        data underneath the static "T-shirts" system-row placeholder,
        `onEdit` wired to the real item. `onDelete` stays a toast stub —
        real delete-wiring is still Piece 6's job, not pulled forward.
      - **Delete confirmation added** — flagged as feeling too easy to
        lose an item with no confirmation step. New `ConfirmDialog`
        primitive (see `shared-ui.md`) gates `DeleteIconButton`'s
        `onClick` behind a confirm/cancel step. Copy: title
        `` `Delete ${label}?` ``, body "This can't be undone.", confirm
        button labeled "Delete". Existing `LibraryItemRow.test.tsx`
        assertions split into two (dialog-opens vs. confirm-fires-onDelete)
        since the old single-click immediate-`onDelete` contract no
        longer holds.
  - [x] **Piece 5 — Manage-categories modal content** — **Done** (2026-07-26,
        closed out same day). Implementation, tests, and manual browser
        verification against both screenshots all held up. Two real bugs
        (oversized `ConfirmDialog` buttons, delete-icon layout shift) only
        surfaced via hands-on use — see Post-verification feedback below
        and the `LESSONS.md` entry for this piece.
        Screenshot-grounded: desktop list + rename-in-place screenshots,
        both reviewed fresh 2026-07-26 — `Screenshot 2026-07-24 at
12.49.59.png` and `Screenshot 2026-07-24 at 13.00.14.png`
        respectively, from the original Piece-0 grill-me's 7 supporting
        screenshots. System categories show the `BUILT-IN` badge,
        non-tappable; user-owned rows tap anywhere to enter rename mode
        (no chevron — unlike `LibraryItemRow`, this is inline rename in
        the same modal, not navigation), row's `×` hidden while renaming.
    - [x] `CategoriesModal.tsx` + `CategoryRow.tsx` in
          `src/features/library/` (still flat — 7 files total, under the
          8-file split threshold). `CategoriesModal` owns
          `renamingId: string | null` (only one row editable at a time,
          confirmed during grill-me) and passes it + a setter down to each
          `CategoryRow`; opening one row's rename mode implicitly closes
          any other via that single piece of state.
    - [x] Item counts (`"7 items"` etc. in the screenshot): no backend
          count field exists (`Category` has no `itemCount`,
          `packing-list-go` doesn't return one). Derived client-side —
          `CategoriesModal` calls the existing unparameterized
          `useItems()` (already warm in TanStack Query's cache from
          `LibraryScreen`, so no extra request in practice) and counts by
          `categoryId`.
    - [x] Rename mode: inline `TextField` (autofocused — accepted
          `jsx-a11y(no-autofocus)` warning, deliberate reveal-on-click
          UX, not autofocus-on-page-load) + compact `success`-variant
          "Save" button (see `shared-ui.md`) + a **Cancel button next to
          Save** — a deliberate deviation from the screenshot (which shows
          no cancel affordance), added during grill-me since "there is
          enough room for both." Escape also cancels rename mode — **not**
          via `stopPropagation` on the input as originally planned (Radix's
          Escape-to-close listener runs in the capture phase on
          `document`, so a descendant's bubble-phase `stopPropagation` can
          never win that race — found while implementing, see
          `shared-ui.md`'s `Modal.tsx` entry for the actual fix: a new
          `onEscapeKeyDown` pass-through prop, Radix's real supported
          extension point). Save disabled only on blank/whitespace name
          (mirrors `ItemFormModal`'s `submitDisabled` precedent exactly —
          an unchanged name is allowed through, harmless no-op if
          resubmitted). Enter in the input submits Save
          (`TextField.onSubmit`, see `shared-ui.md`).
    - [x] Persistent "New category name…" `TextField` + compact
          `accent`-variant "Add" button, always visible at the bottom of
          the modal (in `Modal`'s `footer` prop, so it never scrolls away
          — same pattern as `ItemFormModal`'s submit button) — a
          distinct, always-visible input+button, **not** the same
          dashed-border `Button variant="dashed"` used for "+ New item"
          elsewhere. Enter submits Add, same as rename's Save.
    - [x] Category delete reuses `DeleteIconButton` (already gates
          `onClick` behind `ConfirmDialog` — Piece 5 is its confirmed
          second consumer, see `shared-ui.md`) as-is, no changes needed to
          either primitive. `CategoryRow`'s clickable row wrapper carries
          the same accepted `jsx-a11y(prefer-tag-over-role)` warning as
          `LibraryItemRow` (a `<div role="button">`, not a real `<button>`,
          because it nests `DeleteIconButton` — a real `<button>` can't
          contain another interactive `<button>`).
    - [x] Duplicate-name (create and rename) and delete-has-items
          conflicts need no client-side handling — `useApiMutation`
          already auto-toasts any `ApiError` message, and
          `packing-list-go`'s handler already returns clean messages for
          both (`category_handler.go`) — confirmed by reading current
          source during grill-me, not assumed.
    - [x] Temporary "Manage categories (temporary)" trigger button on
          `LibraryScreen`, same throwaway-harness pattern as
          `ItemFormModal`'s existing temporary triggers — removed once
          Piece 6 wires the real `Categories` pill.
    - [x] `CategoriesModal.test.tsx` — item-count derivation, rename
          state (enter/switch/blank-disables-Save/PATCH-on-save),
          Escape-cancels-without-closing-modal (the regression this piece
          found), Cancel button, persistent Add row
          (disabled/POST/clears-on-success), and delete wiring
          (`DeleteIconButton` → `ConfirmDialog` → DELETE). 7 tests, same
          `QueryClientProvider` + mocked-`fetch` + RTL harness as
          `ItemFormModal.test.tsx`, mock setup cited from that file's
          current source rather than rebuilt from memory.
    - [x] **Post-verification feedback, addressed same day (2026-07-26)**:
      - `Button`'s `default`/`danger` variants (`px-6 py-4`) are sized for
        full-page CTAs, comically oversized in `ConfirmDialog`'s 360px
        dialog and the rename row's Cancel button. Added `size?: "default"
| "compact"` to `Button.tsx`, applied to both.
      - **Layout-shift bug, pre-existing (Piece 4) but only now spotted**:
        clicking a delete `×` shifted the row's content — `ConfirmDialog`'s
        `stopPropagation` wrapper `<div>` (needed since React bubbles
        portal events through the component tree, not the DOM tree) still
        renders as a real, empty DOM node at its original position even
        though Radix portals the actual dialog elsewhere — as a 4th flex
        item in the row's `gap-2.5` container it ate a 10px gap, shrinking
        the name's `flex-1` span. Confirmed via live DOM measurement
        (`getBoundingClientRect` before/after: button `x` moved 337→327).
        Fixed with `className="contents"` on that wrapper — removes it
        from flex layout entirely while keeping it as a real node for the
        event-bubbling fix. Affects every `DeleteIconButton` consumer
        (`LibraryItemRow` too), not just this piece's `CategoryRow`.
  - [x] **Piece 6 — Screen assembly** — **Done** (2026-07-25). Grilled 2026-07-25 against the mobile
        anatomy (`Screenshot 2026-07-24 at 12.49.27.png`) and desktop list
        (`Screenshot 2026-07-24 at 12.49.43.png`) screenshots, plus
        `library-screen-handoff.html` §3.1–3.6. Header/subtitle, search
        filtering (substring match, case-insensitive, ANDed with the active
        chip — not ORed), category filter chips (`Everything` + one per
        category; horizontal-scroll mobile, `flex-wrap` desktop), category
        group cards (1-col mobile / 2-col CSS grid desktop, groups omitted
        entirely if zero matches after filtering — not shown empty),
        empty-search-results state (centered copy "Nothing matches — try a
        different search, or create it below" + "+ New item" still visible
        underneath), no true zero-state needed (system data always seeds
        the screen). Wires the `Categories` pill to the Manage-categories
        modal and the dashed row to the New-item modal.
    - [x] **Header copy discrepancy, resolved**: the two reference
          screenshots disagree on subtitle text ("All items, yours and
          built-in." on mobile vs. "Everything you own, in one tidy place."
          on desktop) despite the handoff's own §3.1 prose stating markup
          is identical at both breakpoints. Going with the mobile copy —
          it's the string the handoff's own text annotation cites as
          canonical; the desktop screenshot is treated as a stale
          mid-iteration snapshot (16 seconds apart, same session).
    - [x] **Filter-chip label, decided**: the "show everything" chip reads
          `Everything`, not `All` — overrides this checklist's own
          previously-written wording (`All`), matching the desktop
          screenshot instead of the mobile one. (Inconsistent with the
          header-copy call above, which went mobile; developer's explicit
          choice both times, not a rule.)
    - [x] **New-item prefill, decided**: tapping the dashed "+ New item"
          row while a specific category chip is active (not `Everything`)
          passes that category as `ItemFormModal`'s existing
          `defaultCategoryId`. No prefill when `Everything` is active.
    - [x] **Group header count, decided**: the count next to a category
          name (e.g. "Clothing 7") reflects the number of currently
          matching/visible rows in that card, not the category's total
          item count — recalculates under search/filter rather than
          staying fixed.
    - [x] **Loading state, decided — first of its kind in this project**:
          no loading treatment is specced anywhere in this file for any
          screen. Piece 6 renders header + search field immediately
          (data-independent) but withholds the filter-chip row and group
          cards until both `useCategories`/`useItems` resolve — rendering
          nothing rather than a "Loading…" placeholder, to avoid
          inventing a visual pattern with zero design backing. A real
          loading treatment is tracked as a `[UX polish]` item under
          PACKFE-010, see `master-spec.md`'s roadmap.
    - [x] **Fetch-error state, decided**: if the categories/items query
          itself errors (e.g. backend down), fire a generic toast (existing
          `useToast()`, default `"error"` variant) rather than showing
          nothing or a distinct inline error state.
      - [x] **Implementation refined post-build**: the first pass put a
            `useEffect` watching `categories.error`/`items.error` directly
            in `LibraryScreen` — wrong layer, and not reusable. Landed on a
            new `useApiQuery` wrapper (`src/lib/Tanstack/useApiQuery.ts`),
            sibling to the existing `useApiMutation`, used by both
            `useCategories`/`useItems`: wraps the actual `queryFn` in
            try/catch, toasts, rethrows — no `useEffect` involved, since
            `useQuery`'s per-query `onError` was removed entirely in
            TanStack Query v5 (confirmed via the installed `.d.ts`, not
            memory). Any future query hook gets the same behavior for
            free by using `useApiQuery` instead of `useQuery`.
    - [x] **Filter state scope, decided**: search text + active chip live
          in local `LibraryScreen` component state, not the URL — resets
          each time the screen is (re)mounted. No existing precedent
          in this codebase for URL-synced filters; not introducing one
          here.
    - [x] **Test flagged and accepted**: filtering/grouping (search +
          active-chip AND logic, case-insensitive match, zero-match
          group omission, per-group matching count) is extracted into a
          pure helper — `groupLibraryItems(items, categories, { search,
categoryId }) → { category, items }[]` — colocated in
          `src/features/library/`, unit-tested with Vitest
          (`groupLibraryItems.test.ts`) written before the screen wires
          it in, per this project's testing convention (real conditional
          branching worth guarding). Rest of the screen
          (header/chips/cards/wiring) is presentation-only, verified
          manually against the two reference screenshots — no test file
          for the screen component itself.
    - [x] Temporary demo harness in `LibraryScreen.tsx` (test-toast button,
          temporary "Manage categories" button, categories/items debug
          count text, hardcoded demo `LibraryItemRow`, demo `Chip`/
          `TextField` row) removed entirely, replaced by the real
          assembly.
