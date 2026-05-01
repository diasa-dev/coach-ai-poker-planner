# Coach AI Poker Planner

Dashboard-first productivity and accountability app for professional online poker tournament players.

## Current Slice

This repository is in Slice 1: technical foundation.

Implemented:

- Next.js App Router
- TypeScript
- Tailwind v4 global styling
- Dashboard prototype migrated to React
- Product brief in `docs/product-brief.md`
- Static prototype preserved in `docs/prototype-static/`

Planned next:

- Create Clerk and Convex projects
- Add local environment values
- Persist the daily check-in and commitments
- Keep AI Coach mocked until real data flow is stable

## Local Development

Use Node 22:

```bash
nvm use
```

Start the local app:

```bash
npm run dev
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

## Notes

User-facing UI should be Portuguese from Portugal.

Code, schema, commits, and technical docs should stay in English.
