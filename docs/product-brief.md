# Coach AI Poker Planner - Product Brief

## Vision

An application for professional online poker tournament players, focused on productivity, organization, accountability, and sustainable performance.

The app should not become a complex financial tracker or a heavy Notion-style workspace. It should work as a weekly operating system for poker performance: helping the player define monthly targets, build a realistic weekly plan, execute daily commitments, review what happened, and improve consistency over time.

## Product Principles

- Simple before complete.
- Few inputs, high value.
- The dashboard is action-oriented: "what matters now?" and "what is the next best action?".
- The week is the operational center of the app.
- Monthly targets provide the main pacing context.
- Annual and quarterly planning provide direction, not heavy MVP workflows.
- The AI Coach is adaptive: calm when there is stress/tilt, more direct when there is repeated procrastination.
- The AI Coach reviews and improves the player's plan; it should not become the author of the player's life.
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

- Desktop: dashboard, weekly planning, reviews, study logging, and future session support.
- Mobile: quick check-in, daily commitments, short review, AI Coach.

## MVP

Main focus:

1. Monthly targets
2. Weekly planning
3. Daily execution
4. Weekly review
5. AI Coach as a planning reviewer and accountability assistant

First product spine:

- Demo mode without account
- Clerk login
- Real dashboard
- Monthly targets for grind, study, review, and sport
- Weekly plan with editable daily blocks
- Daily execution from the weekly plan
- Study session log
- Weekly review
- AI Coach plan review mock using real app data
- Data persisted in Convex

## AI Coach

Product model:

- Basic Coach included.
- Advanced Coach and deep analysis in the paid plan.
- Future: optional BYOK for power users.

The Coach may use:

- Check-ins
- Monthly targets
- Weekly plans
- Daily block completion
- Daily commitments
- Study sessions
- Weekly reviews
- Future online sessions
- Future notes and marked hands
- Calculated patterns

Important rule: the player must control which data is included in the Coach memory.

MVP planning behavior:

- The player creates the plan.
- The Coach reviews the plan only when requested.
- Suggestions are individual and accepted one by one.
- The Coach should flag unrealistic volume, missing review/study, weak recovery, and mismatch between monthly targets and weekly plan.
- The first version can be deterministic or mocked before real OpenAI integration.

## Poker Data

The MVP should not compete with poker financial trackers.

Poker data exists mainly as context to improve feedback. Online sessions remain important, but they are no longer the immediate center of the MVP. Session preparation, live capture, and post-session review should be revisited after the planning system exists.

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

## Planning System

The core planning loop is:

`Monthly targets -> Weekly plan -> Daily execution -> Weekly review -> Next weekly plan`

### Annual And Quarterly Direction

Annual and quarterly planning should stay light in the MVP. They give strategic direction, but should not require detailed forecasting before the player has app data.

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

- Weekly focus
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

Online sessions are a later product area. When revisited, input must be ultra fast:

- Mark hand
- Quick note
- Tilt +1
- Break done
- Low energy

Details belong in the post-session review.

## Post-Session Review

Post-session review is a later product area. When revisited, it should stay short:

- Simple result
- Focus
- Energy
- Tilt
- 1 good decision
- 1 mistake to review
- Marked hands
- Next action

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
- Redesign dashboard and navigation around monthly targets, weekly plan, daily execution, weekly review, and Coach AI plan review.
- Do not continue session preparation until the planning system exists.
