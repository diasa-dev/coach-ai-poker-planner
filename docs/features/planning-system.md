# Planning System MVP Feature Spec

## Objective

Create the operational planning spine for Coach AI Poker Planner.

The system should help a professional online poker player translate monthly targets into a realistic weekly plan, execute the plan day by day, review the week, and improve the next plan.

The MVP should be useful without becoming a heavy calendar, Notion workspace, or generic habit tracker.

## Product Direction

The week is the center of the app.

The planning loop is:

`Monthly targets -> Weekly plan -> Daily execution -> Weekly review -> Next weekly plan`

Annual and quarterly planning can provide strategic direction later, but the MVP should avoid asking the player to forecast too much too early.

## Evidence-Informed Principles

- Specific goals with progress feedback outperform vague intentions.
- Implementation intentions help turn plans into action when predictable obstacles appear.
- Planning should account for the planning fallacy by keeping short feedback loops.
- High performers use cycles: direction, block planning, execution, review, adjustment.
- Tracking should diagnose patterns, not create guilt or force excessive data entry.

## Scope

### Monthly Targets

Monthly targets provide pacing for the weekly plan.

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

The dashboard and weekly planner may show light pace feedback, such as "below monthly pace" or "on pace". Avoid complex analytics in the first version.

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

- Multiple blocks per day are allowed.
- Blocks do not require fixed times.
- Each block can have an optional target.
- Study blocks can optionally include the intended study type.
- Review can exist as a weekly block and as a study type.

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

### Coach AI Planning Reviewer

The player creates the weekly plan. The Coach reviews it only when requested.

The Coach should look for:

- Unrealistic volume
- Missing study or review
- Weak recovery/sport/rest balance
- Mismatch between monthly targets and weekly plan
- Repeated patterns from past reviews once data exists

Suggestions should be individual and accepted one by one. Do not auto-apply changes.

The first version may be mocked or rules-based.

## Dashboard Direction

The dashboard should answer:

- What is the plan for today?
- How is this week going?
- Am I on pace for this month's targets?
- What needs attention now?
- Should I review the plan with Coach AI?

The dashboard should not center session preparation until the planning spine exists.

## Data Model Draft

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
- focus
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
- No full annual planning flow in the first MVP.
- No automatic Coach-generated plan as the default.
- No heavy fitness tracking.
- No poker financial tracker.
- No session-preparation implementation until planning context exists.

## Success Criteria

- Player can create a weekly plan from a balanced template in under five minutes.
- Player can see today's planned blocks from the dashboard.
- Player can mark blocks as done, adjusted, or not done.
- Player can register a study session in under one minute.
- Player can complete weekly review in under five minutes.
- Coach suggestions feel specific, practical, and optional.

## First Recommended Implementation Slices

1. Monthly targets MVP.
2. Weekly plan MVP.
3. Daily execution from weekly blocks.
4. Study session log MVP.
5. Weekly review MVP.
6. Coach AI plan review mock.
