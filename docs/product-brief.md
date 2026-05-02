# Coach AI Poker Planner - Product Brief

## Vision

An application for professional online poker tournament players, focused on productivity, organization, accountability, and sustainable performance.

The app should not become a complex financial tracker or a heavy Notion-style workspace. It should work as a performance operating system for professional online poker players: helping the player define monthly targets, build a realistic weekly plan, execute daily commitments, log study, capture session signals, review what happened, and use Coach AI to move closer to professional and personal goals.

## Product Principles

- Simple before complete.
- Few inputs, high value.
- The dashboard is action-oriented: "what matters now?" and "what is the next best action?".
- The week is the operational center of the app.
- Monthly targets provide the main pacing context.
- Poker sessions are the core grind execution surface and should feed Coach AI with performance context.
- Annual and quarterly planning provide direction, not heavy MVP workflows.
- The AI Coach is adaptive: calm when there is stress/tilt, more direct when there is repeated procrastination.
- The AI Coach is present and interactive, but the player remains the author of the plan.
- Tracking exists mainly to feed better AI guidance, planning, study, session performance, and accountability.
- Evidence-informed by default: product decisions should be grounded in relevant research, proven performance methods, and real-world usage patterns when available.
- Privacy by default.
- Build phase by phase.
- Do not create generic full pages without a real flow, data model, and purpose.
- The current dashboard is a historical prototype reference only. The next design pass should follow the planning system.
- Scientific or performance-based ideas must be translated into simple, usable flows. Do not make the app heavy just to expose the theory behind a feature.

## Language Rules

- User-facing UI/copy: Portuguese from Portugal.
- Code, database schema, commits, and technical docs: English.
- Product brainstorming with the founder can happen in pt-PT.

## Decided Stack

- Next.js
- TypeScript
- Tailwind/shadcn
- Convex for database/backend
- Clerk for authentication
- OpenAI API for the AI Coach

## Platform Direction

Balanced responsive product:

- Desktop: dashboard, weekly planning, poker sessions, reviews, study logging, and Coach AI.
- Mobile: quick check-in, daily commitments, short review, quick session check-ups, and Coach AI.

## MVP

Main focus:

1. Annual direction
2. Monthly targets
3. Weekly planning
4. Daily execution
5. Poker sessions
6. Study logging
7. Reviews
8. AI Coach as an interactive performance assistant

First product spine:

- Demo mode without account
- Clerk login
- Real dashboard
- Annual direction as the strategic layer for the year
- Monthly targets for grind, study, review, and sport
- Weekly plan with editable daily blocks
- Daily execution from the weekly plan
- Poker session start, active capture, and short post-session review
- Study session log
- Weekly review
- AI Coach chat and plan/session review mock using real app data
- Data persisted in Convex

## AI Coach

Product model:

- Basic Coach included.
- Advanced Coach and deep analysis in the paid plan.
- Future: optional BYOK for power users.

The Coach may use:

- Check-ins
- Annual direction
- Monthly targets
- Weekly plans
- Daily block completion
- Daily commitments
- Poker sessions
- Session events
- Marked hands backlog
- Study sessions
- Weekly reviews
- Calculated patterns

Important rule: the player must control which data is included in the Coach memory.

MVP Coach behavior:

- The player creates the plan; the Coach can review, challenge, and improve it.
- The Coach should have a free chat surface plus contextual entry points.
- The Coach should show simple context used, such as weekly plan, last sessions, study log, or reviews.
- Suggestions are individual and accepted one by one, with confirmation before changes are applied.
- The Coach should flag unrealistic volume, missing review/study, weak recovery, and mismatch between monthly targets and weekly plan.
- The Coach should identify performance patterns across sessions, study, plans, reviews, and check-ins.
- The Coach must not provide technical poker hand analysis.
- The first version can be deterministic or mocked before real OpenAI integration.

## Poker Data

The MVP should not compete with poker financial trackers.

Poker data exists mainly as context to improve feedback and Coach AI guidance. Sessions are part of the MVP design direction because they provide the real grind signals that connect planning to performance.

- Platform
- Tournament/session
- Buy-in
- Simple result
- Focus
- Energy
- Tilt
- Number of tables
- Quick notes
- Marked hands
- Post-session review

Advanced fields should appear only when they are useful.

Poker data should not turn the app into a financial tracker or hand analysis tool. Financial result is optional private context. Marked hands feed review/study backlog and performance patterns, not AI technical hand advice.

## Planning System

