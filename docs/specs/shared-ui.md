# Epic 8: Shared UI primitives

Full implementation history for PACKFE-008 (the `Modal` shell), plus every
other zero-domain shared-primitive decision (`Toast`, `ConfirmDialog`,
`Button` variants, `TextField`, `InteractiveButton`'s hit-slop, the
`ui/`/`nav/`/`detail/` component split) that got recorded in
`master-spec.md`'s old Architecture section rather than under a specific
ticket, since these primitives don't belong to any one feature. Split out
on 2026-07-31 — see `foundations.md`'s header note for why.

## PACKFE-008 — Modal shell component

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

## Other shared-primitive decisions

Moved here from `master-spec.md`'s old Architecture section — each of
these was decided mid-ticket (noted inline) for a component with no single
feature owner.

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
