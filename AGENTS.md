<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Working Rules

- Build in small implementation slices. Do not expand into adjacent product areas unless the user explicitly approves that slice.
- At the end of every implementation slice, stop and ask the user whether to run validation now. The user may want to add more work before validation.
- If the user approves validation, run the relevant checks for the slice, such as typecheck, lint, build, tests, and local smoke checks when available.
- Use layered validation. Every implementation slice gets the fast required checks plus a focused smoke for the changed behavior. Expand to broader smoke only when the slice risk justifies it.
- For every implemented feature, run a smoke test that deeply covers the feature itself, the app surfaces it interacts with, and any adjacent flows likely to be affected. This does not mean testing the whole app every time; match the smoke breadth to the risk.
- Run extended smoke when changing auth/providers/env, Convex schema or public functions, navigation/layout shell, persistence flows, or shared flows across Weekly Plan, Today, Sessions, Review, and Coach.
- Prefer stable scripted smoke over ad hoc browser scripts. Use demo smoke for UI/flow validation when persistence is not the target, and authenticated smoke only when the feature depends on user/session/persistence behavior.
- If smoke fails, classify the failure before trying variants: feature bug, infra/env issue, or test issue. Stop blind retry loops early and switch to the shortest reliable validation path.
- When changing Convex schema or functions, run `npx convex dev --once --typecheck enable` before browser smoke so the linked dev deployment has the same functions as the frontend.
- After validation has no blocking errors, provide a short slice summary with:
  - what changed
  - key files touched
  - validation results
  - known risks or blockers
  - recommended next slice
- Do not start the next slice without user confirmation.
- At the end of every implementation slice/chunk, after validation and before the next slice, reconcile Linear: identify the related issue, add a concise implementation comment, recommend or apply the correct status, move it to In Review if implemented but not fully validated/committed, move it to Done only if validation passed and changes were committed/pushed, create or recommend a new issue if none exists, then stop and wait before new implementation work.
- Keep user-facing UI copy in Portuguese from Portugal. Keep code, schema, commits, and technical documentation in English.
- Do not create generic full pages without a real flow, data model, and product purpose.
- Before implementing any meaningful product feature, new section, page, or major change to an existing section, run the Product Discovery Workflow first. Do not implement until the user approves the direction/spec.

## Product Discovery Workflow

Use this workflow before building or significantly changing areas such as goals, annual targets, session preparation, live session capture, reviews, Coach AI behavior, analytics, notes, or similar product sections.

1. Research first:
   - Look for relevant scientific studies, performance psychology, behavior design, learning science, decision-making, habit formation, elite performance methods, and proven real-world product patterns.
   - Prefer evidence-informed ideas that can be translated into simple product behavior.
   - Do not add complexity only because a concept is scientifically interesting.
2. Bring a short founder-facing brainstorm in Portuguese from Portugal:
   - summarize the most useful findings
   - suggest what the section should include
   - suggest what it should avoid
   - explain the recommended direction simply
3. Ask product questions one at a time:
   - provide a few concrete answer options
   - include the recommended option
   - give a short reason for the recommendation
   - wait for the user's answer before the next question
4. After decisions are clear, create or update the feature spec:
   - objective
   - evidence-informed principles
   - user flow
   - data model
   - UX boundaries
   - success criteria
   - out-of-scope items
5. Only implement after the user approves the spec or explicitly says to proceed.
