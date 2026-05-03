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

## Layered Validation

Validation should protect product quality without turning every slice into a
full-app regression pass.

Use this default stack for implementation slices:

1. Run the fast required checks:

   ```bash
   npm run lint
   npm run build
   ```

2. Run a focused smoke for the changed behavior.
3. Add 2-4 adjacent routes or flows that directly interact with the changed
   behavior.
4. Expand to extended smoke only when the slice changes shared infrastructure
   or persistence.

Extended smoke is required for changes touching:

- Clerk, Convex providers, proxy, or environment wiring
- Convex schema, indexes, or public functions used by the frontend
- Navigation, app shell, route layout, or cross-page state
- Persistence flows such as Weekly Plan, Today commitments, Sessions, Review,
  or Coach proposal application
- Any flow where a saved record is later consumed by another page

Use demo smoke when the goal is UI behavior, visual state, or local interaction.
Use authenticated smoke when the goal depends on Clerk identity, Convex
ownership, saved records, or session-specific behavior.

If a smoke fails, classify it before retrying:

- Feature bug: fix the implementation and rerun the focused smoke.
- Infra/env issue: document the blocker and switch to the stable smoke path if
  it still validates the slice.
- Test issue: fix the smoke script or selector before drawing product
  conclusions.

Avoid repeated ad hoc browser attempts. Prefer adding or updating a reusable
script such as `smoke:coach`, `smoke:sessions`, `smoke:review`, or
`smoke:weekly-today` when the same flow will be tested again.

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

When a slice changes Convex schema or public functions used by the frontend,
push the functions to the linked dev deployment before browser smoke:

```bash
npx convex dev --once --typecheck enable
```

If this is skipped, the browser can load new frontend code while Convex still
serves the old function set, causing errors such as `Could not find public
function`.

For shell helper changes:

```bash
bash -n scripts/coach-dev.sh
```

For mock-mode safety when touching Clerk, Convex, providers, proxy, or env
wiring:

```bash
UPLINEA_DISABLE_AUTH=1 \
NEXT_PUBLIC_UPLINEA_DISABLE_AUTH=1 \
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= \
CLERK_SECRET_KEY= \
CLERK_JWT_ISSUER_DOMAIN= \
NEXT_PUBLIC_CONVEX_URL= \
CONVEX_DEPLOYMENT= \
npm run build
```

For browser smoke that must not depend on Clerk sessions or matching Clerk keys,
start the app with auth disabled:

```bash
npm run dev:smoke
SMOKE_BASE_URL=http://localhost:3103 npm run smoke:coach
```

This mode intentionally uses demo data and skips Clerk/Convex providers. Use it
for UI and route smoke. Use the normal authenticated dev server separately when
the slice specifically changes persistence or auth behavior.

When Clerk is enabled locally, use `http://localhost:<port>` in the browser and
smoke scripts. Do not use `http://127.0.0.1:<port>` for authenticated smoke:
Clerk development instances can treat that as a different origin and enter a
session refresh loop.

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
