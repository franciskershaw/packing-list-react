# 005 — Component structure & styling conventions

## Status

Accepted (2026-07-17, project kickoff)

## Decision

**Folder structure**: feature folders, not atomic-design layering.

```
src/
  api/            # hand-written types (ADR 002), fetch wrappers
  app/            # router setup (ADR 003), root layout, AuthContext (ADR 004)
  features/
    auth/         # login screen, /auth/callback, auth-specific components
    trips/        # trip list, trip detail, pack/unpack UI
    templates/    # template list, template detail
    library/      # categories + items management
    profile/      # profile menu, sign out
  components/
    ui/           # Button, Modal, Badge, Input — shared, feature-agnostic primitives
  lib/            # query client setup, small utils
```

A component only belongs in `components/ui/` if at least two features
use it unchanged. Feature-specific styling of a shared primitive (e.g. a
trips-specific button variant) stays in `features/trips/`, composing the
shared primitive rather than forking it.

**Design tokens**: pulled into `tailwind.config` up front in PACKFE-001,
sourced from the two design files (`Packing App Desktop - bundled.html`,
`Packing App Prototype - bundled.html`) — color palette and the
Bricolage Grotesque type family confirmed present in both. Every feature
styles against these tokens rather than picking colors/spacing by eye
per screen.

**Addendum (2026-07-17, PACKFE-001)**: the design also uses 'Karla' for
body text throughout, with Bricolage Grotesque reserved for
headings/large numbers — not caught at kickoff. Token set is
`font-heading` (Bricolage Grotesque) + `font-body` (Karla).

## Alternatives rejected

- **Atomic design** (atoms/molecules/organisms): stricter layering by
  component complexity rather than feature. Rejected as more ceremony
  than this app's size warrants — the atoms/molecules boundary tends to
  be argued over rather than obviously correct, and feature folders map
  more directly onto how the ticket backlog itself is organized (Library,
  Templates, Trips, Profile epics).
- **Flat `components/`, no tokens yet**: fastest to start, extract tokens
  later if drift becomes a problem. Rejected — the 2026-07-11 API audit's
  frontend-adaptation notes specifically call out that frontend design
  tokens are the precedent-equivalent of the backend's "mirror existing
  REST CRUD" convention; skipping them at kickoff means every subsequent
  ticket re-litigates color/spacing choices instead of citing a source.

## Revisit when

If a feature folder grows large enough that its own internal
components/hooks/tests split becomes unwieldy as a flat list — introduce
a `components/` and `hooks/` subfolder *within that feature* at that
point, not across the board pre-emptively.
