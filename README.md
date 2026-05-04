# Uplinea

Dashboard-first productivity and accountability app for professional online poker tournament players.

## Current Slice

This repository is in Slice 1: technical foundation.

Implemented:

- Next.js App Router
- TypeScript
- Tailwind v4 global styling
- Dashboard prototype migrated to React
- Product brief in `docs/product-brief.md`
- Planning system redesign spec in `docs/design/planning-system-redesign-spec.md`
- Planning system text wireframes in `docs/design/planning-system-wireframes.md`
- Poker session flow spec in `docs/features/poker-session-flow.md`
- Static prototype preserved in `docs/prototype-static/`

Planned next:

- Create Clerk and Convex projects
- Add local environment values
- Define the Planning System MVP spec
- Treat Annual Direction as Strategic Operating Context for monthly targets, weekly plans, Today, sessions, review, and Coach AI
- Redesign dashboard/navigation around annual direction, monthly targets, weekly plans, and daily execution
- Include poker sessions and Coach AI as active design-system surfaces
- Persist weekly planning data before daily check-ins and commitments
- Keep AI Coach mocked until real data flow is stable

## Product Design Source Of Truth

The active MVP redesign is defined by:

- `docs/features/planning-system.md` for the planning-system product model.
- `docs/features/poker-session-flow.md` for poker session capture and review.
- `docs/design/planning-system-redesign-spec.md` for approved redesign decisions.
- `docs/design/planning-system-wireframes.md` for implementation-ready screen structure.

The static prototype is historical reference only. The archived session-flow docs are historical inputs; the active session direction lives in `docs/features/poker-session-flow.md`.

## Local Development

Use Node 22:

```bash
nvm use
```

Start the local app:

```bash
npm run dev
```

If another local project is already using port 3000, use the dedicated Coach AI
port:

```bash
npm run dev:coach
```

Then open:

```bash
http://localhost:3100
```

To keep the Coach AI dev server running in the background:

```bash
npm run dev:coach:bg
```

Check or stop it with:

```bash
npm run dev:coach:status
npm run dev:coach:stop
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

## Environment

Copy `.env.example` to `.env.local` and fill in the Clerk and Convex values when
those projects exist. Without those values, the dashboard remains available in
mock mode.

For local UI smoke that should not depend on Clerk sessions, use:

```bash
npm run dev:smoke
SMOKE_BASE_URL=http://localhost:3103 npm run smoke:coach
```

This disables Clerk/Convex providers for that server process only and runs the
Coach proposal flow plus adjacent route checks against demo data.

For authenticated Coach smoke against the real Clerk/Convex local session, use
a normal authenticated dev server on localhost first. The first run can be
headful so Clerk stores the session in `.coach-dev/auth-smoke-profile`:

```bash
AUTH_SMOKE_HEADFUL=1 SMOKE_BASE_URL=http://localhost:3103 npm run smoke:coach:auth
SMOKE_BASE_URL=http://localhost:3103 npm run smoke:coach:auth
```

This applies the Coach proposal, verifies the Coach badge in Weekly, checks
Today still loads, and then uses undo to clean up the applied proposal.

When Clerk is enabled, open local dev through `http://localhost:<port>`, not
`http://127.0.0.1:<port>`, to avoid Clerk development-session refresh loops.

## Notes

User-facing UI should be Portuguese from Portugal.

Code, schema, commits, and technical docs should stay in English.
