# Epic 7: Profile

Full implementation history for PACKFE-007. Split out from `master-spec.md`
on 2026-07-31 — see `foundations.md`'s header note for why.

### Epic 7: Profile

- **PACKFE-007** — Profile & sign-out — **Done** (2026-07-24)
  - [x] `ProfileScreen.tsx` renders the profile card (avatar, name,
        email, "Signed in with Google" badge) — matches
        `../../profile-page-handoff.html`'s mobile + desktop states
        (screenshotted 2026-07-24). No stats row (Trips/Items/Archived
        counts) — no backend support exists yet; not planned as a
        follow-up unless revisited later.
  - [x] Shared `Avatar` component (`src/components/ui/Avatar.tsx`):
        renders `user.avatarUrl` as the primary image, falls back to an
        initials circle (via a pure `getInitials(name)` helper) on a
        missing/broken image. Used by both `ProfileScreen` and
        `DesktopSidebar`'s account row.
  - [x] `getInitials(name)` unit-tested with Vitest, same pattern as
        `useActiveNavKey.test.ts`; the `<img onError>` fallback swap
        itself is presentational — manual verification only.
  - [x] `Button.tsx` gets a `variant?: "default" | "danger"` prop;
        Sign out uses `variant="danger"` (`--color-notice-bg` /
        `--color-notice-text` tokens)
  - [x] Sign-out button wired to the existing `useLogout` hook
        (`src/features/auth/useLogout.ts`) — no new redirect logic
        needed, `RequireAuth` already redirects to `/` once
        `isAuthenticated` flips false
  - [x] Temporary sign-out button + comment removed from
        `TripsScreen.tsx`
