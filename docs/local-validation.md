# Local Validation Workflow

This workflow keeps implementation slices small and repeatable while the product
design is still evolving.

## Slice-End Rule

At the end of each implementation slice:

1. Stop implementation work.
2. Ask whether validation should run now, unless the user has already approved
   lightweight validation for technical slices.
3. Run only the checks that match the slice risk.
4. Report results before starting the next slice.

Do not commit unless the user explicitly asks for a commit.

## Runtime

Use the Node version from `.nvmrc` before running app commands:

```bash
nvm use
```

The expected runtime is Node 22. Running Next.js with Node 18 fails before the
build starts.

## Standard Checks

For most technical slices:

```bash
npm run lint
npm run build
```

For Convex backend-only changes:

```bash
npm run convex:typecheck
```

Use `npm run convex:codegen` only when Convex generated bindings should be
refreshed. Use `npm run convex:dev` when a linked Convex dev deployment is
needed.

For shell helper changes:

```bash
bash -n scripts/coach-dev.sh
```

For mock-mode safety when touching Clerk, Convex, providers, proxy, or env
wiring:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= \
CLERK_SECRET_KEY= \
CLERK_JWT_ISSUER_DOMAIN= \
NEXT_PUBLIC_CONVEX_URL= \
CONVEX_DEPLOYMENT= \
npm run build
```

## Local Smoke

Use the dedicated Coach AI port:

```bash
npm run dev:coach:bg
npm run dev:coach:status
curl -fsS -I http://localhost:3100
```

Expected result:

- `dev:coach:status` reports the server running on `http://localhost:3100`.
- `curl` returns `HTTP/1.1 200 OK`.

If port `3100` is unavailable, use:

```bash
COACH_DEV_PORT=3101 npm run dev:coach:bg
curl -fsS -I http://localhost:3101
```

## Browser Smoke

Use browser smoke checks when a slice changes visible UI, routing, navigation,
or interactive behavior. For purely technical changes, HTTP smoke is enough.

Minimum browser smoke paths:

- `/`
- `/session/prepare`
- `/session/live`
- `/session/review`

Check that the app loads, the main content is visible, and there are no blocking
console/runtime errors.

## Design Boundary

While the final product design is being worked on externally, avoid visual
product implementation. Stop and ask before changing dashboard layout,
navigation structure, visual hierarchy, final UI components, or planning-system
screens such as Annual direction, Monthly targets, Weekly plan, and Daily
execution.