The core planning loop is:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Sessions/Study -> Reviews -> Next weekly plan`

### Annual And Quarterly Direction

Annual direction is the strategic layer of the app. It should answer: "What am I trying to build this year, and what should this month move forward?"

The MVP should include a lightweight annual direction flow before monthly targets. It should capture one primary direction, a small number of priorities, and important constraints. It should not become detailed forecasting, a heavy OKR system, or a full annual calendar.

Quarterly planning can remain later. Monthly targets should be the first operational pacing layer under the annual direction.

### Monthly Targets

Monthly targets are the main pacing layer.

Initial target categories:

- Grind
- Study
- Review
- Sport

Grind should use sessions as the primary unit, with tournament count optional for MTT players.

### Weekly Plan

The weekly plan is the center of execution.

It should include:

- Required weekly focus/intention
- Editable balanced template
- Daily blocks without fixed schedules
- Multiple blocks per day
- Optional target per block
- Light pace feedback against monthly targets

Block types:

- Grind
- Study
- Review
- Sport
- Rest
- Admin/Other

The weekly focus/intention should appear in the weekly plan, dashboard, Today, and active poker session.

### Daily Execution

The daily flow should convert today's blocks into practical commitments. The player can follow, adjust, or reduce the plan based on current state.

Block status:

- Planned
- Done
- Adjusted
- Not done

When a block is adjusted or missed, the app may ask for an optional quick reason such as low energy, lack of time, tilt/stress, unexpected event, unrealistic plan, changed priority, or no clear reason.

### Study Session Log

Study deserves its own log because study quality matters as much as study time.

MVP fields:

- Duration
- Study type
- Quality 1-5
- Optional note

A study session can be linked to a planned weekly block or registered as a standalone entry. One study session should have one primary type.

Initial study types:

- Drills
- Hand review
- Tournament review
- Solver
- Individual lesson
- Group lesson
- Video/course
- Group study
- Theory/concepts
- Other

### Weekly Review

The weekly review should be recommended, not mandatory. It closes the planning loop without blocking the player.

MVP fields:

- Execution 1-5
- Energy 1-5
- Focus 1-5
- Quality 1-5
- Main wins
- Main leaks or problems
- Reasons for missed or adjusted blocks
- Adjustment for next week
- Short Coach suggestion for the next weekly plan

## Accountability

Adaptive:

- If there was stress/tilt: calm and regulating tone.
- If there was repeated procrastination: more direct tone.
- Always end with a small next action.

Avoid excessive guilt. The app should increase responsibility without worsening tilt.

## Daily Check-In

Adaptive:

- Ultra-simple by default.
- The app asks for more context only when it helps the AI Coach.
- It should be connected to today's weekly-plan blocks, not exist as an isolated habit tracker.

Base fields:

- Sleep
- Energy
- Focus
- Stress
- Plan choice: follow, adjust, or reduce
- 1 to 3 commitments derived from today's planned blocks

## During Online Session

Online sessions are an active design-system surface. The session flow should connect to the weekly plan and keep input ultra fast:

- Quick setup with required session focus
- Optional link to a planned Grind block
- Optional initial energy/focus/tilt
- Optional micro-intention
- Check-up rapido with energy, focus, tilt, table count, and micro-intention
- Mark hand to review
- Quick note
- Finish session and short review

Breaks should remain rest time. The app should not force notifications or mandatory check-ins.

## Post-Session Review

Post-session review should stay short:

- Number of tournaments played
- Decision quality
- Focus, energy, and tilt summary
- Optional financial result as private Coach context
- Optional good decision
- Optional main leak/problem
- Priority hands to review
- Optional next action

Session reviews feed weekly review, study/review backlog, monthly Grind progress, and Coach AI pattern detection.

## Future Coach/Team Support

The architecture should be prepared for:

- Individual player
- Human coach monitoring multiple players
- Teams/squads
- Private sharing controlled by the player

Privacy by default.

## Business Model

Hybrid:

- Individual subscription initially.
- Future plans for coaches/teams.

AI Coach:

- Basic included.
- Advanced/deep analysis in paid plan.

## Development Rules

- Build in small slices.
- Do not create full pages without a real flow.
- Do not let generic prototypes guide product decisions.
- Before implementing or significantly changing each product area, run product discovery first: research relevant evidence, brainstorm options with the founder, ask decision questions one at a time, then document the approved spec.
- Before implementing each approved area, define: objective, evidence-informed principles, data, flow, UX boundaries, success criteria, and out-of-scope items.
- Always validate with build/lint/test when available.
- Keep the app simple, intuitive, and not overwhelming.

## Next Recommended Slice

Slice 1: Technical foundation.

Goal:

- Create the Next.js + TypeScript app.
- Configure Tailwind/shadcn.
- Prepare Convex.
- Prepare Clerk.
- Preserve the current dashboard prototype only as historical reference until the planning-system redesign.

Out of scope:

- Real AI Coach.
- Billing.
- Complete goals/sessions/reviews pages.
- Advanced analytics.

Next product slice after foundation:

- Define `docs/features/planning-system.md`.
- Use `docs/features/poker-session-flow.md` for the active poker-session direction.
- Redesign dashboard and navigation around monthly targets, weekly plan, daily execution, poker sessions, study, reviews, and Coach AI.
