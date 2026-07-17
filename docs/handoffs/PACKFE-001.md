# PACKFE-001 — Project scaffolding: routing, query client, design tokens, base layout

## Context

First ticket in `packing-list-react`. Everything else in the backlog
depends on this: the route skeleton, query client, design tokens, and
test tooling it sets up are the foundation every later feature ticket
builds on. The project is currently an untouched Vite scaffold (React
19.2.7, Vite 8.1.1, Tailwind v4.3.2, TanStack Query 5.101.2, TypeScript
~6.0.2) — no router, no test tooling, `src/` only has default
boilerplate.

**Design gate**: this ticket implements decisions already made in ADRs
003 (routing), 004 (state management), 005 (component structure &
styling) — it doesn't introduce a new architectural pattern. A couple of
small mechanics weren't covered by any ADR and are recorded here instead,
per the same "small enough for the handoff doc, not a dedicated ADR"
call made on PACK-032:

- **Vite dev proxy**: the Go API has no `/api` prefix on its own routes
  (`GET /categories`, not `GET /api/categories`). The frontend proxies
  `/api/*` to `http://localhost:8080` with the prefix stripped before
  forwarding, so frontend code always calls `/api/categories` etc. One
  proxy rule, and it happens to mirror a common production reverse-proxy
  shape if that's ever the deployment target.
- **TypeScript strict mode**: `tsconfig.app.json` (from the Vite
  scaffold) didn't set `"strict": true` — nobody had decided this on
  purpose. Enabled now, at zero cost, before any app code exists.

Key decisions from the interview (2026-07-17):

- **Design tokens were extracted from the two design files by tracing
  which CSS property each color is actually used with** (not just
  frequency), since these can't be visually rendered — e.g. `#C65F3D`
  confirmed as the primary accent via `a{color:#C65F3D}`, `#A84B2D`
  confirmed as its hover state via `a:hover{color:#A84B2D}`, `#FAF5EC`
  confirmed as the on-primary text color via a literal
  `background:#C65F3D;color:#FAF5EC` button. Full mapping in AC3 below.
