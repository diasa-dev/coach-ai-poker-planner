# Uplinea Product Brief

## Vision

An application for professional online poker tournament players, focused on productivity, organization, accountability, and sustainable performance.

The app should not become a complex financial tracker or a heavy Notion-style workspace. It should work as a performance operating system for professional online poker players: helping the player define monthly targets, build a realistic weekly plan, execute daily commitments, log study, capture session signals, review what happened, and use Coach AI to move closer to professional and personal goals.

## Product Principles

- Simple before complete.
- Few inputs, high value.
- The dashboard is action-oriented: "what matters now?" and "what is the next best action?".
- The week is the operational center of the app.
- Annual direction is the active strategic operating context, not an inspirational page.
- Monthly targets provide the main pacing context under the annual direction.
- Poker sessions are the core grind execution surface and should feed Coach AI with performance context.
- Quarterly planning remains out of scope for now.
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
- Annual direction as the strategic operating context for the year
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

### Annual Direction As Strategic Operating Context

Annual direction is the strategic operating context of the app. It is a persisted, operational source of truth that helps guide monthly targets, weekly planning, daily execution, poker sessions, weekly review, and Coach AI feedback.

It should answer:

- What kind of player/professional am I trying to build this year?
- Which decisions should I repeat?
- Which patterns should I stop?
- Which trade-offs do I accept or refuse?

Expected future fields:

- `primaryDirection`
- `priorities` with 2 to 4 items
- `nonNegotiables` / `constraints`
- `avoidRepeating`
- `decisionRule`
- `createdAt`
- `updatedAt`

Annual direction should stay simple and operational. It must not become detailed annual forecasting, a heavy OKR system, a quarterly planning workflow, a dense analytics dashboard, or a financial target dashboard.

Quarterly planning can remain later. Monthly targets should be the first operational pacing layer under the annual direction.

Future layer: Annual Operating Targets.

Annual direction may later be supported by lightweight operating targets: concrete rhythm metrics such as grind days per month, tournaments per month, study hours per week, review volume, sport sessions, or other player-defined metrics.

This should remain separate from Annual direction itself. Annual direction defines strategic context and trade-offs; Annual Operating Targets define the default operating rhythm that can inform monthly targets and weekly planning.

Rules for a future implementation:

- Keep targets editable during the year.
- Store changes with `effectiveFrom` so new targets apply from the date they are set and do not rewrite past months.
- Support users who start using the app mid-year without making the app judge earlier months as missed.
- Allow player-defined custom metrics without turning the feature into OKRs, quarterly planning, annual forecasting, financial tracking, or dense analytics.
- Treat these metrics as suggested operating context for Monthly targets, not as automatic target generation.

How it influences the app:

- Monthly targets: check whether the month's pace serves the annual direction.
- Weekly plan: warn when the plan contradicts priorities, non-negotiables, or patterns to avoid.
- Today: show a relevant decision rule when it helps execution.
- Sessions: suggest micro-intentions or limits based on non-negotiables.
- Weekly review: ask whether the week moved the player closer to the annual direction.
- Coach AI: use annual direction as a criterion to challenge plans, identify repeated patterns, and propose adjustments.

### Monthly Targets

Monthly targets are the main pacing layer.

Monthly targets should become strategic pace, not isolated metrics. They should connect Grind, Study, Review, and Sport targets back to the annual direction and use simple pace states: missing/none, behind, on, ahead, or complete.

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

Roadmap from the current planning-system direction:

1. Annual Direction as Operating Context
   - Persist annual direction.
   - Add `decisionRule` and stronger `nonNegotiables` / `avoidRepeating`.
   - Keep Coach real integration and advanced analytics out of scope.

2. Annual Operating Targets
   - Add optional concrete rhythm metrics under the annual direction.
   - Examples: grind days per month, tournaments per month, study hours per week, review volume, sport sessions.
   - Use `effectiveFrom` so mid-year starts and mid-year adjustments apply only from the chosen date forward.
   - Keep this separate from OKRs, quarterly planning, annual forecasting, and financial targets.

3. Monthly Targets as Strategic Pace
   - Persist monthly targets.
   - Link Grind, Study, Review, and Sport targets to the annual direction and optional annual operating rhythm.
   - Calculate simple pace: missing/none, behind, on, ahead, complete.

4. Strategic Feedback Integration
   - Use annual direction plus monthly targets in Weekly plan, Today, Sessions, Review, and Coach mock/rules-based feedback.
   - Keep feedback simple, actionable, and optional.

Out of scope for these slices:

- Quarterly planning.
- Heavy OKR/project management flows.
- Dense analytics dashboards.
- Financial tracking.
- Coach auto-applying changes.
