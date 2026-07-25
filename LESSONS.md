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

## 2026-07-24 — PACKFE-008 — Radix Dialog's defaults assume `<Dialog.Trigger>`; ours doesn't use one

Lightweight entry (checklist + this note only, no retro interview) — no
process questions this time, just implementation traps worth writing down
before the four real use cases build on top of `Modal.tsx`.

- Radix's own `FocusScope` (used internally by `Dialog.Content`) already
  captures and restores the previously-focused element correctly, with no
  `Dialog.Trigger` required. But `Dialog`'s own wrapper unconditionally
  calls `event.preventDefault()` in its default `onCloseAutoFocus` handler
  and then tries `context.triggerRef.current?.focus()` — which is always
  `null` for us, since we mount/unmount `Modal` externally instead of
  rendering `<Dialog.Trigger>`. Net effect: Radix's good default gets
  silently blocked by Radix's own bad-for-us default, with nothing
  visibly broken (focus just goes nowhere) — no error, no warning, easy
  to ship without noticing. Fixed with a small unmount-effect that
  captures/restores focus ourselves.
- **Pattern**: when adopting a headless UI primitive that assumes a
  specific usage shape (here: an always-rendered `Trigger` + internal
  open state), verify its stated defaults actually engage under _your_
  usage pattern before trusting them — don't assume "well-tested primitive"
  transfers to "well-tested for how we're using it." Caught here because
  the test suite asserted focus restoration directly, not by inspection.
- Backdrop-dismiss isn't a raw `pointerdown` — Radix defers it to the
  `click` event that follows (`deferPointerDownOutside`), and registers
  its outside-pointerdown listener via `setTimeout(0)`. Tests simulating
  outside-clicks need to fire both events and let a tick pass first.
- `fireEvent.click()` doesn't simulate the browser's native click-to-focus
  behavior — a test asserting focus behavior around a click needs an
  explicit `.focus()` call first, `fireEvent.click()` alone isn't enough.
- We hardcode `open` as literally `true` on `Dialog.Root` (mount/unmount is
  fully external). This works fine for open/dismiss behavior but means
  Radix's Presence never witnesses a real open→closed transition — so
  anything gated on that (the good focus-restoration default above, and
  any future exit animation) won't fire. Revisit only if exit animations
  are wanted later; would mean switching `Modal` to an `open` prop with
  Radix's Presence managing unmount timing instead of the parent.

## 2026-07-25 — PACKFE-003 Piece 2 — Button-family split needed a second pass; two skill/CLAUDE.md frictions fixed at the source

- First pass folded only `DashedAddRow` into `Button` (`dashed` variant),
  keeping `Chip`/`DeleteIconButton` as separate hand-rolled `<button>`s on
  the theory their styles differed too much to share. Incomplete —
  `cursor-pointer` got forgotten on both independently. Fixed by
  extracting a shared `InteractiveButton` primitive (cursor,
  `type="button"`), colocated in `Button.tsx` rather than a new file
  since it's two lines.
- **Pattern**: when several atoms render the same element, separate
  whatever differs but still extract a shared primitive for whatever's
  universal and easy to forget — "these look different" isn't evidence to
  share nothing.
- `SearchField` renamed to `TextField` mid-build — named for its first
  call site rather than what it actually is; a screenshot recheck against
  a second, unrelated consumer caught it.
- Dev-server ownership (developer runs/checks, AI doesn't) codified
  directly in this project's `CLAUDE.md`, not just AI memory — more
  durable, visible to future work here too.
- `grill-me`'s handoff-doc section updated to check for a project
  override before assuming its default applies — this project's override
  was re-litigated as a "conflict" at the start of nearly every session;
  now checked and deferred to silently.

## 2026-07-26 — PACKFE-003 Piece 4 — Item creation shipped; hands-on use surfaced two real bugs tests couldn't

- No rework on the modal itself — design held from grill-me through
  implementation. The real friction was three gaps outside the ticket's
  own code: `@testing-library/jest-dom` wasn't installed yet (added, first
  trigger for it), the dev DB had zero categories because
  `packing-list-go`'s seed script was a silent no-op (fixed cross-repo as
  **PACK-033**, same day), and no local `psql` meant pivoting verification
  to Neon's web SQL Editor mid-ticket.
