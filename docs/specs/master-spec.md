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
- **Confirm-dialog primitive** (added 2026-07-26, mid-Piece-4 feedback):
  `ConfirmDialog.tsx` (`src/components/ui/`) — content wrapper around
  `Modal`, `{ title, message, confirmLabel, onConfirm, onCancel }`. No
  design artifact for it anywhere in this project (same one-off-exception
  category as `Toast`'s styling/`DesktopSidebar.tsx` below). First
  consumer: `DeleteIconButton`'s `×`, which now opens this before calling
  its `onClick` prop rather than firing it immediately — a real behavior
  change from Piece 2, where it shipped as purely presentational. Also
  the reason it now carries a Vitest test
  (`DeleteIconButton.test.tsx`) — open/cancel/confirm branching clears
  the testing bar Piece 2's version didn't. Piece 5's category delete
  will be this primitive's second consumer.
  **Portal event-bubbling gotcha, found while building this**: `Modal`'s
  content is portaled to `document.body`, but React bubbles synthetic
  events through the _component_ tree, not the DOM tree — so a
  `ConfirmDialog` rendered from inside a clickable row (`DeleteIconButton`
  → `LibraryItemRow`) had every click inside it (Cancel, Confirm, the
  backdrop) also reach the row's own `onClick`. Fixed once, generically,
  inside `ConfirmDialog` itself (a wrapping `stopPropagation` div) rather
  than requiring every future consumer to guard against it. Ships two
  accepted `jsx-a11y` warnings (`click-events-have-key-events`/
  `no-static-element-interactions`) on that wrapper — same category as
  `LibraryItemRow`'s already-accepted warning: inherent to a non-visual
  event boundary, not a real accessibility gap (the actual interactive
  content inside is Radix's own accessible `Dialog`).
- **`Button.tsx` compact variants** (decided 2026-07-26 during PACKFE-003
  Piece 5's grill-me): existing `primary`/`danger`/`dashed` variants are
  either `w-full` or otherwise sized for their own use case, none fit an
  inline button sized to content. Two new variants added instead of
  fighting that via `className` overrides (Tailwind utility precedence
  isn't reliably JSX-order-dependent, so overriding e.g. `w-full` from
  the outside is fragile): `success` (`--color-accent-secondary` bg,
  `text-on-accent` — **not** `text-on-accent-secondary`, the
  near-illegible pairing already fixed once in `Toast`, see above) for
  the category-rename "Save" button; `accent` (solid `--color-accent`
  bg, `text-on-accent`) for the persistent "Add" category button. Both
  compact/pill-sized, not full-width. `Cancel` (rename's cancel action,
  added as a deliberate deviation from the rename-in-place screenshot —
  see Piece 5 below) reuses the existing `default` variant as-is.
- **`TextField.tsx` gains `onSubmit?: () => void`** (decided 2026-07-26,
  Piece 5's grill-me), wired to Enter. First use: the category-rename
  input and the persistent "New category name…" input. `ItemFormModal`'s
  existing `TextField` usage is unaffected (prop is optional).
- **`Modal.tsx` gains `onEscapeKeyDown?: (event: KeyboardEvent) => void`**,
  forwarded to Radix's `Dialog.Content` (found while building Piece 5,
  not anticipated during grill-me). The interview decided Escape should
  cancel rename mode rather than close the whole `CategoriesModal`; the
  first attempt handled Escape on the rename `TextField` itself with
  `stopPropagation()`, but Radix's own Escape-to-close listener is
  registered on `document` with `{ capture: true }` (see
  `@radix-ui/react-dismissable-layer`), which always runs before a
  descendant's bubble-phase handler — `stopPropagation` from inside a
  nested input can never win that race. Radix's actual supported
  extension point is `onEscapeKeyDown` on `Dialog.Content` itself,
  checked via `event.preventDefault()` before the internal dismiss
  fires — `Modal` now forwards that prop, and `CategoriesModal` uses it:
  `if (renamingId) { e.preventDefault(); setRenamingId(null); }`.
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
  is a deliberate, visible API change, not pre-built now.
  **Variant added, PACKFE-003 Piece 4's grill-me (2026-07-26)**: the
  deferred change above happened -- `toast(message: string, variant?:
"error" | "success")`, default `"error"` (all pre-existing call sites
  unchanged). `"success"` renders with `--color-accent-secondary`/
  `--color-on-accent-secondary` (the same green already slated for
  Piece 5's category-rename "Save" button) instead of `notice-bg`/
  `notice-text`. Trigger: create/edit-item success toasts (Piece 4)
  plus delete-item/delete-category/rename-category success toasts,
  the last three wired into their hooks' `onSuccess` even though no
  real UI calls them yet (see Piece 4 entry below for why).
  The queue
  (array of active toasts, `crypto.randomUUID()` ids, no cap on
  concurrent toasts) is hand-rolled state sitting on top of Radix's
  per-toast primitives — same category as `Modal.tsx`'s hand-rolled
  focus-restore in PACKFE-008, so it gets a Vitest test (written first,
  before the provider) rather than being left to Radix's own test
  coverage.
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
- **`src/components/` split by reusability shape, not feature/domain**
  (decided 2026-07-26, PACKFE-004 Piece 2, post-build): `ui/` had grown to
  17 files mixing zero-domain primitives (`Button`, `Modal`, `Toast`,
  `TextField`, `Avatar`, `ConfirmDialog`, `Chip`, `DeleteIconButton`,
  `SystemBadge`, `GoogleIcon`) with composites shaped around this app's
  specific recurring grouped-collection list+detail screen pattern
  (Library/Templates/Trips). Split into `ui/` (kept, the 10 primitives
  above) and a new `detail/` (`CategoryGroupCard`, `CollectionItemRow`,
  `RailRow`, `BackHeader`, `EmptyStatePanel`, `QuantityStepper`,
  `InlineEditableHeading`) — `nav/`'s existing app-shell split (PACKFE-001/ 007) was already the same idea, just not yet named as a general rule.
  Considered `collection/` first, rejected as confusingly close to
  `CollectionItemRow`'s own name without being obviously distinct from
  `ui/` at a glance; `detail/` reuses vocabulary already established in
  this roadmap ("list+detail" split, PACKFE-004's Architecture entry
  above). See `CLAUDE.md`'s Structure conventions section for the durable
  placement rule this established.
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
- **`InteractiveButton` gains a universal touch-target hit-slop** (decided
  2026-07-26 during PACKFE-004 Piece 4b's grill-me): an invisible
  `absolute -inset-2.5` (~10px) element inside every button it renders —
  clicks on the overflow still bubble to the button's own `onClick` since
  it's a descendant, so the button's visual size is unaffected. Prompted
  by `QuantityStepper`'s 28px buttons and `DeleteIconButton`'s 26px circle
  sitting three-adjacent in `TemplateItemRow` (Piece 4b), the likeliest
  mis-tap spot built so far, but applied unconditionally rather than
  behind an opt-in prop — harmless for full-width buttons, and it fixes
  the same touch-safety gap for free on `LibraryItemRow`'s/`CategoryRow`'s
  existing `×` buttons too. Same "promote a one-off fix to a blanket
  convention" reasoning as `CollectionItemRow`'s `py-3.5` bump (PACKFE-003
  Piece 3).
- **Trip detail's Edit/Done toggle controls title editability, not
  `InlineEditableHeading`** (decided 2026-07-27 during PACKFE-005's
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
  (piece 6) actually needs it — every earlier piece can build against
  detail-view data alone. Everything else needed for this ticket already
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
    - [x] **Success toasts** (new — see Architecture section's Toast
          variant note above): on successful create, `` `${item.name} joined
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
    - [ ] **Desktop width**: `lg:w-[420px]`, estimated from the screenshot's
          proportions (no exact prior measurement exists — the shell demo's
          `460px` was an arbitrary placeholder, not measured from this
          screen). Developer eyeball-corrects against the real render,
          same as every other screenshot-grounded piece.
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
        primitive (see Architecture section above) gates
        `DeleteIconButton`'s `onClick` behind a confirm/cancel step.
        Copy: title `` `Delete ${label}?` ``, body "This can't be
        undone.", confirm button labeled "Delete". Existing
        `LibraryItemRow.test.tsx` assertions split into two (dialog-opens
        vs. confirm-fires-onDelete) since the old single-click
        immediate-`onDelete` contract no longer holds.
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
          "Save" button (see Architecture section above) + a **Cancel
          button next to Save** — a deliberate deviation from the
          screenshot (which shows no cancel affordance), added during
          grill-me since "there is enough room for both." Escape also
          cancels rename mode — **not** via `stopPropagation` on the
          input as originally planned (Radix's Escape-to-close listener
          runs in the capture phase on `document`, so a descendant's
          bubble-phase `stopPropagation` can never win that race — found
          while implementing, see Architecture section's `Modal.tsx`
          entry for the actual fix: a new `onEscapeKeyDown` pass-through
          prop, Radix's real supported extension point). Save disabled
          only on blank/whitespace name (mirrors `ItemFormModal`'s
          `submitDisabled` precedent exactly — an unchanged name is
          allowed through, harmless no-op if resubmitted). Enter in the
          input submits Save (`TextField.onSubmit`, see Architecture
          section above).
    - [x] Persistent "New category name…" `TextField` + compact
          `accent`-variant "Add" button, always visible at the bottom of
          the modal (in `Modal`'s `footer` prop, so it never scrolls away
          — same pattern as `ItemFormModal`'s submit button) — a
          distinct, always-visible input+button, **not** the same
          dashed-border `Button variant="dashed"` used for "+ New item"
          elsewhere. Enter submits Add, same as rename's Save.
    - [x] Category delete reuses `DeleteIconButton` (already gates
          `onClick` behind `ConfirmDialog` — Piece 5 is its confirmed
          second consumer per the Architecture section above) as-is, no
          changes needed to either primitive. `CategoryRow`'s clickable
          row wrapper carries the same accepted
          `jsx-a11y(prefer-tag-over-role)` warning as `LibraryItemRow`
          (a `<div role="button">`, not a real `<button>`, because it
          nests `DeleteIconButton` — a real `<button>` can't contain
          another interactive `<button>`).
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
          inventing a visual pattern with zero design backing. **Follow-up
          parking-lot item added below**: a real loading treatment (e.g.
          skeleton) is wanted eventually, just not designed yet or solved
          by this ticket.
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

### Epic 4: Templates

- **PACKFE-004** — Reusable packing templates ("Templates screen")
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

### Epic 5: Trips

- **PACKFE-005** — Trip creation & packing (absorbs PACKFE-006, see
  Architecture section's merge note). Grilled 2026-07-27 against
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
  same shape as Templates' already-fixed gap), and it blocks only piece 6
  below, nothing earlier.
  - [ ] **Piece 1 — Data layer.** `src/api/trips.ts`, matching
        `templates.ts`'s shape at ~12 hooks: list (active + archived, two
        separate `useQuery`s against `GET /lists` /
        `GET /lists?archived=true`), detail (`enabled: !!id`), create
        (optional `templateId` + `eventDate`), update (name/eventDate),
        archive (`DELETE /lists/:id`), restore (`POST .../unarchive`),
        add-item, update-item (quantity/notes/isPacked — one hook, all
        three optional per the real `PATCH` shape), remove-item,
        bulk-add-items, pack-all, unpack-all. Invalidation: trip-level
        mutations invalidate the broad key; item-level and packed-state
        mutations invalidate `[...TRIPS_QUERY_KEY, tripId]` **and** the
        list key too, since the list will carry packed counts once piece
        6's backend fix lands (Templates' note about widening
        invalidation applies here from day one, not retrofitted later).
        Archive uses `exact: true` on the detail-query invalidation,
        same fix as the PACKFE-004 Piece 3 404-toast bug. Toasts: archive
        ("Tucked away in the archive"), restore ("Back on the board"),
        create (seeded: `` `Seeded from ${template.name}` ``; blank: "A
        fresh trip awaits"). No toast on packed toggle, pack-all,
        quantity, add/remove item, or rename — instantly visible,
        matching Templates' existing reasoning.
    - [ ] `formatTripDate(date: string | null)` → `"2 Aug 2026"`
          (`en-GB` day/short-month/year) or `"No date yet"` when null;
          parses date-only strings at midday to dodge timezone-shift
          bugs. Unit test.
    - [ ] Optimistic packed-toggle: `onMutate` snapshot + patch the trip
          detail cache entry, rollback in `onError`, invalidate in
          `onSettled` — see the Architecture section entry above for why
          this can't reuse `useDebouncedQuantity`'s local-draft-state
          approach. Two tests: optimistic-then-confirmed, rollback.
          "Pack it all"/"Reset all" reuse the same patch shape against
          the real `pack-all`/`unpack-all` endpoints (confirmed to exist,
          204/no-body) — no client-side N-PATCH loop.
    - [ ] "Reset all" ships with **no** `ConfirmDialog` — consistent with
          the existing non-destructive-actions-don't-confirm line already
          drawn for template item removal (cheap to redo by ticking
          again), matching the handoff's own recommendation.
  - [ ] **Piece 2 — Shared-atom changes + the `groupTemplateItems`
        promotion.** No screenshot review needed (behavior/prop changes
        to shared atoms, verified by re-checking Library/Templates render
        pixel-unchanged afterward, not by a new design comparison).
    - [ ] Promote `groupTemplateItems` (`features/templates/`) →
          `detail/groupEntriesByCategory.ts` (+ its test) — already
          generic (`<T extends { itemId: string }>`), real second
          consumer per `CLAUDE.md`'s promotion rule. Repoint Templates,
          visual no-op.
    - [ ] `CategoryGroupCard` gains `collapsible?`, `expanded?`,
          `onToggle?`, and widens `count` to `number | string` (trips
          pass `"3/7"`). Collapsible header becomes an
          `InteractiveButton` with `aria-expanded` + rotating chevron.
          Collapsed state lives in `useTripsScreen`, keyed by category
          id, not persisted. Library/Templates keep passing neither prop.
    - [ ] `CollectionItemRow` gains `onClick?: () => void` and
          `struck?: boolean` (line-through + `muted` name when packed).
          Only attaches `role="button" tabIndex={0}` + Enter/Space
          `onKeyDown` (same accepted `jsx-a11y` warnings as
          `LibraryItemRow`) when `onClick` is passed — template/picker
          rows unaffected.
    - [ ] `RailRow` gains `leading?: ReactNode` (the progress ring),
          `flex items-center gap-3` + `min-w-0 flex-1` text column.
          Templates passes nothing, renders identically. **While in
          here**: re-check the parked Templates-rail horizontal-scroll
          bug (master spec's "Later / polish" list) at a narrow desktop
          width on both rails — a fixed-width leading child in front of
          truncating text is exactly the shape of thing that could make
          it worse.
    - [ ] `BackHeader` gains `trailing?: ReactNode`, `label` becomes
          optional (trip detail's mobile header: back circle · spacer ·
          archive circle · Edit/Done pill, no eyebrow label). Template
          detail passes neither, unaffected.
    - [ ] `TextField` gains `type?: "text" | "date"` (default `"text"`)
          for the New-trip modal's "When" field — plus an explicit label
          prop or fallback, since `aria-label` currently derives from
          `placeholder`, which a date input has none of.
    - [ ] New `detail/ProgressBar { packed, total }` (7px/8px track,
          accent fill, radius 99, ~0.35s width transition) and
          `detail/ProgressRing { packed, total, size = 34 }` (two SVG
          circles, r=13, 3.5px stroke, `stroke-linecap="round"`,
          rotated −90°). Both take counts, not a percentage — rounding
          lives in one place. Both `aria-hidden` — adjacent text always
          states "n of m packed".
    - [ ] New `detail/PackedCheckbox` (26px circle, filled + tick when
          packed): a non-interactive `aria-hidden` span, with the row
          itself carrying `role="checkbox" aria-checked` — chosen over a
          nested interactive control since the row already owns click/
          keyboard semantics via `CollectionItemRow`'s new `onClick`.
  - [ ] **Piece 3 — Route + breakpoint split.** `/trips/:tripId` route.
        `useTripsScreen()` (flat return shape, mirroring
        `useTemplatesScreen`: `trips, archivedTrips, isLoading,
    selectedTripId, selectedTrip, isSelectedLoading, selectTrip,
    goToList, archiveTrip, restoreTrip, isNewTripOpen/openNewTrip/
    closeNewTrip, isAddItemsOpen/openAddItems/closeAddItems,
    showArchived/toggleArchived, isEditMode/toggleEditMode`) + test
        (`MemoryRouter` + `QueryClientProvider` harness, same precedent
        as `useTemplatesScreen.test.tsx`). `isEditMode` and the
        collapsed-group set both live here, both reset on trip switch
        (key the detail block by trip id, as Templates already does).
        `TripsMobile`/`TripsDesktop` (in the new `features/trips/
    components/` folder — see Architecture section's folder-split
        note) with placeholder detail bodies wired to real create/archive
        so both loops prove out end-to-end. `TripsScreen` stays a pure
        breakpoint switch (`useMediaQuery(DESKTOP_QUERY)`) + the two
        modals mounted once, gated on hook state — same shape as
        `TemplatesScreen`.
  - [ ] **Piece 4 — Detail, view mode.** Screenshot-grounded: mobile
        detail-view-mode + packing-in-progress screenshots, desktop
        full-shell view-mode screenshot (all reviewed 2026-07-27).
    - [ ] `TripDetailHeader`: back circle · spacer · archive circle ·
          Edit/Done pill (mobile); title block · archive circle + Edit
          pill (desktop). View mode: static title + date line
          (`formatTripDate`). No "TRIP" eyebrow anywhere. Edit mode also
          renders a `variant="accent"` "+ Add items" button in this same
          row (see Piece 5's placement decision below) — view mode has no
          add-items entry point at all.
    - [ ] `TripDetailBody` (shared by both breakpoints, matching
          Templates' precedent): progress card ("n of m packed" + `%` +
          `ProgressBar` + Pack-it-all/Reset-all), all-packed banner (only
          `total > 0 && packed === total`, view mode only — `#E9EFE3` bg,
          `accent-secondary` border, "All packed! Have a great trip."),
          collapsible category groups (`"3/7"` counts), checklist rows
          with optimistic ticking (`PackedCheckbox` + struck-through name + quantity badge shown only when `quantity > 1`).
    - [ ] Desktop no-selection pane: centred "Pick a trip" + "Pick one on
          the left to start packing." — distinct from loading, matching
          Templates' existing handling.
  - [ ] **Piece 5 — Detail, edit mode + add items.** Small piece — most
        of it already exists. Screenshot-grounded: mobile detail
        edit-mode + desktop edit-mode screenshots.
    - [ ] Edit toggle swaps the title into a filled input (see
          Architecture section's title-edit-mode decision above) and
          every item row into `TripEditItemRow` (near-copy of
          `TemplateItemRow`: leading `×` via `DeleteIconButton
    confirm={false}`, name, `QuantityStepper` +
          `useDebouncedQuantity`). Checkboxes absent in edit mode;
          steppers absent in view mode.
    - [ ] Empty-trip dashed panel (`EmptyStatePanel`, reused as-is) when
          the trip has no items, its CTA opening the add-items picker.
    - [ ] `TripAddItemsModal` — thin adapter over the existing
          target-agnostic `detail/AddItemsPickerModal`
          (`entries/onAdd/onIncrement/onBulkAdd/onCreateAndAdd/onClose`),
          mirroring `TemplateAddItemsModal` exactly, no changes inside
          the picker itself.
    - [ ] **"+ Add items" moves into `TripDetailHeader`, edit-mode only**
          (decided 2026-07-27, follow-up to PACKFE-005's grill-me —
          overrides the design's literal bottom-dashed-row default, see
          Architecture section's entry below): same `variant="accent"`
          `Button` placement as `TemplateDetailHeader`'s existing control,
          but conditionally rendered on `isEditMode` rather than always
          visible — view mode is read/tick only, adding or removing items
          only makes sense once editing. The empty-trip
          `EmptyStatePanel`'s own CTA still opens the picker directly
          regardless of mode, same as before.
  - [ ] **Piece 6 — List/rail assembly + lifecycle** (absorbs
        PACKFE-006). Screenshot-grounded: mobile list + archived-section
        screenshots, desktop rail screenshots. **Raise/land the
        `packing-list-go` `ItemCount`/`PackedCount` ticket at the start of
        this piece** (see Architecture section's Cross-repo gap note) —
        it blocks the count display here, nothing earlier.
    - [ ] Mobile list: compact ring-row per trip (confirmed by
          screenshot, not the handoff's hedged "bold card" alternative),
          "+ New trip" accent pill in the header. Desktop rail: `RailRow` + `leading` ring, full-width accent block "+ New trip" under
          the header, selected = `border-accent bg-bg` (unchanged from
          Templates' rail).
    - [ ] Client-side sort: date ascending, undated last (see Architecture
          section's ordering decision above).
    - [ ] Archived section: bare-text toggle
          (`"Show archived (1)"`/`"Hide archived (1)"`, hidden when
          none), expanded rows non-tappable except a `Button
    variant="success"` "Restore" pill.
    - [ ] Zero-trips state: `EmptyStatePanel`, mobile gets the same CTA as
          desktop (handoff's recommendation, for consistency with
          Templates' zero-state and because mobile's dashed panel is
          otherwise the only way in if the header pill is missed).
    - [ ] Archive action (detail header's archive circle): no confirm
          (reversible) → success toast → navigate to `/trips` (mobile's
          "back to list" / desktop's no-selection state at once, matching
          template delete's precedent).
    - [ ] Loading treatment: follow the existing established precedent
          (render chrome immediately, withhold list/detail until queries
          resolve, keep "loading" distinct from "nothing selected" on
          desktop) — still no designed skeleton state (parked since
          Library), this screen just has one more query in play than
          Templates so the flash window is wider; if that looks bad in
          practice, that's the trigger to finally design one.
    - [ ] Greeting header: `` `Where to next, ${user.name}?` `` /
          `"Your trips"` fallback if `user.name` is missing, subtitle
          pluralizing trip count — confirmed as real, shipped copy (not
          placeholder-only) by the screenshots.
    - [ ] Removes every placeholder from piece 3.
  - [ ] **Piece 7 — New-trip modal + wiring the Templates stub.** Last,
        because it's the one piece that touches another screen — finishes
        the last stub in the app. Screenshot-grounded: mobile + desktop
        New-trip modal screenshots.
    - [ ] `NewTripModal` (`Modal desktopWidth="lg:w-[460px]"`, reused
          as-is): Name (`TextField`, placeholder "e.g. Cornwall
          camping"), When (`TextField type="date"`), Start-from — radio-
          semantics stacked rows ("Start from scratch" + every template
          with `` `${itemCount} items` `` right-aligned, always exactly
          one selection, default "Start from scratch" or the incoming
          preselected template). Submit disabled on blank name (no
          suffixing needed — lists have no duplicate-name constraint,
          confirmed server-side). Full-width accent "Create trip".
    - [ ] On success: close, invalidate the list, navigate to
          `/trips/:newId` (mobile pushes detail; desktop lands with the
          new row selected), toast per piece 1.
    - [ ] Wire `TemplateDetailBody`'s "Use for a new trip" (currently
          `toast("Trip creation is coming soon")`) to navigate to
          `/trips?new=<templateId>`; `useTripsScreen` opens the modal
          with that template preselected on seeing the param (see
          Architecture section's cross-screen-modal decision above).
  - **Explicit non-goals, decided during this grill-me**: no delete-trip
    affordance anywhere (archive is the only exit, matching the backend —
    `DELETE /lists/:id` **is** archive, there's no separate hard-delete
    endpoint); no confetti (the all-packed banner already delivers the
    moment; noted as a possible future delight-pass, not built); date is
    not editable after trip creation (a real gap, no design exists for
    it — logged in "Later / polish" below); item notes stay read-only
    (same shared gap as Templates — no design exists for writing one).

### Epic 6: Trip lifecycle

- **PACKFE-006** — Archive & restore. Folded into PACKFE-005's Piece 6
  (see that ticket's header note and the Architecture section's merge
  decision) rather than built as a separately sequenced ticket — closes
  the same day PACKFE-005 does.
  - [ ] Archive a trip; restore it later — built in PACKFE-005 Piece 6
  - [ ] Archived trips listed separately from active ones — built in
        PACKFE-005 Piece 6

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
- **[UX polish]** A real loading-state visual treatment (noticed during
  PACKFE-003 Piece 6, 2026-07-25 — first screen to hit this gap). No
  screen in this project has a designed loading pattern yet; Piece 6
  renders nothing during its brief fetch window rather than a plain
  "Loading…" text. Worth designing something real (skeleton rows, etc.)
  once it comes up again enough to be worth a shared pattern rather than
  a one-off.
- **[UX polish]** Manage-categories modal (`CategoriesModal.tsx`)
  scrolling UX needs improvement (noticed at PACKFE-003 close-out,
  2026-07-25) — not diagnosed further yet, just flagged.
- **[UX polish]** `ItemFormModal` closes on successful add — poor for
  adding several items in a row (noticed 2026-07-25, real usage after
  PACKFE-003 closed: adding many items one at a time meant repeatedly
  reopening the modal). Instead: on successful create, keep the modal
  open and just clear the name field (leave the selected category as-is,
  since consecutive adds are often to the same category), so entry can
  continue without a re-open per item. Only applies to the create flow —
  edit-mode save should still close as it does now. Not scoped/decided
  beyond this note; revisit at grill-me when picked up.
- **[UX polish]** Template-item notes are read-only (noticed 2026-07-26,
  PACKFE-004's grill-me) — the data model carries them and rows display
  them, but neither design export has an affordance for _writing_ one.
  Needs a design before it can be built; not blocking PACKFE-004 itself.
- **[UX polish]** Horizontal scroll on the Templates desktop rail
  (reported 2026-07-26, developer testing PACKFE-004 Piece 6) — not
  resolved. Tried `min-w-0` down the flex chain + `truncate` on
  `RailRow`'s title/meta text (the classic flexbox-column content-forces-
  width gotcha), but the developer still sees it after those changes and
  a hard refresh. Couldn't reproduce via automated browser testing at
  1600px/1280px/430px with the current seed data (`scrollWidth ===
clientWidth` at every width tried) — likely needs the developer's own
  exact viewport/zoom/data to repro. Next step when picked back up: get
  a screenshot or screen recording of it actually happening, rather than
  guessing at more defensive CSS.
- **[UX polish]** A trip's date can't be edited after creation (noticed
  2026-07-27, PACKFE-005's grill-me) — set once in the New-trip modal,
  shown everywhere, but no affordance anywhere edits it afterward; a trip
  that moves has to be recreated. Trip detail's Edit mode is the obvious
  home once this gets designed. Not blocking PACKFE-005 itself.
  If this list of `[UX polish]` items keeps growing, worth grouping into
  its own epic — not yet, with six.
