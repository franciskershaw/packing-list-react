# Epic 2: Auth

Full implementation history for PACKFE-002. Split out from `master-spec.md`
on 2026-07-31 — see `foundations.md`'s header note for why.

### Epic 2: Auth

- **PACKFE-002** — Google sign-in & session restore — **Done**. Checklist
  below was never ticked off in step even though the work landed —
  confirmed complete 2026-07-31 by reading current source
  (`src/features/auth/SignInScreen.tsx`, `AuthContext.tsx`,
  `RequireAuth.tsx`).
  - [x] Sign-in screen matches the design's Google button treatment
  - [x] Access token held in memory; refresh-on-load restores a session
        without a visible re-login
  - [x] Protected routes redirect to sign-in when unauthenticated
