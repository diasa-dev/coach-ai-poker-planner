# Deployment Readiness

This document tracks the production or staging readiness checks for DIA-32.
It is intentionally configuration-focused and should not pick a Vercel project
or production URL by approximation.

## Current Status

- DIA-36 is merged and the authenticated MVP smoke is idempotent locally.
- The repository is not currently linked to a Vercel project in local checkout.
- No confirmed Uplinea production or staging URL is documented in the repo.
- Production or staging smoke is blocked until the target Vercel project and URL
  are confirmed.
- Convex production currently resolves to `https://amicable-ladybug-752.convex.cloud`,
  but `npx convex function-spec --prod` reports zero deployed functions.

## Required Deployment Inputs

Before a real production or staging validation, confirm:

- Target Vercel project for Uplinea.
- Target production or staging URL.
- Whether the validation target is Vercel Production or Preview.
- Clerk instance intended for that environment.
- Convex deployment intended for that environment.
- Test account and sign-in method safe for smoke validation.

Do not run production or staging smoke until those inputs are explicit.

## Required Environment Variables

The deployed app needs these variables configured for the relevant Vercel
environment:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
```

The auth-disabled variables must be empty or disabled in real deployed
environments:

```bash
NEXT_PUBLIC_UPLINEA_DISABLE_AUTH=
UPLINEA_DISABLE_AUTH=
```

`OPENAI_API_KEY` is listed in `.env.example`, but current MVP readiness for
DIA-32 is focused on Clerk, Convex, and route/auth deployment behavior.

## Clerk Readiness Checklist

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` belongs to the intended environment.
- `CLERK_SECRET_KEY` belongs to the same Clerk instance as the publishable key.
- `CLERK_JWT_ISSUER_DOMAIN` matches the issuer configured in Convex.
- The deployed URL is allowed by Clerk for sign-in, callback, and post-auth
  redirects.
- Login works without provider-origin loops.
- Reload preserves the authenticated session.
- Logout returns the app to a signed-out state.

## Convex Readiness Checklist

- Convex functions are deployed to the target environment before frontend smoke.
- `NEXT_PUBLIC_CONVEX_URL` points to the same Convex deployment being validated.
- `CONVEX_DEPLOYMENT` identifies that deployment for builds and CLI workflows.
- Convex environment includes `CLERK_JWT_ISSUER_DOMAIN`.
- `npx convex function-spec --prod` or the target deployment equivalent shows
  the expected public functions.
- The deployed frontend does not call functions that are missing from the
  target Convex deployment.

Current blocker: production Convex function metadata currently returns an empty
function list. Deploy/configure Convex production before treating production
smoke failures as product bugs.

## Vercel Readiness Checklist

- The local checkout or documented workflow identifies the correct Vercel
  project for Uplinea.
- Required environment variables are set on the chosen environment
  (`production` or `preview`).
- The latest deployment was built from the intended GitHub `main` commit.
- The deployment exposes the expected URL.
- Vercel deployment protection, if enabled, is accounted for before smoke.
- Build logs have no blocking Clerk, Convex, or Next.js runtime configuration
  errors.

Current blocker: the local checkout is not linked to a Vercel project and no
confirmed Uplinea deployment URL is available.

## Local Validation

Local validation remains available and should be run before any deployment
readiness handoff:

```bash
npm run lint
npm run build
SMOKE_BASE_URL=http://localhost:3100 npm run smoke:mvp:auth
```

The authenticated MVP smoke mutates local/dev data only. It must not be pointed
at an unconfirmed production or staging URL.

## Production or Staging Smoke Plan

Only after the Vercel project, URL, Clerk config, and Convex deployment are
confirmed:

1. Open the confirmed URL.
2. Sign in with the approved smoke account.
3. Confirm the authenticated shell loads without auth/session loops.
4. Reload and confirm the session persists.
5. Navigate core MVP routes:
   - `/`
   - `/weekly`
   - `/monthly`
   - `/study`
   - `/review`
   - `/coach`
   - `/sessions`
6. Confirm no blocking runtime error or missing Convex function error appears.
7. Log out and confirm signed-out UI returns.

If any production or staging smoke fails, classify it before retrying:

- Product bug: reproducible app behavior issue with correct deployment config.
- Deployment/config issue: missing or mismatched Vercel, Clerk, or Convex setup.
- Test issue: smoke account, browser, selector, or deployment-protection issue.

## DIA-32 Decision

DIA-32 should remain In Review while the documentation and local validation are
complete but production/staging validation is blocked by missing deployment
target information and an unconfigured Convex production function set.
