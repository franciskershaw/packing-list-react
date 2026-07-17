# 007 — Responsive strategy

## Status

Accepted (2026-07-17, during `PACKFE-003`)

## Context

Flagged as a known gap at kickoff (`PACKFE-013`'s own backlog entry:
"confirm the intended breakpoint strategy... since it wasn't decided at
kickoff") but deferred to the very end of the backlog — Epic 7, after
Trips/Templates/Library/Profile would already be built. That's the same
shape of mistake as the tooling-baseline gap from `PACKFE-001`: a
cross-cutting concern deferred to one big pass instead of decided early,
so everything built in between accumulates retrofit work. Raised and
settled now, during `PACKFE-003`, before more screens compound the gap —
`LoginScreen` is the first screen with any real styling, making this the
cheapest possible moment to fix it.

**Verified against the actual design data**, not assumed: decoded the
two design files' embedded templates directly. Desktop's containers go
up to `880px` wide; Prototype's widest container caps at `300px` — a
real, evidence-backed gap between two genuinely different layout
targets, not the same design at different zoom levels. Checked for
`position: fixed`/`sticky` (a bottom tab bar would need this) in both —
found none in either file, so there's no evidence the designs intend a
structurally different nav pattern for narrow viewports (e.g. a bottom
tab bar vs. the current top bar). Not inventing one without evidence.

## Decision

- **Breakpoint**: Tailwind's default `md` (768px), no custom
  configuration. Comfortably clears real phone widths (375-430px) so the
  mobile layout owns all realistic phone viewports, and 768px+ gives
  enough room for Desktop's widest containers (880px max) once outer
  page padding is accounted for.
- **Mobile-first authoring**: unprefixed Tailwind classes are the
  mobile/base styling; `md:` (and up) prefixes override for wider
  viewports. This is Tailwind's native paradigm — fighting it with
  desktop-first + `max-md:` overrides would be non-idiomatic for no
  benefit.
- **One component tree per screen**, not separate mobile/desktop
  variants. The two designs differ in spacing/column-count/chrome, not
  information architecture — same content, same features, laid out
  differently. Tailwind's responsive prefixes handle exactly this via
  CSS; separate component variants would mean maintaining two parallel
  implementations of every screen, forever, in sync.

## Applied now, evidence-based only

- `LoginScreen`: gets a `md:max-w-[460px]` cap on its content so it
  doesn't stretch full-width on a wide desktop viewport (`460px` is
  Desktop's own narrowest wide-layout container width, from the design
  data — not invented).
- `AppLayout`: light, defensive responsive adjustments only (safe
  padding/wrapping at narrow widths) — not a structural redesign, since
  no evidence supports one. If the real designs do call for something
  different at mobile widths (e.g. a bottom tab bar), that needs an
  eyes-on-the-design verification pass, not a guess from CSS numbers.

## Alternatives rejected

- **Custom breakpoint tuned to these two specific designs' exact
  container widths**: more precise to this design pair, but a one-off
  value future screens' own dimensions might not validate. Tailwind's
  default `md` already clears the real constraint (phone vs. desktop
  viewport width) without inventing a bespoke number.
- **Desktop-first authoring**: fighting Tailwind's own grain for no
  clear benefit.
- **Separate mobile/desktop component variants**: doubles the
  maintenance surface for every future screen; not justified by what the
  design data actually shows (same IA, different layout).

## Revisit when

- `PACKFE-013` (the originally-planned responsive pass) — confirm this
  ADR's decisions held up once more screens are built, and do the
  eyes-on-the-design verification this ADR couldn't do from CSS numbers
  alone (nav pattern at mobile widths, especially).
- If a future screen's design data reveals information architecture
  that genuinely differs between mobile and desktop (not just spacing/
  layout), not just chrome — revisit the single-component-tree decision
  for that specific screen.
