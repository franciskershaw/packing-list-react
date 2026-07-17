# PACKFE-004 — Category browsing & management

## Context

First real feature ticket (not foundations/auth) — establishes
form-handling, error-display, and mutation conventions every future
form (templates, packing lists, items) will follow, and is the first
real consumer of the `Button`/`Badge`/`Input`/`Modal` primitives
(`PACKFE-001`) and the shared mock infrastructure (`PACKFE-016`).
Scope: categories only. Items are `PACKFE-005`, not touched here.

**Design gate**: follows precedent — ADR 004 (state split), ADR 006
(`ApiError` shape) already cover the architecture this ticket
implements within. No new ADR; the real decisions below are
handoff-doc-scoped, matching every prior ticket's precedent.

Key decisions from the interview (2026-07-17):

- **Forms are plain controlled `useState`, not a form library.**
  Weighed react-hook-form directly against this app's actual forms
  across the whole roadmap (1-3 fields each, no field arrays, no
  complex validation) — it would add an abstraction layer for problems
  this app doesn't have. Revisit _per-form_, not app-wide, if a future
  form's shape genuinely earns it.
- **No form-management hook either.** `useMutation` (TanStack Query)
  already provides `isPending`/`error`/`data` and resets `error`
  automatically on each new `.mutate()` call — a form hook would mostly
  re-wrap that. The one genuine cross-form duplication risk is
  ApiError-to-string extraction, which is a plain utility _function_
  (`src/api/errorMessage.ts`), not a hook — no state or lifecycle
  involved.
- **Errors display inline** via `mutation.error && getErrorMessage(...)`
  near the form — no toast/notification system exists or is being
  built for this.
- **Create and rename share one `Modal`-based component**
  (`CategoryFormModal`, mode-driven: `create` | `rename`), using the
  `Modal` primitive from `PACKFE-001` as it exists today (centered
  dialog) — its first real usage since being built.
- **A real, evidenced finding surfaced and deliberately deferred, not
  solved here**: decoded the Prototype (mobile) design file and found
  every `Modal — X` in Desktop has a `Sheet — X` equivalent there (all
  four instances: categories, add items, new item, new trip) — every
  modal in this app should become a bottom sheet on mobile, not stay a
  centered dialog. `Modal` doesn't yet accept a `className` override to
  support this. Filed against `PACKFE-013` and `ADR 007`'s revisit-when,
  not solved here — this ticket ships the categories modal centered on
  every viewport, functionally correct, not the ideal mobile treatment.
- **Delete requires confirmation** — a real hard delete on the backend
  (unlike packing lists' soft-delete), no undo. Confirmed via the same
  `Modal` primitive (`DeleteCategoryModal`), not a native
  `window.confirm()` or no confirmation at all.
- **Mutations invalidate `['categories']` on success**, no optimistic
  updates — matches ADR 004's default, no documented reason here to
  deviate.
- **E2E tests use a unique per-run category name** (timestamp suffix)
  and delete what they created in `afterEach` via the UI's own delete
  action — mirrors `packing-list-go`'s own repository-test convention
  against the same real dev database (no isolated test DB), avoiding
  both data accumulation and uniqueness-constraint collisions across
  repeated runs.
- **Vitest tests are the first real validation of `PACKFE-016`'s shared
  mock infrastructure** (`src/api/__mocks__/client.ts`,
  `src/test/fixtures.ts`) — a `createMockCategory` fixture gets added
  alongside the existing `createMockUserProfile`.

## Acceptance criteria

- [ ] `src/api/errorMessage.ts`: `getErrorMessage(error: unknown):
    string` — extracts `error.body.error` from an `ApiError`, falls
      back to a generic message otherwise.
- [ ] `src/test/fixtures.ts` gains `createMockCategory(overrides?:
    Partial<Category>)`, same factory-with-defaults pattern as
      `createMockUserProfile`.
- [ ] `src/features/library/LibraryScreen.tsx` replaces the `/library`
      placeholder: `useQuery(['categories'], () =>
    apiGet<Category[]>('/categories'))`, renders system categories
      with a "Built-in" `Badge` (no edit/delete affordance) and the
      user's own categories with edit/delete actions.
- [ ] `src/features/library/CategoryFormModal.tsx`: shared create/rename
      component, `mode: 'create' | 'rename'` prop. Create: `POST
    /categories`. Rename: `PATCH /categories/:id`. Both invalidate
      `['categories']` on success and close the modal; both show
      `getErrorMessage(mutation.error)` inline on failure (409 name
      conflict, or any other non-2xx).
- [ ] `src/features/library/DeleteCategoryModal.tsx`: confirmation
      modal, `DELETE /categories/:id` on confirm, invalidates
      `['categories']` on success, shows `getErrorMessage(...)` inline
      on failure (409 if items still exist under it).
- [ ] System categories (`isSystem: true`) never show edit/delete
      affordances anywhere in the UI.

## Non-goals

- Items — `PACKFE-005`, entirely separate ticket.
- Bottom-sheet-on-mobile treatment for `Modal` — deferred to
  `PACKFE-013`; see "Design gate" above and `ADR 007`.
- A form library or a form-management hook — considered and declined;
  see "Design gate" above.
- A toast/notification system — errors display inline only.
- `Modal` gaining a `className` override prop — that's `PACKFE-013`'s
  job when it actually implements the bottom-sheet treatment, not
  this ticket's.

## Expected test files

- **`src/features/library/CategoryFormModal.test.tsx`** (Vitest, using
  `PACKFE-016`'s `__mocks__/client.ts` + `createMockCategory`): create
  mode calls `apiPost('/categories', { name })`; rename mode calls
  `apiPatch('/categories/:id', { name })` with the existing category's
  id; both invalidate the query cache and close on success; both
  display the `ApiError`'s message inline on a `409`.
- **`src/features/library/DeleteCategoryModal.test.tsx`**: confirm
  calls `apiDelete('/categories/:id')`, invalidates on success, shows
  the error message inline on a `409`.
- **`src/features/library/LibraryScreen.test.tsx`**: renders system
  categories with the "Built-in" badge and no edit/delete affordances;
  renders the user's own categories with edit/delete actions present.
- **`e2e/library-categories.spec.ts`** (Playwright, real backend via
  `requireApi()`): full round trip against the real dev database —
  create a uniquely-named category, rename it, delete it, confirm each
  step's effect in the UI. Cleans up in `afterEach`.
