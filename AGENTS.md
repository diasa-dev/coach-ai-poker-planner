<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Working Rules

- Build in small implementation slices. Do not expand into adjacent product areas unless the user explicitly approves that slice.
- At the end of every implementation slice, stop and ask the user whether to run validation now. The user may want to add more work before validation.
- If the user approves validation, run the relevant checks for the slice, such as typecheck, lint, build, tests, and local smoke checks when available.
- After validation has no blocking errors, provide a short slice summary with:
  - what changed
  - key files touched
  - validation results
  - known risks or blockers
  - recommended next slice
- Do not start the next slice without user confirmation.
- Keep user-facing UI copy in Portuguese from Portugal. Keep code, schema, commits, and technical documentation in English.
- Do not create generic full pages without a real flow, data model, and product purpose.
- Before implementing a major product area or section, first create or update a feature spec covering objective, user flow, data model, UX boundaries, success criteria, and out-of-scope items. Do not implement that area until the user approves the spec.
