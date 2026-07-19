# Packing List Frontend

Follows the global development process at `~/.claude/CLAUDE.md` **except
where explicitly overridden below.** This project overrides most of the
pipeline — read the overrides section before assuming a global default
gate applies here.

This is a deliberate redo (`undo-entire-process` branch, 2026-07-19) of
an earlier attempt that piled up ADRs, handoff docs, a tests-first
Playwright/Vitest pipeline, and a tech-debt cadence before a single real
screen shipped against the actual designs — worth reading `main`'s
pre-reset `LESSONS.md` for the full story if this ever needs
re-litigating. Short version: that process was well-suited to
`packing-list-go` (a REST API with real behavioral surface to test) and
badly suited to hand-building UI against a visual design, where the
developer — not AI — is doing most of the implementation.

## Naming

Working title only. Avoid introducing a product name into code, docs, or
route naming until one is chosen — matches `packing-list-go`.

## Stack

- React 19, Vite, TypeScript, Tailwind v4, TanStack Query, React Router.
- Consumes the API in `../packing-list-go`, run locally on `:8080`
  alongside `npm run dev`. Vite proxies `/api` to it.
- Architecture decisions (auth model, state management, API contract,
  component structure) are stated directly in
  `docs/specs/master-spec.md` — no ADRs on this branch, see overrides
  below.

## Tooling (already scaffolded, unchanged from before)

- **Formatting**: Prettier (`.prettierrc.json`) with
  `@ianvs/prettier-plugin-sort-imports` for import ordering.
  `npm run format` / `format:check`.
- **Linting**: oxlint (`.oxlintrc.json`), including the `jsx-a11y` plugin
  — catches missing `alt` text, non-semantic click handlers, missing
  ARIA roles, etc.
- **Pre-commit hook**: Husky (`.husky/pre-commit`) runs `lint-staged`
  (`prettier --write` + `oxlint --fix` on staged files). Does not run
  tests — there's no CI on this project.
- **Editor**: `.vscode/settings.json` + `.vscode/extensions.json` are
  committed so format-on-save works without per-machine setup.

None of this was the source of friction last time — kept as-is.

## Overrides of the global default process

This branch trades the global pipeline's rigor for speed, because the
developer is hand-building UI directly against a visual design and
driving implementation himself, with AI in a pairing/review role rather
than owning delivery. Specifically:

- **No handoff docs.** `docs/specs/master-spec.md`'s roadmap ticket
  (description + rough checklist) is the whole planning artifact. No
  `docs/handoffs/` folder. If a feature needs real back-and-forth before
  starting, that's ordinary chat, not a written doc.
- **No tests-first gate, no AC-per-commit.** Commit at will. Automated
  tests are suggested, not mandated — see Testing below.
- **No ADRs.** Real architectural decisions are recorded inline in
  `docs/specs/master-spec.md`'s Architecture section, not as separate
  ADR docs. No `docs/adr/` folder.
- **No `grill-me`-before-every-ticket requirement**, no `close-out`
  after every ticket, no periodic `tech-debt` pass. No `LESSONS.md` on
  this branch. Mark roadmap checklist items done directly in the master
  spec as you finish them.
- **No E2E test suite**, ruled out rather than deferred: the OAuth-only
  auth model makes seeding an authenticated Playwright session
  impractical without adding a dev-only auth-bypass endpoint, which was
  already rejected once as disproportionate risk for a personal app (see
  pre-reset `LESSONS.md`, `main` branch). Revisit only if the auth model
  itself changes.

## Testing

Suggestion-only. When something behavior-heavy comes up during a
feature — a hook, a state transition, form/API logic — flag it as worth
a Vitest + Testing Library test, and let the developer decide whether
and when to write it. No coverage target, no gate blocking a commit on
missing tests.

`@testing-library/react` and Playwright are **not currently installed**
(removed in the reset; Vitest itself remains). Re-add
`@testing-library/react` and verify a trivial smoke test passes the
first time a real test actually gets written — don't pre-scaffold it now
for tests that don't exist yet.

## Design artifacts

The two design exports — `desktop.html` and `prototype.html` — live one
directory above this repo, at `../desktop.html` / `../prototype.html`.
**Deliberately not committed**: they're large (~1.2MB each) self-
executing bundles, and this branch never persists a screenshot library
(see below), so there's nothing that needs them in version control.

**No automated rendering pipeline.** There is no upfront or persisted
screenshot library, and no browser-automation tooling (e.g. Playwright)
in this workflow — that was tried and abandoned as unreliable. When a
question needs a look at a specific screen's actual rendered state, get
a fresh screenshot from the developer rather than automating it.

**Hard rule, not a suggestion**: never assess or comment on design match
from the source file's markup/CSS, and never from memory of a prior
render in a different conversation — always work from a current
screenshot. This is the exact failure mode from the first attempt: an
entire roadmap and set of ADRs got built assuming AI had seen the
designs when it had only read a loading shell. If asked about a screen
and a fresh screenshot isn't available, say so explicitly rather than
guessing.

## AI's role on this branch

Assist and review, not author, by default — for UI/markup and for
logic-heavy code alike (API client, hooks, TanStack Query wiring, form
validation). The developer drives implementation. AI's default
contributions are: test suggestions (see Testing), design-comparison
feedback (see Design artifacts), code review, answering questions, and
general pairing. AI only writes production code when explicitly asked
to in the moment — that's an exception per-request, not a standing
default for any category of file.

## Docs

- `docs/specs/master-spec.md` — the only living doc: goals, use cases,
  architecture, NFRs, and the roadmap checklist. No `docs/handoffs/`,
  `docs/adr/`, or `LESSONS.md` on this branch.
