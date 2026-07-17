# 004 — State management: TanStack Query + Context

## Status

Accepted (2026-07-17, project kickoff)

## Decision

Two clearly separated kinds of state, no third store:

- **Server state** (anything that comes from the API — categories,
  items, templates, packing lists, the user's profile): TanStack Query
  (already a dependency). Query keys namespaced by resource
  (`['categories']`, `['templates', id]`, `['lists', id]`, etc.).
  Mutations invalidate the relevant query keys rather than manually
  patching the cache, unless a specific ticket has a documented reason
  for an optimistic update (e.g. instant checkbox feedback on
  pack/unpack).
- **Client-only UI state** (which modal is open, an in-progress
  new-list form before submit): React Context + `useState`/`useReducer`.
  Everything except the access token is component-local `useState`
  unless two sibling components genuinely need to share it, in which case
  it moves up to the nearest common ancestor — not a global store. The
  access token itself is the one exception: it lives in the TanStack
  Query cache, not `useState`, because non-component code needs to read
  it too — see the addendum below and [ADR 006](006-api-client-design.md).

## Alternatives rejected

- **Zustand**: a lightweight external store would avoid Context
  re-render fan-out, and is worth reaching for if UI state turns out more
  tangled than expected (e.g. optimistic drag-reordering of packing-list
  items across screens). Rejected at kickoff as speculative — this app's
  UI state is a handful of screens for one user's own data, not a
  cross-cutting coordination problem yet.

## Revisit when

If a ticket's `grill-me` surfaces UI state that genuinely needs to be
read/written from three or more unrelated component subtrees (the
concrete signal Context fan-out becomes a real perf/ergonomics problem,
not a hypothetical one) — reach for Zustand then, scoped to that specific
piece of state, not a wholesale rewrite.

**Addendum (2026-07-17, PACKFE-002)**: this condition was met once,
sooner than expected, via a different concrete trigger than the one
above — not component-subtree fan-out, but a fetch wrapper (`client.ts`,
not a component) needing to read _and_ invalidate the access token from
outside React entirely. Resolved by reusing the already-adopted
`QueryClient` as a plain key-value store for that one value, rather than
adding Zustand — see [ADR 006](006-api-client-design.md) for the full
reasoning and rejected alternatives. This still isn't a general-purpose
answer to "state needed outside React" — only appropriate because the
value is a single, key-value-shaped piece of data with an existing cache
already in place to hold it.
