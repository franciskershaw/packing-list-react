# Packing List Frontend

Follows the global development process — see `~/.claude/CLAUDE.md`.

## Naming

Working title only. Avoid introducing a product name into code, docs, or
route naming until one is chosen — matches the same convention in
`packing-list-go`.

## Stack

- React 19, Vite, TypeScript, Tailwind v4, TanStack Query, React Router.
- Testing: Vitest + Testing Library (behavior), Playwright (per-AC manual
  verification + eventual E2E suite).
- Consumes the API in `../packing-list-go`, run locally on `:8080`
  alongside `npm run dev`. Vite proxies `/api` to it — no CORS needed for
  local dev.

## Architecture

See `docs/adr/` for the full reasoning behind each of these:

- **Auth/session**: httpOnly refresh cookie + refresh-on-load, access
  token in memory only, never in a URL or `localStorage`
  ([ADR 001](docs/adr/001-auth-session-model.md)). Has a cross-repo
  dependency on a `packing-list-go` change — read the ADR before starting
  the sign-in ticket (`PACKFE-003`).
- **API contract**: hand-written types in `src/api/types.ts` mirroring
  `packing-list-go`'s Go structs field-for-field, until that project's
  `PACK-026` (OpenAPI spec) ships
  ([ADR 002](docs/adr/002-api-contract.md)).
- **Routing**: React Router ([ADR 003](docs/adr/003-routing.md)).
- **State**: TanStack Query for server state, Context +
  `useState`/`useReducer` for client UI state
  ([ADR 004](docs/adr/004-state-management.md)).
- **Structure**: feature folders (`src/features/{auth,trips,templates,
library,profile}/`) + shared primitives in `src/components/ui/` +
  Tailwind design tokens sourced from the project's design files
  ([ADR 005](docs/adr/005-component-structure-and-styling.md)).

## Overrides of the global default process

- **Tests-first, redefined for frontend work.** The global rule requires
  failing tests before implementation code. For this project that applies
  to _behavior_ — hooks, `AuthContext` state transitions, data-fetching
  logic, form validation — using Vitest + Testing Library, exactly as
  written. For _presentation-only_ work (markup/styling with no
  assertable behavior), write implementation-first instead: a red test
  for "looks right" is theater. That work is carried by the per-AC manual
  verification checkpoint below, not exempted from verification
  entirely. Confirmed as an explicit override (2026-07-17, project
  kickoff), not an oversight — don't relitigate this per ticket.
- **Manual verification artifact**: a Playwright spec per acceptance
  criterion, run against the real Vite dev server + a locally running
  `packing-list-go` instance. This is this project's analog to
  `packing-list-go/requests/*.http` — same per-AC-checkpoint-before-that-
  criterion's-commit discipline — and the same specs double as the
  project's eventual E2E suite, so the investment isn't duplicated later.
- **Ticket ID prefix**: `PACKFE-NNN`, not `PACK-NNN` — this is a separate
  repo from `packing-list-go`, and the distinct prefix avoids ID
  collisions when both are referenced in the same conversation or doc.

## Docs

- `docs/specs/master-spec.md` — living spec + ticket backlog
- `docs/handoffs/PACKFE-NNN.md` — one per ticket
- `docs/adr/NNN-title.md` — architecture decision records
- `LESSONS.md` — retro log, reviewed each kickoff/grill-me