- Once real item creation was actually usable, hands-on use (not the test
  suite) caught a genuine toast-contrast bug (`text-on-accent-secondary`
  paired against a near-identical green — should've been `text-on-accent`,
  `Avatar.tsx`'s existing pairing for that background) and a missing
  delete-confirmation step.
- **Pattern**: React bubbles portal-rendered events through the
  _component_ tree, not the DOM tree — a `Modal`/`ConfirmDialog` rendered
  from inside a clickable row will have every click inside it also reach
  the row's own `onClick` unless stopped at the dialog's own boundary.
  Worth remembering for any future modal nested inside a clickable
  parent, not just this one.
- **Pattern**: a green test suite plus a prior screenshot check didn't
  surface either bug above — both needed the developer actually using the
  running feature. Reinforces this project's existing manual-verification
  convention rather than adding anything new to it.

## 2026-07-26 — PACKFE-003 Piece 5 — Manage-categories modal shipped; same hands-on-use pattern as Piece 4, twice over

- No rework on the interview/implementation itself — component split,
  item-count derivation, and button styling all landed as decided. The one
  real correction was mid-build and caught by the test suite, not by hand:
  Escape-to-cancel via `stopPropagation` on the rename input doesn't work,
  because Radix's Escape-to-close listener runs in the capture phase on
  `document`, always ahead of a descendant's bubble-phase handler. Fixed
  via Radix's own `onEscapeKeyDown` extension point on `Dialog.Content`
  (now forwarded through `Modal`).
- Hands-on use again caught what tests and a screenshot check didn't:
  oversized `ConfirmDialog` buttons and a delete-icon layout shift, both
  pre-existing since Piece 4's `ConfirmDialog`/`DeleteIconButton`.
  Diagnosed the shift precisely rather than guessed — live
  `getBoundingClientRect` measurement (browser tool against the
  already-running dev server, used only after asking permission) showed
  `ConfirmDialog`'s `stopPropagation` wrapper div sitting as a real, empty
  flex item in the row (Radix portals the actual dialog elsewhere), eating
  a `gap` unit. Fixed with `className="contents"`.
- **Pattern**: this is the second ticket running where real UI bugs only
  surfaced via the developer actually using the feature, not tests or a
  pre-build screenshot check — treat hands-on use as load-bearing
  verification, not a formality, and expect a bug-fix round after every
  screenshot-grounded piece.
- Comment verbosity was corrected twice in the _same_ session — after
  being told once and saving a memory on it, the same pattern reappeared
  in the very next edits before self-correction. A memory checked
  passively isn't enough; needs active self-checking before writing any
  `/** */` block.

## 2026-07-25 — PACKFE-003 Piece 6 — Library screen assembled; ticket (and Epic 3) closed

- No rework on the assembled screen itself. Real friction was post-
  implementation: an error-toast-on-fetch-failure first pass put a
  `useEffect` directly in `LibraryScreen`, correctly rejected as the wrong
  layer. The fix took two more rounds — a `useApiQuery` wrapper still
  using `useEffect` internally wasn't it either — before landing on
  wrapping the actual `queryFn` in try/catch (mirroring `useApiMutation`'s
  shape exactly), no `useEffect` anywhere.
- **Pattern**: when asked "why isn't there just an X" about a library API,
  check the actual installed type definitions before answering from
  memory — confirmed here that `onError` was removed from `useQuery`
  entirely in TanStack Query v5 by reading `node_modules`' own `.d.ts`,
  not recalled/assumed.
- Grill-me resolved two mobile/desktop screenshot conflicts (subtitle
  copy, filter-chip label) with different sources winning each —
  deliberate case-by-case calls, not a standing "mobile wins" rule.
- Found a live conflict between `CLAUDE.md`'s stated override ("no
  close-out, no LESSONS.md on this branch") and actual practice (this
  file has been maintained every piece) — flagged and resolved by asking
  rather than silently picking a side. `CLAUDE.md`'s text itself is now
  stale and should be corrected, not just worked around again next time.
- **Follow-up noted, not solved here**: Manage-categories modal's
  scrolling UX needs improvement — flagged during close-out, not
  diagnosed further. See `master-spec.md`'s parking lot.
- Ran demotion check for Epic 3 close-out (only ticket in the epic) —
  nothing needed compressing; the rules touched during this epic
  (`Button` compact variants, `TextField` `onSubmit`, chip selected-state
  resolution) are already stated as concrete precedents, not incident
  narratives.
