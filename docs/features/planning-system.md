# Planning System MVP Feature Spec

## Objective

Create the operational planning spine for Uplinea.

The system should help a professional online poker player translate annual direction into monthly targets, a realistic weekly plan, daily execution, reviews, and a better next plan.

Annual Direction = Strategic Operating Context. It is not only a light or inspirational page; it should become a persisted, operational source of context for the rest of the app.

The MVP should be useful without becoming a heavy calendar, Notion workspace, or generic habit tracker.

## Product Direction

The week is the center of the app.

The planning loop is:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Sessions/Study -> Reviews -> Next weekly plan`

Annual direction should exist in the MVP as the active strategic layer. Quarterly planning can come later, and the MVP should avoid asking the player to forecast too much too early.

Future product layer:

`Annual direction -> Annual operating targets -> Monthly targets -> Weekly plan -> Daily execution -> Sessions/Study -> Reviews -> Next weekly plan`

Annual operating targets are optional concrete rhythm metrics that may be added after Annual direction is persisted. They should capture practical operating pace, not strategic identity. Examples include grind days per month, tournaments per month, study hours per week, review volume, sport sessions, or player-defined custom metrics.

These targets should support `effectiveFrom` so a player can start mid-year or adjust expectations later without rewriting previous months or making the app judge past months as missed.

## Evidence-Informed Principles

- Specific goals with progress feedback outperform vague intentions.
- Implementation intentions help turn plans into action when predictable obstacles appear.
- Planning should account for the planning fallacy by keeping short feedback loops.
- High performers use cycles: direction, block planning, execution, review, adjustment.
- Tracking should diagnose patterns and feed Coach AI, not create guilt or force excessive data entry.

## Scope

### Annual Direction

Annual direction provides the strategic operating context for monthly targets, weekly plans, Today, poker sessions, weekly review, and Coach AI.

It should answer:

- What kind of player/professional am I trying to build this year?
- Which decisions should I repeat?
- Which patterns should I stop?
- Which trade-offs do I accept or refuse?

MVP fields:

- `primaryDirection`
- `priorities` with 2 to 4 items
- `nonNegotiables` / `constraints`
- `avoidRepeating`
- `decisionRule`

Rules:

- Keep it lightweight but operational.
- Do not require detailed annual forecasting.
- Do not require quarterly planning before the player can use the app.
- Keep concrete rhythm metrics in a future Annual Operating Targets layer rather than overloading Annual direction itself.
- Monthly targets should show the annual direction as context.
- Monthly targets should check whether the month's pace serves the annual direction.
- Weekly plans should warn when the plan contradicts priorities, non-negotiables, or patterns to avoid.
- Today may show a relevant decision rule when it helps execution.
- Sessions may suggest micro-intentions or limits based on non-negotiables.
- Weekly review should ask whether the week moved the player closer to the annual direction.
- Coach AI may use annual direction to challenge plans, identify repeated patterns, and propose adjustments.

### Monthly Targets

Monthly targets provide strategic pace for the weekly plan and should connect back to the annual direction. When Annual Operating Targets exist later, monthly targets may use that rhythm as optional context or suggestion input, but the player remains responsible for the monthly target decision.

Initial categories:

- Grind
- Study
- Review
- Sport

Target rules:

- Grind primary unit: sessions.
- Grind optional unit: tournaments.
- Study primary unit: hours.
- Review unit: hands or hours.
- Sport unit: sessions/blocks or hours.

The dashboard and weekly planner may show light pace feedback. Use simple pace states: missing/none, behind, on, ahead, complete. Avoid complex analytics in the first version.

### Weekly Plan

The weekly plan is the main planning surface.

It should start from one editable balanced template. The player can edit, remove, or add blocks.

Block types:

- Grind
- Study
- Review
- Sport
- Rest
- Admin/Other

Rules:

- Each weekly plan has a required short focus/intention.
- Multiple blocks per day are allowed.
- Blocks do not require fixed times.
- Each block can have an optional target.
- Study blocks can optionally include the intended study type.
- Review can exist as a weekly block and as a study type.
- Grind blocks can start or link to poker sessions, but standalone sessions are also allowed.
- The weekly focus/intention should appear in the weekly plan, dashboard, Today, and active poker session.

Block status:

- Planned
- Done
- Adjusted
- Not done

When a block is adjusted or not done, the app may ask for an optional quick reason:

- Low energy
- Lack of time
- Tilt/stress
- Unexpected event
- Unrealistic plan
- Priority changed
- No clear reason

### Daily Execution

The daily flow turns today's blocks into 1-3 practical commitments.

The player can choose:

- Follow today's plan
- Adjust today's plan
- Reduce today's plan

This keeps the weekly plan useful while accepting that poker schedules and energy change.

### Poker Session Flow

Poker sessions are part of the planning spine because they provide the real grind context that helps the player and Coach AI improve the next plan.

Detailed active spec: `docs/features/poker-session-flow.md`

Core flow:

- Start session from the highlighted global CTA, a Grind block, or the Sessions page.
- Use a short setup with required session focus and optional context.
- Capture check-ups, hands to review, quick notes, and micro-intentions during the session.
- Finish with a short review.
- Feed monthly Grind progress, weekly review, study/review backlog, and Coach AI pattern detection.

The Coach AI may use session data for performance and planning guidance, but must not provide technical poker hand analysis.

### Study Session Log

Study sessions can be linked to planned blocks or registered as standalone entries.

MVP fields:

- Duration
- Study type
- Quality 1-5
- Optional note

One study session should have one primary type.

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

Out of scope for the first study-log slice:

- Detailed tool tracking
- Multi-type sessions
- Advanced tags
- Study recommendations generated automatically

### Weekly Review

Weekly review is recommended, not mandatory.

It should happen before planning the next week when possible, but it should not block creating the next plan.

MVP fields:

- Execution 1-5
- Energy 1-5
- Focus 1-5
- Quality 1-5
- Main wins
- Main leaks or problems
- Main reasons for missed or adjusted blocks
- Adjustment for next week

Output:

- Short summary
- Short suggestion for next week
- Optional starting point for the next weekly plan

### Coach AI

The player creates the weekly plan. The Coach can review it when requested and can also be used as a free chat assistant.

The Coach should look for:

- Unrealistic volume
- Missing study or review
- Weak recovery/sport/rest balance
- Mismatch between monthly targets and weekly plan
- Repeated patterns from plans, sessions, study logs, and reviews once data exists
- Session patterns such as tilt rising when energy drops, many marked hands without review, or sessions ending early

Suggestions should be individual and accepted one by one. Do not auto-apply changes.

The first version may be mocked or rules-based.

Coach chat should show simple context used, such as weekly plan, last sessions, study log, or weekly review. Sensitive data such as financial session result is used only with explicit player permission.

## Dashboard Direction

The dashboard should answer:

- What is the plan for today?
- How is this week going?
- Am I on pace for this month's targets?
- What needs attention now?
- Should I review the plan with Coach AI?
- Is there an active or pending poker session?
- Do I need to ask Coach AI for help?

The dashboard should not become session-first, but it should include session state and a contextual session CTA when useful.

## Data Model Draft

### `annualPlans`

- userId
- year
- primaryDirection
- priorities
- nonNegotiables / constraints
- avoidRepeating
- decisionRule
- createdAt
- updatedAt

### `annualOperatingTargets`

- userId
- year
- label
- category: grind | study | review | sport | recovery | custom
- unit
- cadence: weekly | monthly
- targetValue
- effectiveFrom
- active
- createdAt
- updatedAt

### `monthlyTargets`

- userId
- month
- category
- primaryUnit
- targetValue
- optionalSecondaryUnit
- optionalSecondaryTargetValue
- createdAt
- updatedAt

### `weeklyPlans`

- userId
- weekStartDate
- focus/intention
- status: draft | active | reviewed | archived
- coachReviewSummary
- createdAt
- updatedAt

### `weeklyPlanBlocks`

- weeklyPlanId
- dayOfWeek
- type
- title
- targetUnit
- targetValue
- studyType
- status: planned | done | adjusted | notDone
- statusReason
- note
- createdAt
- updatedAt

### `sessions`

See `docs/features/poker-session-flow.md`.

### `studySessions`

- userId
- weeklyPlanBlockId
- date
- durationMinutes
- studyType
- quality
- note
- createdAt
- updatedAt

### `weeklyReviews`

- userId
- weeklyPlanId
- executionRating
- energyRating
- focusRating
- qualityRating
- wins
- leaks
- missedReasons
- nextWeekAdjustment
- coachSuggestion
- createdAt
- updatedAt

## UX Boundaries

- No fixed-time calendar in the first MVP.
- No drag-and-drop requirement in the first MVP.
- No heavy annual planning flow in the first MVP.
- No quarterly planning flow in the first MVP.
- No heavy OKR system.
- No automatic Coach-generated plan as the default.
- No Coach auto-applying changes.
- No heavy fitness tracking.
- No poker financial tracker.
- No technical poker hand analysis from Coach AI.
- No financial dashboards.

## Success Criteria

- Player can define annual direction in under three minutes.
- Player can create a weekly plan from a balanced template in under five minutes.
- Player can see today's planned blocks from the dashboard.
- Player can mark blocks as done, adjusted, or not done.
- Player can register a study session in under one minute.
- Player can start a poker session in under 30 seconds.
- Player can make a session check-up in under 10 seconds.
- Player can complete weekly review in under five minutes.
- Coach suggestions and chat feel specific, practical, contextual, and optional.

## First Recommended Implementation Slices

1. Annual Direction as Operating Context.
   - Persist annual direction.
   - Add `decisionRule` and stronger `nonNegotiables` / `avoidRepeating`.
   - Keep Coach real integration and advanced analytics out of scope.
2. Annual Operating Targets.
   - Add optional concrete rhythm metrics under the annual direction.
   - Use `effectiveFrom` for mid-year starts and adjustments.
   - Keep it lightweight and separate from OKRs, quarterly planning, annual forecasting, and financial targets.
3. Monthly Targets as Strategic Pace.
   - Persist monthly targets.
   - Link Grind, Study, Review, and Sport targets to annual direction and optional annual operating rhythm.
   - Calculate simple pace: missing/none, behind, on, ahead, complete.
4. Strategic Feedback Integration.
   - Use annual direction plus monthly targets in Weekly plan, Today, Sessions, Review, and Coach mock/rules-based feedback.
   - Keep feedback simple, actionable, and optional.
5. Weekly plan MVP.
6. Daily execution from weekly blocks.
7. Study session log MVP.
8. Poker session flow MVP.
9. Weekly review MVP.
10. Coach AI contextual chat and plan/session review mock.