- **A `const cols = [...]` array found in the decoded design files turned
  out to be a confetti celebration-animation palette** (triggered on a
  "celebrate" state, likely finishing packing a trip), not a
  per-category color system as first suspected. Three of its colors
  (`#C89B3C`, `#8A5A83`, `#3F7E8C`) only ever appear in that context and
  are **not** included as design tokens in this ticket — deferred to
  whichever Trips ticket (PACKFE-010's territory) actually builds that
  effect, citing this finding.
- **Fonts**: the designs use 'Bricolage Grotesque' for headings/large
  numbers and 'Karla' for body text. ADR 005 only named the former —
  Karla is a confirmed addition, added as `font-body` alongside
  `font-heading`. ADR 005 gets a one-line addendum noting this.
- **UI primitives are visual-variants-only**: Button (primary/secondary
  - the design's pill border-radius), Modal (static box, design's
    border-radius/shadow, no focus-trap/escape-key/portal logic), Badge
    (pill shape, color prop), Input (bordered box matching tokens). No
    interaction logic beyond what's needed to render — the first real
    consumer (PACKFE-003 onward) adds behavior it actually needs, rather
    than this ticket guessing at unstated requirements.
- **Vitest environment**: jsdom, over happy-dom — more spec-complete,
  matters more than raw speed at this suite's size.
- **Playwright**: `webServer` auto-starts only the Vite dev server
  (`npm run dev`) — no assumption about where `packing-list-go` lives on
  disk. A shared `e2e/require-api.ts` helper (`requireApi()`) is added
  for future specs that need real API data — they call it in their own
  `test.beforeAll`, and it fails fast with a clear message
  (`packing-list-go API not responding at .../health. Start it: go run
main.go`) rather than a bare connection-refused error buried in a
  browser trace. This ticket's own smoke spec is a Playwright
  tooling-sanity check (proves Playwright itself is wired up), not a
  feature test — it does **not** call `requireApi()`, since it never
  touches the API.

## Acceptance criteria

- [ ] React Router installed; route skeleton in place per
      [ADR 003](../adr/003-routing.md) (`/login`, `/auth/callback`,
      `/trips`, `/trips/:id`, `/templates`, `/templates/:id`, `/library`,
      `/profile`) — each may render a placeholder, but every route
      exists and is navigable.
- [ ] `QueryClientProvider` wired in `main.tsx`.
- [ ] `tailwind.config` (or CSS `@theme`, per Tailwind v4 convention)
      extended with: - Colors: `background` (`#FFFDF8`, `#F6EFE2`), `border`
      (`#EADFCE`), text tiers `heading` (`#2A211C`), `body`
      (`#5E5348`), `secondary` (`#8A7B6C`), `muted` (`#A2937F`),
      `tertiary` (`#7A6E60`); `accent` (`#C65F3D`) with `accent-hover`
      (`#A84B2D`) and `on-accent` (`#FAF5EC`); `accent-secondary`
      (`#3E6B4F`) with `on-accent-secondary` (`#2E5140`); `notice-bg`
      (`#F5E0DC`) with `notice-text` (`#B0504F`). - Fonts: `font-heading` (Bricolage Grotesque), `font-body` (Karla). - Border-radius scale reflecting the design's observed values
      (pill: 999px for buttons/badges; card/input tier around
      14-22px).
- [ ] `src/components/ui/` scaffolded with `Button`, `Modal`, `Badge`,
      `Input` — visual variants only, styled against the tokens above,
      no interaction logic beyond what's needed to render.
- [ ] Base app shell renders: tab-style nav for Trips/Templates/Library,
      a separate profile entry point (avatar/initials, matching the
      design's corner placement — not a fourth main tab).
- [ ] `tsconfig.app.json` has `"strict": true`.
- [ ] `vite.config.ts` proxies `/api/*` to `http://localhost:8080`,
      stripping the `/api` prefix before forwarding.
- [ ] Vitest + `@testing-library/react` installed and configured
      (jsdom environment); one smoke test confirms the runner works
      end to end.
- [ ] Playwright installed and configured; `webServer` auto-starts
      `npm run dev` only (`reuseExistingServer: true`); one smoke spec
      confirms the app shell renders with Trips/Templates/Library nav
      links present. `e2e/require-api.ts`'s `requireApi()` helper exists
      for future specs to use — this ticket's own spec doesn't call it.
- [ ] [ADR 005](../adr/005-component-structure-and-styling.md) gets a
      one-line addendum noting Karla as the confirmed body font.

## Non-goals

- Any real feature screens (Trips/Templates/Library/Profile content) —
  placeholders only. That's Epics 3-6.
- `AuthContext`, sign-in flow, or any auth-gating of routes — that's
  `PACKFE-003`.
- The hand-written API client/types (`src/api/`) — that's `PACKFE-002`.
- Confetti/celebration design tokens — deferred to the Trips ticket that
  builds that effect (PACKFE-010's territory).
- Interaction logic on UI primitives (focus trap, loading states,
  disabled variants) beyond what's needed to render the visual shell.
- A dedicated ADR for the proxy-rewrite or TS-strict decisions —
  considered and declined; see "Design gate" above.

## Expected test files

- **Vitest**: one smoke test (e.g. `src/App.test.tsx`) rendering the app
  shell and asserting it mounts without error — proves the Vitest +
  Testing Library + jsdom setup works end to end. Traces to the Vitest
  AC above, not a specific feature AC (this ticket has none yet).
- **Playwright**: `e2e/smoke.spec.ts` — navigates to `/`, asserts the
  Trips/Templates/Library nav links are visible. Traces to the Playwright
  AC above. Does not call `requireApi()`.
- **`e2e/require-api.ts`**: not a test file itself — a shared helper for
  future specs, added now so every subsequent ticket's Playwright specs
  have it available rather than each reinventing the same health check.
- No `.http`-equivalent manual file for this ticket (no API calls yet).
  Manual verification is `npm run dev` + a visual check that the shell,
  nav, and placeholder routes render per the design tokens.
