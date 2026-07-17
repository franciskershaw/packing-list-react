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
  new-list form before submit, the current auth session): React Context
  + `useState`/`useReducer`. One `AuthContext` for the access
  token/current user (see ADR 001); everything else component-local
  `useState` unless two sibling components genuinely need to share it, in
  which case it moves up to the nearest common ancestor — not a global
  store.

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
