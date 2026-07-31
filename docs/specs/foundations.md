# Epic 1: Foundations

Full implementation history for PACKFE-001. Split out from `master-spec.md`
on 2026-07-31 as part of trimming that file down to a lean, high-level
reference — this doc holds the AC-level detail; `master-spec.md` just
tracks the ticket as done and points here.

### Epic 1: Foundations

- **PACKFE-001** — App shell & plumbing — **Done**. Checklist below was
  never ticked off in step even though the work landed (some of it
  folded into later tickets, e.g. PACKFE-007) — confirmed complete
  2026-07-31 by reading current source (`main.tsx`, `index.css`,
  `src/components/nav/`, `src/app/AppRoutes.tsx`) rather than re-verifying
  each line item individually.
  - [x] React Router installed, one placeholder route renders (`src/app/AppRoutes.tsx`)
  - [x] `QueryClientProvider` wired in `main.tsx`
  - [x] Tailwind config extended with design tokens (color palette, font)
        pulled from `desktop.html`/`prototype.html`
  - [x] `src/components/ui/` scaffolded with Button, Badge, Input
        primitives (styling only). Modal split out to PACKFE-008 — bigger
        in scope (new dependency, accessibility contract) than "styling
        only" covers.
  - [x] Base app shell renders: nav matching Trips/Templates/Library, a
        profile entry point - [x] Two components sharing data via a hook, per the responsive
        strategy above (different elements/interaction, not just
        rearrangement): `MobileTabBar.tsx` (bottom, floating) +
        `DesktopSidebar.tsx` (left rail), both in
        `src/components/nav/`, driven by a shared `navItems.ts`
        (Trips/Templates/Library/Profile, each with a
        `showAs: "tab" | "accountRow"` flag) - [x] `AppShell.tsx` (`src/components/nav/`) wraps authenticated
        routes via nested `<Route>` + `<Outlet>`; `AppRoutes.tsx`
        restructured so `/trips`, `/templates`, `/library`,
        `/profile` nest under it. Sign-in stays outside the shell. - [x] Switch point: Tailwind `lg` (1024px) - [x] Mobile bar: `fixed` (not `absolute`), bottom offset adds
        `env(safe-area-inset-bottom)`; main content gets a shared
        bottom-padding constant from the shell, not hardcoded per
        screen - [x] Desktop: `h-screen flex` in the shell, sidebar `shrink-0`,
        sidebar and content each independently `overflow-y-auto` - [x] Desktop account row navigates to `/profile` (same
        destination as mobile's Profile tab), no dropdown menu;
        shows real `user.avatarUrl`, not a fabricated-initials
        placeholder - [x] `/templates`, `/library`, `/profile` get minimal "coming
        soon" placeholder screens matching `TripsScreen.tsx`'s
        existing pattern - [x] Add `--color-accent-subtle: #f6e3d9` to `index.css`'s
        `@theme` - [x] `useActiveNavKey` hook (pathname → active key) gets a
        Vitest unit test for its branching; presentational nav
        components stay untested
  - [x] `DesktopSidebar.tsx` renders real content (currently a
        placeholder box) — matches `../../profile-page-handoff.html`'s
        desktop state (screenshotted 2026-07-24): "Pack-It" wordmark (no
        tick icon — deliberate deviation from the design, see
        `LESSONS.md`), Trips/Templates/Library rows via shared
        `navItems.ts`, bottom-pinned account row (avatar + name + email,
        shared `Avatar` component, navigates to `/profile`, highlighted
        via `bg-accent-subtle` when active — same treatment as active
        nav rows). Built alongside PACKFE-007, tracked here since it's
        shell scope, not profile-screen scope.
