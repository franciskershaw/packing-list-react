# 003 — Routing: React Router

## Status

Accepted (2026-07-17, project kickoff)

## Decision

Use React Router for all navigation. The design files show three
top-level sections (Trips, Templates, Library) plus a profile screen,
with drill-in detail views (trip detail, template detail) — real
deep-linkable routes, not just component swaps.

Initial route skeleton (scaffolded in PACKFE-001, filled in by later
tickets):

```
/login                  — Google sign-in screen (unauthenticated)
/auth/callback           — session bootstrap after Google redirect (see ADR 001)
/trips                    — active packing lists
/trips?archived=true      — archived packing lists
/trips/:id                — trip detail (items grouped by category)
/templates                — template list
/templates/:id            — template detail (items grouped by category)
/library                  — categories + items management
/profile                  — profile menu, sign out
```

Protected routes (everything except `/login` and `/auth/callback`) check
`AuthContext` and redirect to `/login` if there's no session.

## Alternatives rejected

- **TanStack Router**: pairs natively with TanStack Query (same author,
  built-in typed query integration), and is a reasonable choice — but
  smaller ecosystem/community than React Router and steeper initial setup
  for a kickoff that's already introducing several new pieces at once
  (Tailwind design tokens, Playwright, hand-written API client).
- **No router, state-based view switching**: a single `currentView` piece
  of state swapping components. Rejected — loses deep-linking, back
  button, and refresh-to-same-place, which matters for a real app used
  daily (e.g. bookmarking a specific trip while packing).

## Revisit when

If route-level data loading (React Router loaders) or type-safe params
become a real pain point once the trip/template detail routes are built —
at that point TanStack Router's tighter Query integration might be worth
a migration. Not expected soon; no committed revisit trigger beyond "if
it becomes annoying."
