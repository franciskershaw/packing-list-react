# 002 — API contract: hand-written types now, generated client later

## Status

Accepted (2026-07-17, project kickoff)

## Decision

`packing-list-go` has no OpenAPI spec yet (`PACK-026`, not started as of
this kickoff). Rather than block frontend work on that, this project
hand-writes TypeScript interfaces in `src/api/types.ts`, mirroring
`packing-list-go/internal/models/*.go` field-for-field — including exact
`json` tag casing (`isSystem`, `categoryId`, `eventDate`, `isPacked`,
`sortOrder`, etc.) so the shapes match the wire format exactly, not just
"close enough."

Each hand-written type should cite the Go struct it mirrors (file +
struct name) as a comment, so drift is checkable against source rather
than trusted from memory — same discipline the global process already
requires for tests that mirror a precedent.

## Alternatives rejected

- **Block on OpenAPI first**: matches the audit's suggested backend
  ordering exactly, but `PACK-026` has no committed date in
  `packing-list-go`, so this would block all frontend work indefinitely.
- **Generate a client from the Go structs directly** (e.g. a
  reflection-based tool): extra toolchain investment with no clear payoff
  over hand-typing ~9 small models (`Category`, `Item`, `Template`,
  `TemplateItem`, `PackingList`, `PackingListItem`, `PackingListDetail`,
  `PackingListCategory`, `PackingListDetailItem`, `User`).

## Revisit when

`PACK-026` (OpenAPI spec) ships in `packing-list-go`. At that point,
replace `src/api/types.ts` and the hand-written fetch wrappers in
`src/api/client.ts` with a generated client (e.g. `openapi-typescript` +
a thin fetch wrapper) in one dedicated ticket — not incrementally, so the
swap is a single reviewable diff against the new source of truth rather
than a slow drift.
