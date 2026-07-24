# Lessons

Running retro log for `packing-list-react`. Reviewed at the start of every
new ticket's grill-me and at project kickoff.

## 2026-07-24 — PACKFE-007 — Screenshot-grounded AI authorship replaces the blanket "developer authors all UI" rule

- No rework on the feature itself. The two rounds of visual review (active-state
  styling, logo size on `DesktopSidebar.tsx`) were quick, targeted fixes, not
  do-overs — caught because a real screenshot was checked against the running
  app, not because AI avoided writing the JSX.
- The original "developer authors all UI/markup" rule (`CLAUDE.md`) was a
  blunt-force fix bundled together with a separate, more precise one:
  "always work from a current screenshot, never a design export's markup."
  This ticket separated the two — AI authored `DesktopSidebar.tsx` and
  `ProfileScreen.tsx` directly from real screenshots, and fidelity held up
  fine. The screenshot-grounding requirement was the load-bearing fix all
  along, not the authorship split.
- **Pattern**: when a screen has both a Claude Design handoff export and a
  reviewed screenshot of its target state, let AI author it and have the
  developer review/iterate against the same screenshot afterward — don't
  require hand-authoring by default anymore. Still call out real
  interactivity (forms, drag/drop, modals, multi-step flows) explicitly
  during `grill-me`, since a design handoff may not capture that behavior,
  and be ready to break such a screen into smaller chunks before AI authors
  any of it. `CLAUDE.md` updated same-day to reflect this as a standing
  rule, not a per-ticket override.
- **Pattern**: ticket order in `master-spec.md`'s roadmap is non-binding —
  work moves screen by screen based on what makes sense next, pulling in
  whichever other ticket's components are actually needed (this ticket
  pulled in PACKFE-001's `DesktopSidebar` build-out rather than waiting for
  PACKFE-001 to close first). Still one ticket open at a time.
- Design screenshots caught two real scope gaps a written checklist alone
  wouldn't have: a stats row with no backend data behind it (cut entirely,
  not deferred — no `packing-list-go` endpoint exists and none is planned
  unless revisited) and a nav-icon mismatch versus the design (kept as-is,
  a deliberate call, not a bug).
- `getInitials`/`Avatar.tsx` trips `oxlint`'s `react/only-export-components`
  warning (mixing a component export with a plain-function export blocks
  Fast Refresh). Left as-is — it's `"warn"`, not `"error"`, in
  `.oxlintrc.json`, and `AuthContext.tsx` already has the same shape.
  Splitting a helper into its own file purely to silence this would fight
  the project's own "no new file until a real second consumer" rule for a
  helper that only has one.
- "Pack-It" was adopted as literal placeholder wordmark text in
  `DesktopSidebar.tsx`, a deliberate one-off exception to "avoid
  introducing a product name into code" — noted here rather than treated as
  a rule change; revisit if/when a real name is chosen.
- This branch's own "no close-out" convention was explicitly overridden to
  run this close-out — specifically to have the process-streamlining
  conversation above. Not a standing change to that convention; future
  tickets still default to no close-out unless asked for again.
- Ran the Epic 7 demotion check as part of this close-out (PACKFE-007 is
  Epic 7's only ticket) — nothing needed compressing, `CLAUDE.md` wasn't
  touched during this epic before today.
