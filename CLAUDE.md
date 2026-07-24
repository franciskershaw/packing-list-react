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
badly suited to hand-building UI against a visual design. AI's role has
since been split by work type rather than blanket "AI reviews, developer
authors" — see "AI's role on this branch" below.

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
developer is hand-building UI directly against a visual design. AI's
authorship split (UI vs. logic) is defined in "AI's role on this branch"
below, not here. Specifically:

- **No handoff docs.** `docs/specs/master-spec.md`'s roadmap ticket
  (description + rough checklist) is the whole planning artifact. No
  `docs/handoffs/` folder. If a feature needs real back-and-forth before
  starting, that's ordinary chat, not a written doc.
- **No tests-first gate, no AC-per-commit.** Commit at will. Automated
  tests are suggested, not mandated — see Testing below.
- **No ADRs.** Real architectural decisions are recorded inline in
  `docs/specs/master-spec.md`'s Architecture section, not as separate
  ADR docs. No `docs/adr/` folder.
- **A conversation before starting work, not a mandatory `grill-me`
  skill invocation.** Talk through what's being built and reach a shared
  understanding before implementation begins — skip the formal
  skill/handoff-doc ceremony unless a piece of work is genuinely large
  or ambiguous enough to need it. No `close-out` after every ticket, no
  periodic `tech-debt` pass. No `LESSONS.md` on this branch. Mark
  roadmap checklist items done directly in the master spec as you
  finish them.
- **No E2E test suite**, ruled out rather than deferred: the OAuth-only
  auth model makes seeding an authenticated Playwright session
  impractical without adding a dev-only auth-bypass endpoint, which was
  already rejected once as disproportionate risk for a personal app (see
  pre-reset `LESSONS.md`, `main` branch). Revisit only if the auth model
  itself changes.
- **Ticket order is non-binding.** The epic numbering in
  `master-spec.md`'s roadmap is a checklist, not a sequence — work moves
  screen by screen based on what actually makes sense next, pulling in
  whatever other ticket's components are needed to make that screen work
  (e.g. PACKFE-007 pulled in PACKFE-001's `DesktopSidebar` build-out).
  Still one ticket open at a time; "what's next" just isn't determined by
  epic order.

## Testing

Suggestion-only, never a gate. Flag a unit-test opportunity (Vitest,
plus `@testing-library/react` for component/hook behavior — no
Playwright/E2E) whenever logic has real conditional branching, a state
transition, a race/ordering condition, or an edge case a future refactor
could silently break. Don't flag trivial pass-through calls, pure
presentational markup, or declarative wiring (e.g. a route table) — a
suggested test that doesn't guard a real risk is wasted effort. Flag it
wherever it comes up: during the pre-work conversation for new work, or
opportunistically mid-implementation/review if something testable
surfaces that wasn't anticipated. When flagged and accepted, write the
test before the implementation it covers.

`@testing-library/react` and Playwright are **not currently installed**
(removed in the reset; Vitest itself remains). Re-add
`@testing-library/react` the first time a flagged test actually needs
it, and verify a trivial smoke test passes then — don't pre-scaffold it
now for tests that don't exist yet.

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

Split by whether the file renders a screen or visual component with
real layout/styling decisions, or is pure logic:

- **UI/markup with a design artifact for it** (a screen or component
  with a corresponding Claude Design handoff export _and_ a current
  screenshot of the specific target state, reviewed before any code is
  written — see Design artifacts below): AI can author it directly.
  Developer reviews visually against the same screenshot afterward and
  iterates. This replaced an earlier "developer authors all UI" rule —
  PACKFE-007 showed the screenshot-grounding requirement, not
  authorship, was the actual fix for this project's original
  visual-fidelity problems (see `LESSONS.md`, 2026-07-24). If a screen
  has real interactivity (forms, drag/drop, modals, multi-step flows),
  call that out explicitly during `grill-me` — a design handoff may not
  capture that behavior fully, and the task may need breaking into
  smaller chunks before AI authors any of it.
- **UI/markup with no design artifact yet**: developer authors it. AI's
  role stays assist/review — design-comparison feedback, code review,
  pairing.
- **Logic** (hooks, API clients, context/state, route guards, utils —
  anything without meaningful JSX layout, even if it returns trivial
  passthrough JSX): AI can author it by default, once a shared
  understanding of what's being built is reached in conversation (see
  "A conversation before starting work" above).

Either way, implementation only starts once the developer gives an
explicit go-ahead for the ticket as a whole — one go-ahead per ticket,
not a re-confirmation per file or per extraction.

## Structure conventions

A constant, type/interface, or small helper does not get its own file
until it has a real second consumer outside the module that currently
owns it. Until then, it's colocated in whichever file already owns that
concept — prefer the data-producing module for types (e.g. a shape
returned by `api.ts` lives in `api.ts`), and the shared-state module for
cross-cutting config constants (e.g. a routing default lives in the
context file that also exports its query key). The same test applies to
wrapper components and hooks: a route guard, gate, or similar wrapper
only gets its own file once it has real existing reuse across call
sites, or is a distinct routed screen — a single-call-site wrapper is
inlined at the call site instead (a ternary + `<Navigate>`, not a
dedicated component).

Feature folders (`src/features/<name>/`) stay flat — no
`components/`/`hooks/` subfolders — until a folder passes 8 files.
Revisit the split only then.

Apply this by default while writing new code, not just when asked to
simplify — self-check new files/components against it before calling a
feature done.

## Docs

- `docs/specs/master-spec.md` — the only living doc: goals, use cases,
  architecture, NFRs, and the roadmap checklist. No `docs/handoffs/`,
  `docs/adr/`, or `LESSONS.md` on this branch.
