# Epic 4: Templates

Full implementation history for PACKFE-004 and PACKFE-009. Split out from
`master-spec.md` on 2026-07-31 — see `foundations.md`'s header note for
why. Also carries the Templates-specific decisions that used to live in
`master-spec.md`'s old Architecture section (breakpoint-switch mechanism,
route-driven selection, `useDebouncedQuantity`, etc.) — moved here since
they're this screen's decisions, not cross-cutting ones.

### Epic 4: Templates

- **PACKFE-004** — Reusable packing templates ("Templates screen") — **Done**
  (2026-07-26, header stamp added 2026-07-31 — every piece below was
  already checked off, the ticket just never got its own "Done" line)
  - Grilled 2026-07-26 against `../../templates-screen-handoff.html` (a
    Claude Design export, screenshotted the same day: 10 supporting
    screenshots covering desktop list+detail, desktop empty-template
    detail, desktop Add-items picker across its 3 states — search
    results, create-inline step 1, create-inline step 2/category-pick —
    and the mobile equivalents of all of the above). The handoff doc
    itself is unusually thorough — it already proposes a build order and
    names most design gaps — so this grill-me's job was mostly
    **verification against current source** (both repos) rather than
    fresh design decisions. Two real gaps surfaced that the handoff's
    prose didn't catch (see Architecture section above): the list
    endpoint has no item count, and the single-item add endpoint doesn't
    auto-increment on duplicates. One thing the handoff _flagged_ as
    needing verification turned out to already be handled:
    `useActiveNavKey`'s prefix-match already covers `/templates/:id`,
    confirmed by reading its current source and test file — no changes
    needed there.
  - **The first screen where mobile and desktop show genuinely different
    elements**, not a rearrangement — two components sharing state via
    `useTemplatesScreen()` (all data/state, no JSX), switched by the new
    `useMediaQuery` hook (see Architecture section above for why, over
    the `hidden lg:block` alternative every prior screen used).
  - **Non-goals, explicitly deferred rather than dropped**:
    - Item **notes** are read-only this ticket — the data model carries
      them and rows display them, but no design exists anywhere for
      _writing_ one. Added to the `[UX polish]`/parking-lot list below.
    - **"New list from template"** opens PACKFE-005's not-yet-built New
      Trip modal — button + green variant built now, action stubbed to a
      toast, real wiring is PACKFE-005's job (see Architecture section).
    - **`packing-list-go`'s item-count fix** is its own small ticket in
      that project, not folded in here (see Architecture section) —
      landing before Piece 6 needs it, not necessarily before Piece 1.
  - **Screenshot gaps, resolved as named inferences** (same treatment as
    PACKFE-003's Edit-item-modal gap): the desktop **no-selection state**
    has no screenshot but a fairly complete written spec in the handoff's
    §01b (centred copy, ~300px max-width, `30px 40px 70px` pane padding)
    — built from that text directly. The inline title/description's
    **focused/editing** visual has neither a screenshot nor a spec — ships
    with a reasonable default focus treatment, developer eyeballs and
    corrects after, same precedent as PACKFE-003 Piece 4's estimated
    `lg:w-[420px]` modal width.
  - [x] **Piece 1 — Data layer** — **Done** (2026-07-26). Pure logic, no
        design artifact needed, unblocks everything below. Grilled
        2026-07-26: grounded every claim below against current source
        (`internal/models/template.go`, `template_handler.go`,
        `template_item_handler.go`, `main.go`'s route table,
        `scanTemplate`/`GetTemplateItems` in `internal/repository/`)
        rather than trusting this ticket's own already-grilled prose —
        one real correction surfaced doing that (see below).
    - [x] **Correction to this ticket's own earlier wording**: the
          `Template { id, name, description, items, userId }` line above
          describes the Go struct's fields, not the JSON contract —
          `UserID` is tagged `json:"-"` (confirmed, and same treatment on
          `Item`/`Category`'s `UserID`), so it's never actually in the API
          response. The frontend `Template` type has **no `userId`
          field**, matching `Item`/`Category`'s existing precedent of
          only mirroring what's actually serialized:
          `Template { id, name, description, items }`,
          `TemplateItem { itemId, name, quantity, notes }` (no
          `categoryId` on `TemplateItem` — confirmed as originally noted;
          `groupTemplateItems` joins against the already-loaded
          `useItems()` cache for that).
    - [x] `src/api/templates.ts` — one file, matching
          `categories.ts`/`items.ts`'s established shape despite covering
          9 hooks (list, detail, create, update, delete, add-item,
          update-item, remove-item, bulk-add) — per the Architecture
          section's existing "hooks live with their fetch functions, not
          split out" decision. `TEMPLATES_QUERY_KEY = ["templates"]`;
          `useTemplate(id: string | undefined)` keys
          `[...TEMPLATES_QUERY_KEY, id]` and sets `enabled: !!id` so
          Piece 3's route-driven `useParams()` value (possibly
          `undefined`) can be passed straight through.
    - [x] **Invalidation scope, decided during grill-me**: template CRUD
          (`create`/`update`/`delete`) invalidates the broad
          `TEMPLATES_QUERY_KEY` (covers the list and, via TanStack's
          default prefix match, any mounted detail query too). Item-level
          mutations (`add`/`update`/`remove`/`bulk-add`) invalidate only
          the specific `[...TEMPLATES_QUERY_KEY, templateId]` detail
          key — the list doesn't show item counts yet (the deferred
          `packing-list-go` ticket), so there's nothing on it for these
          to affect. Piece 5 will need to widen this once that ticket
          lands.
      - [x] **Correction, found during Piece 3's manual verification**:
            delete's broad invalidate refetched the just-deleted id's own
            still-mounted detail query (navigate-away happens in a later,
            separate callback), 404ing on an entity that no longer exists
            and double-toasting. `useDeleteTemplate` now invalidates with
            `exact: true` — list-only, matching create/update unaffected.
    - [x] **Toast scope, decided during grill-me — two deliberate
          deviations from the categories/items precedent**: only
          `useDeleteTemplate` fires a success toast
          (`` `${name} removed` ``, `{ id, name }` mutate shape matching
          `useDeleteCategory`/`useDeleteItem`). Unlike `useUpdateCategory`
          (which toasts `` `Renamed to ${name}` ``), `useUpdateTemplate`
          gets **no** success toast — category rename happens inside a
          modal that stays open, so the toast is the only save-confirmed
          signal; template rename is inline-editable directly on the
          screen (Piece 4a), so the visibly-saved text already is the
          feedback. Same reasoning extends to every item-level mutation
          (add/update/remove/bulk-add): each is reflected instantly in
          the UI (a pill flips state, a row disappears), so none of them
          gets a success toast either — confirmed explicitly for
          bulk-add specifically, since "added N items" was a real
          candidate for one, rejected for the same instant-feedback
          reason.
    - [x] `groupTemplateItems<T extends { itemId: string }>(entries,
items, categories)` — pure helper, fully generic over the entry
          shape (confirmed during grill-me, not narrowed to
          `TemplateItem` specifically) so trip entries (which add a
          `packed` field later) pass through unchanged; an entry whose
          `itemId` doesn't resolve to a known `Item` is silently dropped
          rather than erroring, matching `groupLibraryItems`'s style. No
          `filters` param (unlike `groupLibraryItems`) — nothing in this
          ticket needs search/filter on the template detail view.
          `src/features/templates/groupTemplateItems.ts` (+ `.test.ts`),
          feature-local same as `groupLibraryItems.ts`. Real branching →
          unit-tested first, 5 cases (category-join order, zero-match
          omission, missing-item drop, empty-entries, generic-field
          passthrough) — all pass, along with the existing 52-test suite
          and `tsc --noEmit`.
  - [x] **Piece 2 — Shared atoms + the one refactor** — **Done**
        (2026-07-26). Grilled
        2026-07-26 against the same 10 screenshots
        as the ticket's own grill-me (desktop list+detail, desktop
        empty-template detail, mobile list, mobile detail) plus
        `LibraryScreen.tsx`'s current source for the extraction target.
        Presentational, prop-driven — no tests, same precedent as
        PACKFE-003 Piece 2's atoms.
    - [x] **Extracted `ui/CategoryGroupCard`** from `LibraryScreen.tsx`'s
          inline markup (bordered card → `bg-bg-subtle` header strip with
          name + count → children rows), `LibraryScreen` repointed at it,
          1:1 same output. Third real consumer (this screen + Templates
          Piece 4c + trip detail later) clears `CLAUDE.md`'s
          structure-convention bar.
    - [x] `ui/QuantityStepper { value, onChange, min = 1 }` — 28px
          (`h-7 w-7`) outline buttons, fixed 20px-wide (`w-5`) centred
          value, `−` disabled (`opacity-40`, not hidden) at min.
          Debounce/optimistic-update logic deferred to Piece 4b as
          planned, not inside this atom.
    - [x] `ui/EmptyStatePanel { title, message, actionLabel, onAction }` —
          dashed border (reusing `Button`'s existing `dashed` variant's
          `border-[#c9bba6]` custom color for visual consistency), centred
          title/message, action button reuses the existing `accent`
          pill variant as-is (matches the empty-template screenshot's
          orange "+ Add items" pill) — no new `Button` variant needed
          for this one.
    - [x] **`ui/RailRow { title, meta, selected, onClick }` — correction
          to this ticket's own Architecture-section note, found by
          zooming into the actual screenshot pixels rather than trusting
          the already-written `bg-accent-subtle` claim**: the selected
          row is a white card (`bg-bg`) with a visible `border-accent`
          outline; unselected rows have **no card treatment at all** — no
          border, no fill, text sits flush on the page background. Not
          `Chip`'s pattern either (`Chip` keeps a visible `border-border`
          outline when unselected; `RailRow` doesn't). Implemented as
          `border-accent bg-bg` (selected) vs. `border-transparent`
          (unselected, not no-border) so toggling selection never shifts
          layout by a border's width — same defensive reasoning as
          `ConfirmDialog`'s `stopPropagation` wrapper fix in PACKFE-003
          Piece 5. Piece 6's own checklist entry (which also cited the
          stale `bg-accent-subtle` claim) corrected to point here instead.
    - [x] `ui/BackHeader { label, onBack }` — circular back button
          (`lucide-react`'s `ChevronLeft`, already a dependency via
          `Modal.tsx`'s close button) + uppercase muted label, matching
          the mobile detail screenshot's "‹ TEMPLATE" treatment.
    - [x] **`ui/InlineEditableHeading` scope, decided during grill-me**:
          one generic atom parameterized by `variant: "title" |
"description"` rather than two components or a title-only atom
          with description built ad hoc — both fields share the exact
          same interaction shape (borderless, transparent, single-line
          input), differing only in typography
          (`text-[25px] lg:text-[27px] font-bold` vs. `text-sm
text-secondary`). Save-strategy state machine still deferred to
          Piece 4a, not inside this atom.
    - [x] `ui/CollectionItemRow` — the shared row shape (§3.4): leading
          control as a `ReactNode` slot · name + optional muted notes
          line · trailing slot for the stepper. Row separator uses
          `border-[#f3eada]` (matching `LibraryItemRow`'s existing
          separator color exactly, confirmed against its current source
          — not `--color-border`, which is reserved for outer card
          borders like `CategoryGroupCard`'s). Not itself clickable —
          every affordance inside is a real button, no `role="button"`
          wrapper needed.
    - [x] `DeleteIconButton` extended with `confirm?: boolean` (default
          `true`) — `confirm={false}` skips `ConfirmDialog` entirely and
          fires `onClick` immediately; `aria-label` switches to
          `` `Remove ${label}` `` in that case (see Architecture section
          above).
    - [x] **`Button` gains a `secondary` variant** (not `successBlock` or
          similar — named to directly parallel `primary`: same
          full-width/`rounded-2xl`/shape, sibling color from the same
          token family, `bg-accent-secondary`/`text-on-accent`). No hover
          class, matching the existing `success` variant's precedent (no
          `--color-accent-secondary-hover` token exists). Self-contained
          `VARIANT_CLASSES` entry per the established pattern.
    - [x] `tsc --noEmit`, oxlint, and prettier all clean; full 57-test
          suite still green (no new tests — presentational/prop-driven,
          same as PACKFE-003 Piece 2).
    - [x] **Manual verification**: temporary demo harness built directly
          on `TemplatesScreen.tsx`'s existing "coming soon" placeholder
          (same precedent as PACKFE-003's own throwaway demo harnesses),
          rendering all 7 new atoms plus the `secondary` button variant
          with representative content against the screenshots. Developer
          confirmed 2026-07-26 — held up. Harness stays in place until
          Piece 3/4 replace it with the real screen.
    - [x] **Post-build reorganization, same day**: `src/components/ui/`
          had grown to 17 files mixing true zero-domain primitives
          (`Button`, `Modal`, `Toast`, etc.) with this piece's 7
          list/detail-screen-shaped composites. Split into `ui/` (kept)
          and a new `src/components/detail/`, holding exactly the 7 atoms
          named above (`CategoryGroupCard`, `CollectionItemRow`,
          `RailRow`, `BackHeader`, `EmptyStatePanel`, `QuantityStepper`,
          `InlineEditableHeading`) — every `ui/X` reference above reflects
          where each atom was originally built; all 7 now live in
          `detail/`. See `CLAUDE.md`'s Structure conventions section for
          the durable rule this established. `tsc`/oxlint/prettier/tests
          all reconfirmed green after the move.
  - [x] **Piece 3 — Routing + the breakpoint split** — **Done** (2026-07-26).
        Grilled 2026-07-26. Mostly executes architecture already decided
        during the ticket's own grill-me (JS-driven breakpoint switch,
        route-driven selection, `useActiveNavKey` needing no changes) —
        this piece's own grill-me settled the concrete hook/component
        shapes below. Manual verification surfaced two real bugs (409 on
        a second create, spurious 404 toast on delete) — both fixed and
        developer-confirmed; see the correction notes below.
    - [x] `/templates/:templateId` route added to `AppRoutes.tsx`
          alongside the existing `/templates`
    - [x] `useMediaQuery` hook + its Vitest test (mocked `matchMedia`) —
          see Architecture section above
      - [x] **Breakpoint constant, decided during grill-me**:
            `export const DESKTOP_QUERY = "(min-width: 1024px)"`, a named
            export colocated in `useMediaQuery.ts` itself — no new file,
            matches Tailwind's `lg:` prefix already used app-wide for the
            nav-shell split (`AppShell.tsx`'s `hidden lg:flex`/`lg:hidden`).
            Named export over an inline literal per call site because
            Trips (PACKFE-005/006) is already a named future consumer of
            this exact value, not a speculative one.
      - [x] jsdom doesn't implement `matchMedia` at all — the test needs a
            full hand-rolled mock (`matches`, `addEventListener`/
            `removeEventListener`, dispatching a `change` event), not a
            partial stub.
    - [x] `useTemplatesScreen.ts` — all state/data (list, selected
          template detail, create/delete mutations), no JSX
      - [x] **Return shape, decided during grill-me**: flat fields, not a
            discriminated union — `{ templates, isLoading,
selectedTemplateId, selectedTemplate, isSelectedLoading,
selectTemplate(id), goToList(), createTemplate(),
deleteTemplate(id, name) }`. Desktop consumes every field
            directly with no branching (it renders list + detail
            simultaneously); Mobile derives its single-mode view from
            whether `selectedTemplateId` is set (already mirrors the
            route). A `{ mode: "list" } | { mode: "detail", template }`
            union was considered and rejected — Desktop always needs the
            list regardless of mode, an awkward fit for the one screen
            showing both panes at once.
      - [x] `createTemplate()` posts immediately with name
            `"Untitled template"`, empty description, then navigates to
            the new template's detail route — the same default Piece 6
            uses for the real "+ New" button, so this isn't throwaway
            logic.
      - [x] **Correction, found during Piece 3's manual verification**:
            the backend rejects duplicate template names per user (409), so
            a literal `"Untitled template"` 409s on a second create.
            `nextUntitledName()` suffixes against the already-loaded list
            (`"Untitled template 2"`, `3`, ...) before posting — Piece 6's
            "+ New" inherits this for free via the same function.
      - [x] `deleteTemplate(id, name)` wraps `useDeleteTemplate`'s existing
            `{ id, name }` mutate shape and navigates to `/templates` on
            success — the same `navigate("/templates")` call serves both
            mobile's "pop back to list" and desktop's "return to
            no-selection state" from Piece 4c's checklist, since those are
            the same state once selection is route-driven.
      - [x] **Vitest test, decided during grill-me**: written now, not
            deferred to Piece 4c/6 — route-driven selection is this
            ticket's core architectural bet (replacing local `selectedId`
            state), and a future refactor silently reverting to local
            state would be an easy, hard-to-notice regression. First test
            combining `MemoryRouter` + `QueryClientProvider` — no existing
            precedent does both (`ItemFormModal.test.tsx`/
            `CategoriesModal.test.tsx` use `QueryClientProvider` alone).
            Cases: no `:templateId` → no selected-template query fires;
            `:templateId` present → detail query enabled with that id;
            `selectTemplate`/`goToList` navigate to the right route;
            `createTemplate` posts the default name and navigates to the
            new id; `deleteTemplate` deletes and navigates back to the
            list. All 10 new tests pass; full 67-test suite, `tsc
--noEmit`, oxlint, and prettier all clean.
    - [x] `TemplatesScreen.tsx` (breakpoint switch only) →
          `TemplatesMobile.tsx` / `TemplatesDesktop.tsx` with placeholder
          bodies, wired to real data — proves the split works end-to-end
          before any real markup exists
      - [x] **Placeholder scope, decided during grill-me**: bare, unstyled
            trigger elements wired to the real mutations, not just the
            read path — a plain "+ New" button and (when a template is
            selected) a plain "Delete" button, proving the full
            create→navigate-to-new-id and delete→navigate-back loops work
            now, not only that selecting a row updates the detail pane.
            Piece 4c/6 replace these wholesale with the real polished
            buttons (styling, `ConfirmDialog`, etc.) — same
            replace-wholesale-don't-build-alongside precedent as this
            piece replacing Piece 2's demo harness.
      - [x] No `detail/` atoms (`RailRow`, `CategoryGroupCard`, etc.) used
            here — plain list/button markup only, to keep this piece
            squarely logic-plus-trivial-JSX (no design-artifact gate) and
            avoid pre-committing to layout Piece 4c/6 will actually
            screenshot-ground.
      - [x] Loading/error states not specially handled — `useApiQuery`'s
            existing toast-on-failure covers errors, and Piece 6
            explicitly owns the real loading-state design; the placeholder
            can render nothing (or omit content) while loading.
    - [x] No `useActiveNavKey` changes needed — verified already correct
          (see Architecture section above)
    - [x] **Manual verification** (developer, via `npm run dev`): resizing
          across the 1024px breakpoint swaps `TemplatesMobile`/
          `TemplatesDesktop` live; navigating `/templates` ↔
          `/templates/:id` (via the placeholder buttons, and directly by
          URL/back-button) drives the correct body/pane on both
          breakpoints; "+ New" creates a template and lands on its detail
          route; "Delete" removes it and returns to the list/no-selection
          state. First pass surfaced the two bugs above (409 on repeat
          create, spurious 404 toast on delete) — developer confirmed
          both fixed on the second pass.
  - [x] **Piece 4a — Inline title/description editing** — **Done**
        (2026-07-26). Grilled
        2026-07-26 against `Screenshot 2026-07-26 at 09.13.59.png` (desktop
        list+detail — saved title+description), `...09.14.16.png` (desktop
        empty-template detail — confirms the placeholder-styled "Add a
        description…" treatment used in the edit view itself, distinct
        from the list/rail's "No description yet" fallback), and
        `...09.16.02.png` (mobile detail). Focused-state visual has
        neither screenshot nor spec (ticket intro's named-inference note,
        line ~979) — ships with a reasonable default focus treatment
        (`InlineEditableHeading` currently sets a blanket `outline-none`
        with nothing replacing it, so this piece must add a real
        `focus-visible` treatment, not just leave focus invisible),
        developer eyeballs/corrects after.
    - [x] **New interaction pattern, recorded here per this project's
          no-ADR override**: an always-editable field (no separate view/
          edit mode toggle) that saves on blur/Enter and reverts on
          Escape isn't precedented elsewhere in this codebase —
          `CategoryRow`'s inline rename is an explicit toggle-mode
          Save/Cancel form (`isRenaming` flips a whole different JSX
          branch), not applicable here. Will recur for trip detail's title
          later (this epic's Piece 4c entry, line ~1074), so this is a
          real cross-cutting decision, not a one-off.
    - [x] **Composition, decided during grill-me**: new
          `detail/TemplateDetailHeader.tsx` wraps two
          `InlineEditableHeading` instances (title, description), each
          driven by a new colocated `detail/useInlineEditableField.ts`
          hook — two real call sites (title + description) inside this
          one component already clears the structure-convention bar, no
          speculative extraction. `TemplatesDesktop`/`TemplatesMobile` each
          render `<TemplateDetailHeader key={selectedTemplate.id}
template={selectedTemplate} />` in place of Piece 3's placeholder
          `<p>{selectedTemplate.name}</p>`
          line — nothing else in either placeholder changes:
          `BackHeader`/the "TEMPLATE" eyebrow label, group-card assembly,
          the delete button, and loading/no-selection states all stay
          Piece 6/4c's job, not pulled forward into this piece.
      - [x] `useInlineEditableField({ savedValue, onSave, allowBlank })`
            returns `{ value, onChange, onBlur, onKeyDown }` to spread onto
            `InlineEditableHeading`. `allowBlank` is `true` for
            description, `false` for title — derived by
            `TemplateDetailHeader` from `InlineEditableHeading`'s existing
            `variant` prop, not duplicated as a second prop on the atom.
      - [x] `InlineEditableHeading` gains passthrough `onBlur`/`onKeyDown`
            props (optional) — the only change to the atom itself; Piece
            2's exclusion of the save-strategy machine from the atom
            stays intact, the state machine lives entirely in the new
            hook.
      - [x] **Double-commit guard, decided during grill-me**: Enter and
            Escape both call `.blur()` after handling the key (to defocus
            per the checklist below), which fires the input's native
            `blur` event right after — without a guard, `onBlur`'s own
            commit-or-revert logic would then re-run against a `savedValue`
            prop that hasn't caught up yet (mutations are async), double-
            firing the PATCH (Enter) or clobbering the just-reverted value
            (Escape). Fixed with a `useRef<boolean>` "suppress next blur"
            flag: Enter/Escape's `onKeyDown` sets it before calling
            `.blur()`; `onBlur` checks and consumes it first, skipping its
            own logic when set. A genuine blur with no preceding
            Enter/Escape (click away, Tab) leaves the flag unset, so
            `onBlur` runs its normal commit logic untouched.
    - [x] Locally-controlled while focused; PATCH fires on blur and Enter,
          only if the value changed (§4.2)
      - [x] **Enter behavior, decided during grill-me**: Enter commits
            (save-if-changed, or revert-if-blank-title, same logic `onBlur`
            uses) and then blurs — mirrors Escape's explicit "reverts and
            blurs" symmetry, and gives a visible commit confirmation (the
            focus treatment disappears).
      - [x] **Trimming, decided during grill-me**: title is trimmed for
            both the blank-check and the saved value (matches
            `CategoryRow`'s existing `trimmedName` precedent) — the input
            also visually snaps to the trimmed text on commit, even when
            unchanged from `savedValue` (e.g. only whitespace was added).
            Description is trimmed before saving too, but whitespace-only
            never reverts — blank description is explicitly legal.
    - [x] Blank name on blur reverts to the previous value, no error shown
          (consistent with the no-inline-field-errors rule; a duplicate-
          name conflict still surfaces via the automatic toast — no
          client-side special-casing needed, `useApiMutation`'s existing
          global error handling already covers it, same as every other
          rejected mutation in this project). Whatever the user typed
          stays visible (blurred) after a failed save — no inline error
          state, matching the no-inline-field-errors rule; the toast is
          the only signal, and re-focusing the field to fix and resubmit
          is on the user.
    - [x] Escape reverts to last-saved value and blurs
    - [x] **Desktop remount-on-switch, decided during grill-me**: unlike
          mobile (whose list↔detail conditional already unmounts/remounts
          the whole detail block on every selection change), desktop's
          detail pane stays mounted across different truthy selections.
          `TemplateDetailHeader` is keyed by `key={selectedTemplate.id}` in
          `TemplatesDesktop` (harmless no-op to also key it in
          `TemplatesMobile` for consistency) so switching templates resets
          draft state via natural remount — no resync-on-prop-change
          `useEffect`.
    - [x] Empty description is legal — list/rail falls back to "No
          description yet" (already visible in the mobile-list and
          desktop-empty-state screenshots)
    - [x] Save invalidates the templates list query too, not just detail —
          the rail/card name must update after a rename. **Already true**:
          `useUpdateTemplate` invalidates the broad `TEMPLATES_QUERY_KEY`
          (Piece 1's existing "Invalidation scope" decision covers list +
          any mounted detail query), no change needed here.
    - [x] Vitest test for the save/revert state machine —
          **`renderHook` corrected to a rendered harness during
          implementation**: the double-commit guard depends on real jsdom
          focus/blur cascading (`.blur()` dispatching a genuine native
          `blur` event), which a bare `renderHook` call can't exercise —
          tests render a minimal `<input>` wired to the hook's returned
          props (mirrors exactly how `InlineEditableHeading` consumes it)
          and drive it with `fireEvent`, same DOM-driven precedent as
          `CategoriesModal.test.tsx`'s Escape/rename coverage rather than
          `useMediaQuery.test.ts`'s pure `renderHook` one. Cases: no PATCH
          when blurred unchanged;
          PATCH with the trimmed value when changed; blank title on blur
          reverts without a PATCH; blank description on blur saves (no
          revert); Enter commits and blurs; Escape reverts and blurs
          without a PATCH regardless of draft content; a blur immediately
          following a programmatic Enter/Escape blur doesn't double-commit
          (guards the double-commit fix above).
  - [x] **Piece 4b — Item row + quantity stepper.** Screenshot-grounded:
        `Screenshot 2026-07-26 at 09.13.59.png` (desktop list+detail) and
        `...09.16.02.png` (mobile detail) — both already used for Piece
        4a, re-reviewed here for the row/stepper/delete layout
        specifically. Grilled 2026-07-26. Confirms the row already
        matches what Piece 2 built (`CollectionItemRow`/`QuantityStepper`/
        `DeleteIconButton` unchanged) — this piece is pure wiring, no new
        atom needed.
    - [x] `TemplateItemRow.tsx` (`src/features/templates/`, feature-local
          — single consumer today, same precedent as `LibraryItemRow`)
          composes `CollectionItemRow` (`×` leading, `confirm={false}`,
          name, read-only notes) + `QuantityStepper` (trailing), calling
          `useUpdateTemplateItem`/`useRemoveTemplateItem` via the new
          `useDebouncedQuantity` hook (see Architecture section above for
          the local-state-vs-cache-patch decision and the split between
          the two files).
    - [x] Pending-timer cleanup: the debounce timer clears on unmount (row
          deleted, or template switched) so a stale commit can't fire —
          and therefore can't toast — for an item that's already gone.
    - [x] `−` floors at 1, disabled (not hidden) at min; never implies
          removal — unchanged `QuantityStepper` behavior, no new logic
          needed.
    - [x] Touch targets: `InteractiveButton`'s universal hit-slop (see
          Architecture section above) covers this for free — no
          per-component work needed here beyond using `QuantityStepper`/
          `DeleteIconButton` as-is.
    - [x] Rows keep their position on any quantity change — no reordering
          (already true — `groupTemplateItems` doesn't sort by quantity).
    - [x] **Test approach, decided during grill-me**: first use of fake
          timers in this codebase. `useDebouncedQuantity.test.ts` —
          `renderHook` (`@testing-library/react`) + `vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime(400))`, not a rendered-DOM
          harness — unlike `useInlineEditableField`'s test, there's no
          blur-cascade timing gotcha here, just a timer to control. Cases:
          rapid taps only commit once (trailing debounce); commit value
          matches the last tap, not the first; a rejected commit reverts
          the displayed value to the last-confirmed prop value; unmounting
          mid-debounce doesn't fire a commit.
    - [x] **Manual verification, decided during grill-me**: Piece 4c
          (group-card assembly) doesn't exist yet, so this piece can't
          render inside a real `CategoryGroupCard`. Temporary flat-list
          harness — `selectedTemplate.items.map(...)` rendered directly as
          `TemplateItemRow`s inside `TemplatesDesktop`/`TemplatesMobile`'s
          existing placeholder bodies (next to `TemplateDetailHeader`, no
          category grouping) — same replace-wholesale-don't-build-alongside
          precedent as Piece 3/4a's own placeholders, which Piece 4c
          replaces wholesale. Verified in-browser 2026-07-26; the temporary
          seed control used to add test items is removed now that
          verification is done — Piece 5's real add-items picker is the
          actual way items get added going forward.
  - [x] **Piece 4c — Group-card assembly, empty panel, action buttons.**
        **Done** (2026-07-26) — verified live in-browser at both
        breakpoints by the developer after the design-deviation pass
        below; committed as "Implement grouped items on templates
        screen".
        Screenshot-grounded: re-reviewed all 10 of this ticket's screenshots
        (grilled 2026-07-26). Follows precedent, no new pattern:
        `CategoryGroupCard`/`EmptyStatePanel`/`ConfirmDialog` all already
        exist as unused atoms from Piece 2 — this is their first real
        wiring-in, not new build. `groupTemplateItems` already omits empty
        groups (own passing test) — no code change needed for "same rule
        as Library". One layout finding from the screenshots: the desktop
        detail pane stacks groups in a **single column**, not Library's
        `lg:grid-cols-2` — confirmed from the desktop populated-detail
        screenshot, not carried over by assumption. No screenshot exists
        for the mobile empty-template state specifically (not among the 10) — treated as a named inference (same `EmptyStatePanel`, which
        has no `lg:`-prefixed classes of its own, so it's breakpoint-
        agnostic already), same treatment as this ticket's other
        screenshot gaps noted above. **Second layout finding, confirmed
        while implementing**: the desktop empty-template screenshot
        (`...09.14.16.png`) shows "Use for a new trip" and "Delete" inline
        on one row (Delete to the right); the mobile populated-detail
        screenshot (`...09.16.07.png`) shows the CTA full-width with
        "Delete template" centered on its own line below — a genuine
        breakpoint difference, not an inconsistency to normalize away
        (built as `flex-col` → `lg:flex-row`).
    - [x] `TemplateDetailBody.tsx` (`src/features/templates/`) — new
          shared component owning everything from the group list through
          the delete flow, consumed identically by `TemplatesDesktop`/
          `TemplatesMobile` (mirrors `TemplateDetailHeader`'s existing
          precedent of one component called the same way from both).
          Outer chrome (rail/sidebar/mobile back button) stays in the two
          screen files — that's genuinely breakpoint-specific and is
          Piece 6's territory. Fetches its own `useItems()`/
          `useCategories()` to build `groupTemplateItems`' input.
    - [x] `CategoryGroupCard` per non-empty category, single column,
          empty groups omitted (same rule as Library)
    - [x] Empty-template state: `EmptyStatePanel` replaces both the group
          list and the dashed "+ Add items" row (matches the desktop
          empty-template screenshot — exact copy confirmed from
          `...09.14.16.png`: title "Nothing in here yet", message "Click
          here to start building it.", action "+ Add items")
    - [x] **Gap caught this grill-me**: the dashed "+ Add items" row and
          the empty panel's own action button both nominally "open the
          picker (Piece 5)", but Piece 5 doesn't exist yet — 4c is built
          first. Decided: stub both to a toast, same treatment as the CTA
          below, rather than pulling Piece 5 forward. `toast("The
add-items picker is coming soon", "success")` for both triggers.
    - [x] "Use for a new trip" green block CTA (`Button variant="secondary"`
          — exact copy confirmed from the desktop empty-template
          screenshot, not the roadmap's earlier paraphrase "New list from
          template") — stubbed action per the Architecture section's
          scope-boundary decision: `toast("Trip creation is coming soon",
"success")`.
    - [x] "Delete template" — bare `notice-text` button (`InteractiveButton`
          with `text-sm font-bold text-notice-text`, not a `Button`
          variant — none of the existing variants are bare/backgroundless),
          goes through `ConfirmDialog` directly (not `DeleteIconButton` —
          that atom is the 26px circle). Copy is "Delete template" on
          **both** breakpoints — the desktop screenshot actually shows
          bare "Delete", but decided during grill-me to normalize to the
          more explicit label rather than replicate the discrepancy.
          `ConfirmDialog` copy: title `` `Delete ${name}?` ``, body "This
          can't be undone.", confirm "Delete". Wires directly to
          `useTemplatesScreen`'s existing `deleteTemplate(id, name)` —
          its toast-on-success and navigate-to-`/templates` (which is
          mobile's "pop back to list" and desktop's "return to
          no-selection state" simultaneously, since selection is
          route-driven) are already built and tested by Piece 3; no new
          logic needed here.
    - [x] **Test approach, decided during grill-me**: no new automated
          test. Matches `LibraryScreen.tsx`'s own precedent — its
          equivalent assembly has never had a direct test, because the
          real logic underneath (`groupLibraryItems`/`groupTemplateItems`)
          already has its own. Verified manually instead.
    - [x] **Manual verification, approach corrected after the first attempt
          failed**: a `.http` seed file
          (`packing-list-go/requests/seed-piece-4c-groups.http`) was tried
          first, but it required pasting a real access token by hand and
          broke partway through category creation (item names collided
          with the developer's real library — item names are unique
          per-user, not just per-category) — deleted, wrong approach for
          a personal app that already has real seeded data. Replaced with
          `AddTestItemControl.tsx` (`src/features/templates/`) —
          reintroduced from Piece 4b's own precedent, this time adding
          **existing** library items (already spread across the
          developer's real categories) to a template rather than needing
          any new ones. Temporarily wired into both `TemplatesDesktop`/
          `TemplatesMobile` next to `TemplateDetailBody`; same
          replace-wholesale-later precedent as the rest of the Piece 3
          placeholder scaffold, removed once verification is done (see
          Piece 4b's own entry above for the identical lifecycle).
    - [x] **Two real bugs caught during this manual verification, both
          fixed**: (1) `TemplatesDesktop`/`TemplatesMobile` put
          `key={selectedTemplate.id}` on _two_ sibling elements
          (`TemplateDetailHeader` and `TemplateDetailBody`) — React logged
          a duplicate-key warning; fixed by wrapping both in a single
          `<Fragment key={selectedTemplate.id}>` instead, preserving the
          Piece 4a remount-on-switch behavior with one key, not two. (2)
          the desktop `<main>` (Piece 3's placeholder scaffold) had no
          `flex-1`, so as a flex child it shrank to its content's width
          instead of filling the pane — the whole detail view rendered as
          a narrow column against a wall of empty space, not matching the
          screenshot at all. Fixed with `flex-1 min-w-0` on `<main>`; full
          rail/sidebar styling is still Piece 6's job, this only fixes the
          space-filling behavior the placeholder should have had from
          Piece 3. Both confirmed fixed by reloading in a real browser
          (console clean, layout matches the screenshot at both
          breakpoints) — caught only because the developer asked for an
          actual look rather than trusting the code read.
    - [x] **Deliberate deviations from the Claude Design export, decided
          after using the built screen**: the developer flagged two real
          UX problems only visible once real (not mocked) data was in the
          template — a screenshot review wouldn't have caught either.
          (1) The bottom dashed "+ Add items" row required scrolling past
          every category to reach the most frequent action on this
          screen. Moved into `TemplateDetailHeader`'s own row instead —
          `flex items-start justify-between gap-3`, title/description in
          a `min-w-0 flex-1` column (now `truncate`d — added to
          `InlineEditableHeading`'s `VARIANT_CLASSES` for both variants),
          `Button variant="accent"` pinned `shrink-0` on the right. The
          bottom dashed row and its `InteractiveButton` import in
          `TemplateDetailBody` are removed entirely — one add-items
          entry point, not two — `EmptyStatePanel`'s own centered CTA
          still covers the zero-items case. (2) "Use for a new trip" at
          full-width `secondary`-variant size read as oversized next to
          "Delete template" — this was actually masked before the
          `flex-1`/`min-w-0` fix above, since the pane rendered too
          narrow for the button to visually dominate; fixing the width
          bug is what made this visible. Kept `variant="secondary"` as
          the base (mobile is unchanged — still full-width, thumb-
          friendly) and added `lg:w-auto lg:rounded-full lg:px-5 lg:py-2
lg:text-sm` so desktop only gets a compact pill next to
          Delete — a genuine breakpoint difference, same treatment as
          the Delete-copy and CTA/Delete-row-layout findings above, not
          a new variant (rejected reusing the existing `success` variant
          verbatim — it's `rounded-full`, which would have silently
          changed mobile's shape too, not just resized desktop). Verified
          at both breakpoints in a real browser after each change.
    - [ ] **Open question for the API, flagged not assumed**: whether
          trips already seeded from a template block its deletion. If the
          backend rejects it, the automatic error toast already covers the
          UI side — don't build special handling ahead of confirming this
          actually happens.
  - [x] **Piece 5 — Add-items picker.** Screenshot-grounded: desktop
        search-results (`...09.14.25.png`), desktop create-inline step 1
        (`...09.14.54.png`) and step 2 (`...09.15.05.png`), mobile
        search-results-with-existing-quantity-pills (`...09.16.16.png`),
        mobile create-inline step 2 (`...09.16.23.png`) — all re-grounded
        against the actual PNGs, not the handoff's markup, per this
        project's hard rule. Talked through before any code per this
        project's "conversation, not grill-me" override; built in one
        pass (no 5a/5b/5c split — most of the hard groundwork turned out
        to already be established precedent, see below).
    - [x] **Confirmed from screenshots + the handoff's own §3.9/§4.5 prose
          before writing code** (not new decisions, just verified against
          the real artifacts rather than assumed): bulk chip `(n)` is the
          not-yet-added count in that category, not the category's total
          size (confirmed pixel-counting the mobile screenshot: Clothing
          shows "(3)" with exactly 3 of 7 items unadded) — and the
          backend's `BulkAddItems` already skips items already on the
          template server-side, so the frontend just calls
          `useBulkAddItems({templateId, categoryId})` with no client-side
          filtering. Default category in create-inline step 2 matches
          `ItemFormModal.tsx`'s existing `categoryId ||
categories[0]?.id` precedent exactly (both screenshots show the
          first category pre-selected) — reused as-is, not a new pattern.
    - [x] **Modal-open state lives in `useTemplatesScreen`** (not
          duplicated in `TemplatesDesktop`/`TemplatesMobile`, and not a
          new wrapper component) — `isAddItemsOpen` / `openAddItems()` /
          `closeAddItems()`, plain `useState`, no new mutation logic.
          Corrected mid-conversation from an initial proposal to
          duplicate this across the two screen files: `useTemplatesScreen`
          is called exactly once (`TemplatesScreen.tsx`), so this is a
          single call site, not two. Went one step further and moved the
          modal's own render out of `TemplatesDesktop`/`TemplatesMobile`
          entirely too — `Modal` already handles both breakpoints
          internally, so `TemplatesScreen.tsx` renders it once, gated on
          `isAddItemsOpen && selectedTemplate`. `TemplateDetailHeader`/
          `TemplateDetailBody` each gained an `onAddItems` callback prop
          in place of their Piece 4c toast stubs.
    - [x] **No explicit search-field reset** after "Add" or "Create it &
          add" — decided during the pre-work conversation. Tapping "Add"
          leaves the query in place so multiple results from one search
          stay addable; after "Create it & add" the newly-created item
          naturally matches its own search text and reappears in the
          result list with its pill flipped to green once the query
          invalidates, so the create-inline panel disappears on its own
          — no special-case reset logic either way.
    - [x] `Modal` with `size="fixed"`, `desktopWidth="lg:w-[560px]"` (the
          only current consumer needing `size="fixed"`) — pre-built ahead
          of time in Piece 2/earlier, unused until now.
    - [x] Search field (`TextField` as-is, placeholder "Search — or type
          something new…")
    - [x] Create-inline flow, a real 2-step interaction confirmed from the
          screenshots: step 1 shows a dashed accent-bordered `+ Create
"X" as a new item` trigger; tapping it reveals step 2 inside
          the same dashed panel — category chips (first pre-selected) +
          "Create it & add" — which creates the library item and adds it
          to the template in one gesture (`useCreateItem` →
          `useAddTemplateItem` on success). Editing the search text while
          in step 2 resets back to step 1 (the create target changed).
          The dashed panel itself is a new accent-colored treatment
          (`border-accent`, not the existing tan `dashed` Button variant)
          — no shared atom extracted for it yet, single consumer today.
    - [x] Bulk chips (`+ All {category} (n)`), horizontally scrolling —
          green outline/text (`border-accent-secondary`), not `Chip`'s
          existing selected/unselected treatment (these aren't toggles).
    - [x] Result list: name + category sub-line, trailing pill — tan
          "Add" for not-yet-added items, solid green `` `×${quantity}` ``
          for items already on the template (confirmed from the mobile
          search-results screenshot). Reuses `CollectionItemRow` for the
          row shape — its `leading` prop generalized from required to
          optional (second real evidence it doesn't apply universally,
          per the structure-convention bar) — passing the category name
          into the existing `notes` slot for the muted subtext line.
          `Button` gains a `subtle` variant (`bg-bg-subtle`, tan pill) for
          the "Add" pill; the `×${quantity}` pill reuses the existing
          `success` variant verbatim, exact color match confirmed against
          the theme tokens (`--color-accent-secondary`).
    - [x] Adding an already-present item calls `UpdateItem`
          (quantity + 1), not `AddItem` — see Architecture section's
          add-vs-increment resolution
    - [x] Pinned "Done" in `Modal`'s `footer` — dark `heading` fill,
          closes only (every add already applied, not a staged basket)
    - [x] On close: invalidate template detail — **already true**, every
          item-level mutation hook (Piece 1) invalidates its own detail
          key on success, so no new invalidation code was needed here.
          List-query invalidation (once item counts exist) is still
          Piece 6/the Go ticket's job, unchanged from the original note.
    - [x] `prepareAddItemsPickerData(items, categories, entries, search)`
          — new pure helper (`src/components/detail/`, shared-shape since
          the modal itself is shared w/ Trips), real branching → unit
          tested first, 5 cases (category-then-item ordering, substring
          match, already-added quantity attachment, bulk remaining-count
          with zero-remaining omission, create-inline show/hide). Deliberately not reusing `groupLibraryItems` directly — that
          groups by category for card rendering; the picker needs a flat
          list — though the filtering rule itself is the same
          case-insensitive substring match.
    - [x] Vitest test (`QueryClientProvider` + mocked `fetch` + RTL, same
          harness as `ItemFormModal.test.tsx`) — 6 cases covering the
          modal's own interaction state machine (Add vs. increment pill,
          bulk-add, Done, the full create-inline 2-step flow with its
          defaulted category, and the search-edit-resets-step-1 case).
          Mutations are caller-owned (per the target-agnostic prop
          contract) so this tests callback-calling behavior against fake
          `vi.fn()`s, not real API calls — the thin `TemplateAddItemsModal`
          adapter that wires those callbacks to the real template
          mutations is untested directly (trivial pass-through wiring
          onto already-tested hooks), per this project's
          skip-trivial-wiring testing guidance.
    - [x] `tsc --noEmit`, oxlint, and prettier all clean; full 90-test
          suite green (79 going in, +5 for the pure helper, +6 for the
          modal's own interaction tests).
    - [x] **Manual verification** — developer confirmed 2026-07-26 in a
          real browser at both breakpoints against the 5 screenshots
          above: search/filter, both create-inline steps, bulk-add,
          incrementing an already-added item, and Done. Held up.
  - [x] **Piece 6 — List/rail assembly + states.** Screenshot-grounded:
        desktop list+detail (`...09.13.59.png`), desktop empty-template
        detail (`...09.14.16.png`), mobile list (`...09.15.57.png`) — all
        re-viewed fresh for this piece. Depended on PACK-034
        (`packing-list-go`), now shipped — `Template` gained `itemCount`
        on the frontend type to match. Talked through before coding per
        this project's "conversation, not grill-me" override; no
        sub-piece split needed, most of the hard atoms (`RailRow`,
        `BackHeader`, `EmptyStatePanel`, `Button`'s existing variants)
        already existed from Piece 2.
    - [x] **Header subtitle correction, caught re-checking the actual
          screenshots**: "Build once, pack forever." — confirmed
          pixel-for-pixel across all 3 screenshots above, not the
          handoff's own annotation text ("Reusable starting points.",
          which matches no actual screenshot). Screenshot wins per this
          project's hard rule. Header shape (`h1.text-3xl.font-bold` +
          `p.text-sm.text-secondary`, action button trailing) mirrors
          `LibraryScreen.tsx`'s existing header precedent exactly.
    - [x] Mobile: card list (name + count same line, description below,
          whole card is the tap target). New `TemplateListCard.tsx`
          (`src/features/templates/`, feature-local — single consumer).
          **Deviated from the ticket's own `div role="button"` +
          `LibraryItemRow` precedent**: oxlint's `prefer-tag-over-role`
          caught that this card, unlike `LibraryItemRow`, nests no
          interactive children (no delete button) — the `div`
          workaround exists there specifically to avoid nesting a real
          `<button>` inside another. A plain `<button type="button">`
          here is simpler, gets Enter/Space activation for free, and
          clears the lint warning outright. No dedicated test (no
          branching like `LibraryItemRow`'s system/non-system split —
          confirmed with the developer before skipping) — manual
          verification only.
    - [x] Desktop: fixed 330px rail (`w-[330px] shrink-0`, `RailRow`,
          selected treatment per Piece 2's correction, not
          `bg-accent-subtle`) beside an independently-scrolling detail
          pane. **First screen needing independently-scrolling sibling
          panes** — required a `h-full` root (filling `AppShell`'s
          `<main>`, itself already `overflow-y-auto`) with `min-h-0` on
          both scrolling children so their own `overflow-y-auto` clips
          instead of growing the outer container (a flex nested-scroll
          gotcha, not obvious from the screenshot alone). Detail pane
          content, when a template is selected, gets the written-spec's
          `max-w-[640px]` centered box with `40px`/`30px`/`70px`
          padding; the no-selection state bypasses that box entirely and
          centers directly in the full scroll region instead (needed its
          own `flex h-full items-center justify-center`, since the 640px
          box has no explicit height to center within).
          **Also swapped the detail pane's outer element from `<main>`
          to a plain `<div>`** — Piece 3's placeholder had nested a
          second `<main>` landmark inside `AppShell`'s own `<main>`,
          invalid/confusing for a11y; caught and fixed while doing this
          piece's full wholesale rewrite of the same markup, not a
          separate out-of-scope fix.
    - [x] No-selection state copy — **named inference, no screenshot or
          exact copy exists anywhere** (confirmed searching the
          handoff's full text, only the written layout spec exists):
          "No template selected" / "Pick one from the list to see
          what's inside." Developer confirmed shipping this default,
          same treatment as this ticket's other screenshot/copy gaps.
    - [x] "+ New"/"+ New template": creates immediately (`POST` with name
          "Untitled template", empty description) and navigates straight
          into detail — already fully wired by Piece 3's `createTemplate`,
          no new logic needed. Desktop's full-width block button reuses
          `Button variant="primary"` verbatim (exact visual match, no new
          variant); mobile's small pill reuses `variant="accent"`
          (matches "+ Add items"'s existing treatment).
    - [x] **Autofocus-on-create, implemented (not skipped) after checking
          with the developer**: phrased as a "consider" in both the
          handoff and this checklist, so confirmed before building rather
          than assuming either way. `useTemplatesScreen` gained
          `justCreatedTemplateId` (cleared on any explicit
          `selectTemplate`/`goToList` navigation, so only the create
          flow's own auto-navigation triggers it, not re-visiting the
          same template later) — passed down as `autoFocusTitle` to
          `TemplateDetailHeader`'s title field only (not description).
          `InlineEditableHeading` gained `autoFocus` + an `onFocus`
          handler that selects all text, so typing immediately replaces
          "Untitled template" rather than inserting mid-word. Vitest
          coverage added to `useTemplatesScreen.test.tsx`: `createTemplate`
          sets it, an explicit `goToList` clears it (real state-transition
          logic, not presentational — worth testing per this project's
          testing guidance).
    - [x] Zero-templates state: `EmptyStatePanel` in the list/rail —
          **also a named inference** (neither export shows a brand-new
          account with zero templates; confirmed via the handoff's own
          "NO DESIGN EXISTS" flag for this exact gap). Copy: "No
          templates yet" / "Click below to build your first one." / "+
          New template", echoing the empty-template-detail panel's
          existing tone. CTA fires the same `createTemplate` action as
          "+ New".
    - [x] Loading: header + "+ New"/"+ New template" render immediately
          (data-independent — outside the `isLoading` guard entirely in
          both `TemplatesDesktop`/`TemplatesMobile`), list/rail/detail
          withheld until queries resolve — same precedent as PACKFE-003
          Piece 6. Desktop's detail pane also withholds the no-selection
          copy during the templates-list's own initial load (not just
          during a single template's own fetch, which the isolated fix
          below already covered) — avoids a flash of "no template
          selected" before the list has even arrived.
      - [x] **Desktop-specific wrinkle, pulled forward on its own
            (2026-07-26), ahead of the rest of Piece 6**: while a
            selected template's detail is still loading, don't flash the
            no-selection copy — "loading" and "nothing selected" are
            distinct states. Root cause confirmed 2026-07-26 (developer
            noticed while manually verifying Piece 4c): `useTemplatesScreen`
            already returned `isSelectedLoading` for exactly this, but it
            was unused in `TemplatesDesktop` — the placeholder body fell
            through to the "no template selected" branch while the
            newly-selected template's own query was still in flight
            (first visit only; cached revisits didn't flash). Fixed by
            gating the fallback: `isSelectedLoading ? null : <p>No
template selected</p>`. Mobile doesn't have this bug — its
            placeholder has no equivalent "no selection" copy in the
            loading branch, so no change needed there.
    - [x] Delete-and-return: mobile pops back to the list, desktop returns
          to the no-selection state — already fully wired by Piece 3's
          `deleteTemplate` (navigates to `/templates`); this piece just
          renders the correct resulting UI per breakpoint, no new logic.
    - [x] `tsc --noEmit`, oxlint, and prettier all clean; full 91-test
          suite green (90 going in, +1 for the autofocus-clearing state
          transition). Frontend `Template` type gained `itemCount:
number` to match PACK-034's response shape — a stale `tsc`
          incremental cache initially masked 4 now-invalid test
          fixtures missing the field; cleared the cache and fixed all 4
          once caught.
    - [x] **Manual verification** — developer confirmed 2026-07-26 across
          several rounds of real-browser checks at both breakpoints
          (list/rail with real counts, zero-templates state, create +
          autofocus, delete-and-return, the rail/detail visual details
          below). Caught real issues along the way, all fixed except one
          parked separately: header→button spacing tightened twice
          (`gap-4`→`gap-3`→`gap-1`), a missing vertical rail/detail
          divider added, `html`'s background added alongside `body`'s
          (overscroll-bounce white flash), a 167px unintended gap from
          `mx-auto` centering the populated detail content removed
          (checked directly against `...09.13.59.png` — the design
          anchors content near the rail, doesn't center it in leftover
          space; "centred" in the handoff prose only ever described the
          no-selection empty state). **Horizontal scroll on the rail is
          the one exception** — attempted (`min-w-0` + `truncate`) but
          not resolved; not reproducible via automated browser testing
          at 1600/1280/430px with current seed data, so parked in
          "Later / polish" below rather than guessed at further.
    - [ ] **Flagged, not fixed**: `src/features/templates/` is now at 11
          files (`TemplateListCard.tsx` pushed it further past the
          8-file threshold `CLAUDE.md`'s Structure conventions section
          sets for flat feature folders — it was already at 10 after
          Piece 5's `TemplateAddItemsModal.tsx`, not something this piece
          introduced alone). Not restructured here — a folder split is a
          real judgement call (by concern vs. by shape) that's its own
          decision, not a silent side effect of this piece's own work.

- **PACKFE-009** — Templates: item-adding modal becomes a batched
  "holding bay" (follow-up to `packing-list-go`'s PACK-035) — **Done**
  (2026-07-29, header stamp added 2026-07-31 — manual verification
  confirmed same day, ticket just never got its own "Done" line)
  - **Context**: PACK-035 (`packing-list-go`, done 2026-07-28) replaced
    the categoryId-only `POST /templates/:id/items/bulk` with a real delta
    endpoint, `PATCH /templates/:id/items/bulk`
    (`{ items: [{ itemId, quantity }] }`, `quantity: 0` = remove,
    atomic, `204`), and deleted the old endpoint outright — confirmed
    live in `main.go`/`template_item_handler.go` (`BulkUpdateItems`).
    That deletion broke templates' only real caller of the old endpoint,
    `useBulkAddItems`/`bulkAddItems` (`api/templates.ts`), which backs the
    Add-items modal's "+ All Camping"-style bulk chip — PACK-035's own
    handoff doc flagged this as a known, accepted break pending this
    frontend follow-up. Separately, real usage exposed the underlying
    problem PACK-035 was found because of: `TemplateAddItemsModal` fires
    one request per tap (`onAdd`/`onIncrement` both call single-item
    mutations immediately), so adding several items means several
    round-trips — related to the existing `[UX polish]` parking-lot note
    on `ItemFormModal` closing on every add (same underlying complaint,
    different modal).
  - **Design-gate finding**: new pattern — first "local draft state,
    explicitly flushed as one batch on a save action" UI in this
    codebase. The closest existing precedent, `useDebouncedQuantity`
    (`components/detail/`), commits per-item on a timer, not on an
    explicit user action, so it doesn't cover this shape. Per this
    project's CLAUDE.md override, no ADR — recorded directly below and
    in the Architecture section instead.
  - **Key decisions from the interview**:
    - The modal's local draft is a **delta-map** (`Map<itemId, quantity>`
      of only items added/incremented this session), not a full copy of
      `template.items` diffed on save — this shape matches the PATCH
      payload directly, no diffing step needed before sending.
    - **Close paths diverge**: the X button, backdrop click, and Escape
      all **discard silently** — no request, no confirm dialog. Only the
      footer **Done** button flushes. This falls out for free from how
      the modal is already mounted (`TemplatesScreen.tsx` conditionally
      renders `TemplateAddItemsModal` on `isAddItemsOpen`, so any close
      unmounts it and the draft state is thrown away with it — no
      explicit reset needed).
    - `AddItemsPickerModal`'s footer currently hardcodes its Done button
      to call the same `onClose` prop as every other close path. That
      splits into two distinct props: `onClose` (discard, close
      immediately) and a new `onDone` (flush, close only on success,
      button disabled while the mutation is in flight).
    - If the delta-map is empty when Done is clicked (no changes made),
      close without sending anything — an empty `items` array would hit
      the backend's own 400 validation for no real reason.
    - On a failed `PATCH` (network/5xx), the modal **stays open** with an
      error toast and an intact draft, so Done can just be retried — no
      lost work.
    - **"Create it & add" keeps firing item creation immediately**
      (`POST /items` needs a real server-issued id before anything can
      reference it), but the resulting "add this item to the template"
      step now joins the draft like any other add, instead of also
      firing `addTemplateItem` immediately.
    - **"+ All Camping"-style bulk chip mirrors the old server behavior**
      exactly, resolved client-side: confirmed via `git log` on the
      now-deleted handler (`packing-list-go`,
      `internal/handler/template_item_handler.go` pre-PACK-035) that it
      added every item in the category at quantity 1, **skipping items
      already present** — same rule, just computed in
      `prepareAddItemsPickerData` instead of on the server.
      `bulkChips` gains the actual remaining `itemIds` (not just a count),
      and `AddItemsPickerModal`'s `onBulkAdd` prop changes from
      `(categoryId: string)` to `(itemIds: string[])` accordingly.
    - **The draft-tracking hook (`useItemsDraft`) is built shared from
      the start**, in `components/detail/` alongside
      `AddItemsPickerModal.tsx`, **not** scoped to
      `features/templates/` first and extracted later. This is a
      deliberate exception to `CLAUDE.md`'s "no premature abstraction /
      extract only once there's a real second consumer" structure
      convention — confirmed explicitly in chat rather than an
      oversight, on the strength of Piece 5's existing plan (see
      Epic 5 below) already committing to a `TripAddItemsModal` that
      "mirrors `TemplateAddItemsModal` exactly" over the same
      `AddItemsPickerModal` shell — the second consumer isn't
      hypothetical, it's already written down as the very next piece of
      work.
    - The single-item page-level flow is **unchanged**: `TemplateItemRow`
      keeps firing one `PATCH`/`DELETE` per tweak/removal via
      `useUpdateTemplateItem`/`useRemoveTemplateItem`
      (`useDebouncedQuantity`'s existing per-row debounce), no batching
      added there. Only the modal's add flow changes.
    - `api/templates.ts`'s dead `bulkAddItems`/`useBulkAddItems` are
      replaced (not kept alongside) by `bulkUpdateTemplateItems`/
      `useBulkUpdateTemplateItems` against the new `PATCH` endpoint,
      mirroring the backend's own `BulkAddItems` → `BulkUpdateItems`
      rename.
  - **Acceptance criteria**:
    - [x] `useItemsDraft` (new, `components/detail/`): given an initial
          `{ itemId, quantity }[]`, exposes merged display `entries`,
          `add(itemId)`, `increment(itemId)` (clamped at 999, matching
          backend validation), `bulkAdd(itemIds: string[])` (adds only
          ids not already present, at quantity 1), and the resulting
          delta as `{ itemId, quantity }[]` ready to send
    - [x] `prepareAddItemsPickerData`'s `bulkChips` exposes remaining
          `itemIds` per category, not just a count;
          `AddItemsPickerModal.onBulkAdd` takes `itemIds: string[]`
    - [x] `AddItemsPickerModal` gains `onDone` (distinct from `onClose`);
          footer Done button calls `onDone`, disables while pending
    - [x] `TemplateAddItemsModal` wires `useItemsDraft` in, calls
          `onAdd`/`onIncrement`/`onBulkAdd`/`onCreateAndAdd`'s
          template-side effects against the draft instead of firing
          per-item requests; `onDone` sends the draft's delta via
          `useBulkUpdateTemplateItems`, closing only on success
    - [x] Empty draft + Done → closes with no request sent
    - [x] X / backdrop / Escape → closes immediately, no request, no
          confirm prompt, regardless of unsaved draft state (falls out
          of `TemplatesScreen`'s existing conditional-mount pattern —
          `onClose` is unchanged, no dedicated test, verified structurally)
    - [x] Failed `PATCH` on Done → modal stays open, error toast shown,
          draft still intact, Done clickable again (via `useApiMutation`'s
          existing error-toast behavior + `onSuccess`-only close)
    - [x] `api/templates.ts`: `bulkAddItems`/`useBulkAddItems` deleted;
          `bulkUpdateTemplateItems`/`useBulkUpdateTemplateItems` added
          against `PATCH /templates/:id/items/bulk`
    - [x] `TemplateItemRow`'s per-tweak/removal behavior verified
          unchanged — untouched by this ticket, no test churn
    - [x] Manual verification (developer): add several items with varying
          quantities via search, via "+ All Camping", and via "create &
          add," hit Done, confirm exactly one network request fires and
          the template detail reflects everything added
  - **Amendment, same day (2026-07-29)**: shipping the above surfaced a
    real gap — the modal could only add/increment, with no way to walk
    back a mis-tap before Done short of discarding the entire batch.
    Before this ticket, that wasn't a gap: every tap fired immediately,
    so a mistake was already committed the instant it happened and "fix
    it on the main page" was always the only path regardless. Batching
    changed the calculus without anyone asking the question during the
    original interview, so the picker's row UI just carried over
    untouched. Confirmed in a follow-up conversation: the modal gains
    **full edit power over any item on the template**, not just ones
    touched this session — decrement and remove, not just add/increment.
    - **First pass, corrected within the same amendment**: initially
      built as a separate leading `DeleteIconButton` (remove) alongside
      the trailing `QuantityStepper` (floored at 1, matching
      `TemplateItemRow`'s main-page stepper exactly) — mirroring the
      main page's existing leading/trailing shape literally. Rejected
      immediately as bad UX once built: forces a right-to-left hand/eye
      jump (adjust quantity on the trailing stepper, but remove from a
      completely separate leading control) for what's conceptually one
      continuous action — walking a quantity down to nothing. Corrected
      to a single control: the stepper's own decrement removes the item
      once it reaches the floor, no separate remove affordance at all.
      One real UX tradeoff accepted knowingly: removing a
      higher-quantity item now takes one tap per unit down to zero,
      instead of one tap on a dedicated control — acceptable here since
      this is a low-stakes local draft (nothing saves until Done, and
      re-adding is instant), not the main page's real, saved state.
    - `useItemsDraft` gains `decrement(itemId)`: above the floor it
      behaves like `increment`'s mirror; **at the floor, it removes
      instead of stopping** — a session-local, never-synced addition
      just vanishes from `pending` (no delta trace); a pre-existing item
      is set to pending quantity `0`, which the delta contract already
      treats as remove. No separate `remove` function exists — decrement
      is the only path down, by design. `add(itemId)` is corrected to
      always start at quantity `1` regardless of what the item's
      original saved quantity was — needed once "decrement a pre-existing
      item to removal, then re-add it" became a real path (previously
      `add` was only ever called for items with no prior state, so the
      distinction was latent, not exercised).
    - The delta filter generalizes from "was this item touched" to
      "does this item's pending quantity actually differ from what the
      server already has" — a decrement-then-re-add landing back on the
      item's original quantity is a real, verified no-op (produces an
      empty delta, not a wasted PATCH), not just the
      add-then-immediately-forget case the original version covered.
    - `bulkAdd`'s presence check moves from raw membership
      (`initialQuantityById.has`) to _effective_ presence (merged
      pending-or-initial quantity `> 0`), so "+ All Camping" can
      correctly re-add an item that was decremented to removal this
      session instead of silently skipping it as "already there."
    - **Real visual change to the picker's rows**, reversing this
      ticket's original "no visual changes" non-goal — no design
      artifact exists for a decrement/remove state in this modal, so
      the fallback is the same "reasonable default from existing
      precedent, developer eyeballs and corrects" treatment as
      PACKFE-003/004's own undesigned-state gaps: an already-added row's
      trailing control changes from the old tap-to-increment
      `×{quantity}` pill to a `QuantityStepper` (`min={0}` so the `−`
      is never disabled, unlike the main page's floor-at-1 version) —
      no leading control added at all, per the correction above.
    - [x] `useItemsDraft.decrement` implemented + unit tested (mirror of
          increment above the floor; removes at the floor for both
          session-local and pre-existing items; delta no-op filtering
          including the decrement-then-re-add-to-original-quantity case;
          `bulkAdd` re-adding an item decremented to removal)
    - [x] `AddItemsPickerModal` gains `onDecrement`; already-added rows
          render a `QuantityStepper` (`min={0}`) in place of the old
          pill, unchanged `Add` button otherwise, no leading control
    - [x] `TemplateAddItemsModal` wires `onDecrement` to the draft
  - **Non-goals**:
    - No changes to the main template detail page's tweak/remove flow —
      stays one request per action, its own `QuantityStepper` stays
      floored at 1 with a separate `DeleteIconButton` — unchanged
    - No Trips-screen work of any kind. Trips has its own, larger set of
      deviations from PACKFE-005's already-decided architecture (see
      flag below) — explicitly out of scope here, to be grilled
      separately once this ticket's patterns are settled and shipped
    - ~~No visual/design changes to the picker modal itself~~ — reversed
      by the same-day amendment above; the row's trailing control for
      already-added items changed (`QuantityStepper` replacing the
      `×{quantity}` pill; no leading control)
    - No change to `AddItemsPickerModal`'s `onAdd`/`onCreateAndAdd` prop
      signatures — `onIncrement` is unchanged, `onBulkAdd`'s
      (categoryId → itemIds), `onDone`, and the amendment's `onDecrement`
      are the only additions/changes
  - **Expected test files**:
    - `components/detail/useItemsDraft.test.ts` (new) — covers add,
      increment (including the 999 clamp), bulkAdd's skip-already-present
      rule, and the delta-map's output shape, mirroring
      `prepareAddItemsPickerData.test.ts`'s style
    - `components/detail/prepareAddItemsPickerData.test.ts` — extended
      for `bulkChips[].itemIds`
    - `components/detail/AddItemsPickerModal.test.tsx` — extended for
      the `onDone`/`onClose` split and the Done-button pending/disabled
      state
    - Manual: exercise in the running app per the acceptance criteria's
      manual-verification item above (no `.http` file — this is UI-only,
      the backend side already has its own `.http` coverage from
      PACK-035)

  **Resolved 2026-07-29** (was flagged here as unresolved): see the
  Architecture section's "Edit/Done toggle narrows to row shape only"
  entry for the settled outcome — title and "+ Add items" are always-on;
  the toggle survives but only swaps a row's leading+trailing pair
  (checkbox+badge ↔ cross+stepper). See the full re-plan under Epic 5
  below for the revised Piece 3–8 breakdown, which also reorders the
  remaining work per a separate process request from the same session
  (prioritize a real new-trip-creation flow and working add-items ahead
  of detail/list polish, so there's real data to visually test against
  sooner — the previous attempt at this ticket got tangled trying to
  build add-items behavior before any real screen existed to test it
  against, which is what led to discovering the PACK-035 gap in the
  first place).

## Related architecture decisions

Moved here from `master-spec.md`'s old Architecture section.

- **Breakpoint-switch mechanism, JS-driven** (decided 2026-07-26 during
  PACKFE-004's grill-me): Templates is the first screen to fail the
  existing "same elements, different arrangement → one component" test —
  desktop renders list _and_ detail simultaneously (plus a no-selection
  state mobile doesn't have), mobile renders exactly one of list/detail
  with real back-navigation. New `useMediaQuery(query: string)` hook
  (`src/lib/useMediaQuery.ts`, flat file — sibling to `lib/api/` and
  `lib/Tanstack/`, the established home for cross-cutting non-feature
  logic; not `components/ui/` since it has no JSX, not feature-scoped
  since Trips needs it too) built on `matchMedia` +
  `useSyncExternalStore` (no new dependency), live-reactive to resize —
  first JS-driven (non-Tailwind) breakpoint decision in this codebase,
  used only to choose which of `TemplatesMobile`/`TemplatesDesktop`
  mounts. Considered mounting both and hiding one via `hidden lg:block`
  (matches every other screen's mechanism); rejected because the
  `useTemplatesScreen()` hook already lifts all data-fetching to the
  parent regardless of which mounts (so "duplicate queries" wasn't the
  real differentiator), but two simultaneously-mounted copies of the
  inline-editable title input would race on the create-and-arrive
  autofocus (§4.1 of the handoff) — whichever mounts last wins focus,
  possibly the hidden copy. Precedent for Trips (PACKFE-005/006), which
  needs the same rail+detail split. Gets a Vitest test (mocked
  `matchMedia`) — first of its kind, real branching on initial value +
  change events.

- **Route-driven template selection** (decided 2026-07-26, PACKFE-004's
  grill-me): `/templates` + `/templates/:templateId`, not local
  `selectedId` state — mobile's back affordance is real router/browser
  navigation (works with hardware/gesture back too), deep-linkable,
  survives refresh. Library's local-state precedent (search/filter state)
  doesn't transfer — that was about filters, not navigation/selection.
  **Verified, not assumed**: `useActiveNavKey`'s existing prefix-match
  (`pathname === item.path || pathname.startsWith(\`${item.path}/\`)`,
already tested for `/trips/123`→`"trips"`) already treats
`/templates/:id` as Templates-active with zero changes — the design
  handoff flagged this as needing verification/extension; read the
  current source during grill-me and confirmed it already just works.

- **`DeleteIconButton` gains `confirm?: boolean`** (default `true`,
  decided 2026-07-26, PACKFE-004's grill-me): opts out of the always-on
  `ConfirmDialog` for template-item removal — non-destructive (the
  library item survives), done repeatedly while curating a template, so
  confirming every removal is hostile UX. Existing call sites
  (`LibraryItemRow`, `CategoryRow`) unaffected by the default.
  `aria-label` reads `Remove ${name}` when `confirm={false}` is passed —
  different verb, different consequence from "Delete". Existing
  `DeleteIconButton.test.tsx` gains one case for the no-confirm path.

- **`Button` gains a block-sized green variant, named `secondary`**
  (decided 2026-07-26, PACKFE-004 Piece 2's grill-me): "New list from
  template" CTA is full-width and uses `--color-accent-secondary`, but the
  existing `success` variant is a compact pill (built for the
  category-rename Save button) — a self-contained `VARIANT_CLASSES` entry,
  not a `className` override, per the Tailwind-precedence lesson already
  recorded above (PACKFE-003 Piece 2). Named to directly parallel
  `primary` (same full-width/`rounded-2xl` shape, sibling color from the
  same `accent`/`accent-secondary` token family) rather than
  `successBlock`/similar. Its `onClick` is a stub (toast) until PACKFE-005
  wires the real New Trip modal — see PACKFE-004's roadmap entry.

- **Cross-repo gap, `packing-list-go`**: the template List endpoint
  doesn't return item counts — `GetTemplates`'s `scanTemplate` helper
  intentionally leaves `Items: []` (only `GetTemplateByID`, the detail
  fetch, populates it via a second query), confirmed by reading
  `internal/repository/template.go`'s current source during PACKFE-004's
  grill-me. Every screenshot shows counts on list/rail rows, so this
  needs a small `ItemCount` field added to the list query (a `COUNT`
  subquery), landing as its own small `packing-list-go` ticket — same
  precedent PACKFE-003 set for the category-seeding gap. Doesn't block
  PACKFE-004's Pieces 1–5, only Piece 6 (list/rail assembly).
  **Related, resolved without a backend change**: the single-item
  `AddItem` endpoint 409s on a duplicate `itemId` rather than
  incrementing (confirmed by reading `template_item_handler.go`) — the
  Add-items picker chooses `AddItem` vs. `UpdateItem` (quantity+1) itself
  based on already-known local state (the pill it's rendering), rather
  than relying on backend auto-increment.

- **`useDebouncedQuantity` hook, local-state optimistic update — not a
  TanStack `onMutate`/`onError` cache patch** (decided 2026-07-26 during
  PACKFE-004 Piece 4b's grill-me): considered cache-patching first, since
  it would make Piece 5's quantity-+1 optimistic "for free" too as a side
  effect of any future `useUpdateTemplateItem` call. Rejected once traced
  through: `onMutate`/`onError` fire once per `.mutate()` call, but Piece
  4b needs "instant display on every tap, one debounced PATCH per burst"
  — stacking several `.mutate()` calls (one per tap) each with their own
  `onMutate` snapshot doesn't converge to the correct value on rollback
  (traced a 3-tap failure case: out-of-order `onError` handlers land on a
  mid-burst value, not the pre-burst one). The cache-patch approach's
  actual payoff — consistency if something else changes this item's
  quantity mid-burst — isn't a real risk: the NFR section already rules
  out concurrency beyond one browser tab, and Piece 5's own increment gets
  its instant feedback from the picker's own local pill state, not from
  this mutation's cache behavior. Landed on: `detail/useDebouncedQuantity.ts`
  — generic, no Template coupling (`{ value, min?, onCommit(value) }` →
  `{ value, increment, decrement }`), draft-state shape mirrors
  `useInlineEditableField` (instant local update, commit via callback,
  revert to the last-confirmed `value` prop if `onCommit` rejects — the
  automatic `useApiMutation` toast already explains the rejection) with
  "commit on blur" swapped for "commit ~400ms after the last tap." Lives
  in `detail/` next to `QuantityStepper` since Trips needs the identical
  tap-instant/debounce/rollback behavior for its own item rows later (per
  the Goals section's "add/remove/adjust items on a trip" use case, not
  speculative). The Template-specific glue (which mutation to call) stays
  feature-local in `features/templates/TemplateItemRow.tsx` — a
  deliberate split from `TemplateDetailHeader`'s precedent (Piece 4a put a
  Template-specific composite straight into `detail/`), justified here
  because the debounce/rollback logic has no Template-specific surface to
  extract, unlike `TemplateDetailHeader`. Overlapping in-flight requests
  (a fast tap burst that outlasts one debounce window) are an accepted
  edge case, not engineered around — each PATCH carries the full latest
  quantity, not a delta, and blocking input until the first request
  settles was rejected as it would break the instant-display requirement.

- **`AddItemsPickerModal`'s empty-search-results layout fixed pre-emptively**
  (2026-07-27, follow-up to PACKFE-005's grill-me, landed immediately
  rather than deferred into a ticket): the "create a new item" prompt and
  the results list were two separately-rendered elements — a zero-result
  search left the create-item box floating above an empty, still-rendered
  `flex-1` results container, a large dead white space. Fixed by rendering
  the create-item flow (and its category-picker sub-state) _inside_ that
  same `flex-1` container in place of the results list, centered, filling
  the space it would otherwise occupy — one container now shows either the
  results or the create-item prompt, never both/neither. Pure layout, no
  behavior change (`AddItemsPickerModal.test.tsx`'s existing 6 tests pass
  unchanged), so no design gate and no ticket needed — this is the shared
  `detail/` component, so the fix benefits the already-shipped Templates
  screen immediately, not just future Trips usage.

- **`useItemsDraft`: local delta-map draft, explicit flush, built shared
  from day one** (decided 2026-07-29, PACKFE-009's grill-me): first
  "hold several local edits, flush as one batch on an explicit save
  action" UI in this codebase — `useDebouncedQuantity`
  (PACKFE-004 Piece 4b) is the nearest precedent but commits on a timer,
  not a user action, so it doesn't cover this shape. State is a delta-map
  (`Map<itemId, quantity>` of only items changed this session) rather
  than a full local copy diffed on save, matching
  `packing-list-go`'s PACK-035 delta contract directly. Deliberate
  exception to the "extract only once there's a real second consumer"
  structure convention: built in `components/detail/` immediately rather
  than starting in `features/templates/`, because PACKFE-005 Piece 5
  already commits (on paper, not yet built) to a `TripAddItemsModal`
  that reuses `AddItemsPickerModal` "exactly" — the second consumer is
  already written down, not hypothetical.
