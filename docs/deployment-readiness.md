# Deployment Readiness

This document tracks production readiness for the Uplinea deployment. It is
configuration-focused and should not store secret values.

## Current Status

- GitHub `main` is connected to the Vercel project
  `coach-ai-poker-planner`.
- Confirmed production URL:
  `https://coach-ai-poker-planner.vercel.app`.
- Confirmed Clerk issuer:
  `https://hip-goshawk-22.clerk.accounts.dev`.
- Confirmed Convex URL:
  `https://insightful-sparrow-614.convex.cloud`.
- Confirmed Convex deployment identifier:
  `dev:insightful-sparrow-614`.
- Production was reconfigured from a clean Clerk + Convex stack on
  2026-05-06.
- The post-reconfiguration production smoke passed manually: the site returned
  HTTP 200, Clerk loaded without the previous publishable-key 500, authenticated
  pages loaded, and signed-in pages no longer showed demo/mock fixtures or the
  "Dados reais indisponiveis" fallback.

## Required Deployment Inputs

Before changing production configuration again, confirm:

- Target Vercel project for Uplinea.
- Target production or staging URL.
- Whether the validation target is Vercel Production or Preview.
- Clerk instance intended for that environment.
- Convex deployment intended for that environment.
- Test account and sign-in method safe for smoke validation.
- Any deploy keys or secret keys have not been pasted into chat, tickets, or
  docs. Rotate them immediately if exposed.

## Required Environment Variables

The deployed app needs these variables configured for the relevant Vercel
environment:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOYMENT=
CONVEX_DEPLOY_KEY=
```

The auth-disabled variables must be empty or disabled in real deployed
environments:

```bash
NEXT_PUBLIC_UPLINEA_DISABLE_AUTH=
UPLINEA_DISABLE_AUTH=
```

`CONVEX_DEPLOY_KEY`, `CLERK_SECRET_KEY`, and `OPENAI_API_KEY` are secrets and
must never be committed or pasted into chat.

## Clerk Readiness Checklist

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` belongs to the intended environment.
- `CLERK_SECRET_KEY` belongs to the same Clerk instance as the publishable key.
- `CLERK_JWT_ISSUER_DOMAIN` matches the issuer configured in Convex.
- The deployed URL is allowed by Clerk for sign-in, callback, and post-auth
  redirects.
- Clerk has a Convex JWT template/integration named `convex`.
- Login works without provider-origin loops.
- Reload preserves the authenticated session.
- Logout returns the app to a signed-out state.

## Convex Readiness Checklist

- Convex functions are deployed to the target environment before frontend smoke.
- `NEXT_PUBLIC_CONVEX_URL` points to the same Convex deployment being validated.
- `CONVEX_DEPLOYMENT` identifies that deployment for builds and CLI workflows.
- Convex environment includes `CLERK_JWT_ISSUER_DOMAIN`.
- Deploy `convex/auth.config.ts` and functions to the same deployment used by
  `NEXT_PUBLIC_CONVEX_URL`.
- Convex Authentication shows:
  - Domain: `https://hip-goshawk-22.clerk.accounts.dev`
  - Application ID: `convex`
- The deployed frontend does not call functions that are missing from the
  target Convex deployment.

## Vercel Readiness Checklist

- The local checkout or documented workflow identifies the correct Vercel
  project for Uplinea.
- Required environment variables are set on the chosen environment
  (`production` or `preview`).
- The latest deployment was built from the intended GitHub `main` commit.
- The deployment exposes the expected URL.
- Vercel deployment protection, if enabled, is accounted for before smoke.
- Runtime logs have no blocking Clerk, Convex, or Next.js runtime configuration
  errors.
- If production returns HTTP 500, check Vercel runtime logs first. On
  2026-05-06, the relevant failure was `Publishable key not valid`, caused by
  an invalid `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` value in Vercel Production.

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
6. Confirm no blocking runtime error, demo/mock fallback, signed-in persistence
   fallback, or missing Convex function error appears.
7. Log out and confirm signed-out UI returns.

If any production or staging smoke fails, classify it before retrying:

- Product bug: reproducible app behavior issue with correct deployment config.
- Deployment/config issue: missing or mismatched Vercel, Clerk, or Convex setup.
- Test issue: smoke account, browser, selector, or deployment-protection issue.

## Current Decision

The current production configuration is considered unblocked. Future auth,
provider, or deployment changes should repeat the production smoke plan above
before closing the slice.
