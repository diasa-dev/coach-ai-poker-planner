# Planning System Redesign Spec

## Purpose

Redesign the Coach AI Poker Planner app around the MVP planning system before implementing more product behavior.

The app should not feel like a generic poker dashboard, a calendar, or an AI chat product. The MVP should feel like a weekly operating system for professional online poker players:

`Monthly targets -> Weekly plan -> Daily execution -> Day close -> Weekly review -> Next weekly plan`

## Source Of Truth

- `docs/features/planning-system.md`
- `docs/design/product-design-brief.md`
- `docs/product-brief.md`
- `README.md`
- Current Linear MVP issues, especially `DIA-15` through `DIA-21`

Archived session-flow specs are historical reference only. Session preparation, live session capture, and post-session review should not drive the active MVP redesign.

## Product Positioning

The MVP should help the player answer:

- What should I do today?
- Is this week still realistic?
- Am I on pace for this month's targets?
- What have I missed, adjusted, or avoided?
- What should I improve before the next week?

The app should optimize for execution and adjustment, not passive tracking.

## Evidence-Informed Design Principles

- Specific goals with progress feedback are more useful than vague intentions.
- Daily commitments should translate plans into concrete action.
- Short planning cycles reduce planning fallacy risk.
- Review should diagnose patterns without creating guilt.
- Feedback should produce a next action, not just a score.
- The Coach should challenge the plan when useful, but the player remains the author.

## Primary Navigation

Recommended main navigation:

- Today
- Weekly plan
- Monthly targets
- Study
- Review

Do not include Coach AI as a fixed primary navigation item in the MVP.

Coach AI should appear contextually:

- In the weekly plan as `Review with Coach`
- In the weekly review as a short next-week suggestion
- On Today only when there is a concrete plan risk or useful action

Remove or defer from primary navigation:

- Sessions
- Analytics
- Notes
- Session preparation
- Generic AI chat

## Today Screen

Today is the default screen after login.

Before the day is prepared, Today should show:

- Primary CTA: `Prepare day`
- Today's planned blocks from the active weekly plan
- Weekly focus as a short line
- Compact planning-week preview
- Compact monthly pace summary
- Useful attention items
- A discreet signal if the next week has a draft

If there is no active weekly plan, Today should not allow the main execution flow to drift into a disconnected habit tracker. The primary empty state should point the player to create a weekly plan:

- Message: `You do not have a plan for this planning week yet`
- Primary CTA: `Create weekly plan`

After the player prepares the day, Today enters execution mode.

### Execution Mode

Execution mode should prioritize the 1 to 3 daily commitments.

Primary content:

- Daily commitments
- Quick status actions: done, adjust, not done
- Secondary action: adjust day
- Short weekly focus reminder

Secondary compact content:

- Today's original planned blocks
- Compact planning-week preview
- Compact monthly pace summary
- Attention items only when actionable

Execution mode should avoid:

- Dense analytics
- Coach chat as the main surface
- Full weekly planning controls
- Prominent re-planning loops

## Prepare Day Flow

The `Prepare day` flow should be short.

Recommended steps:

1. Quick state check, if needed: sleep, energy, focus, stress.
2. Plan choice:
   - Follow plan
   - Adjust plan
   - Reduce plan
3. Confirm 1 to 3 daily commitments derived from today's planned blocks.
4. Enter execution mode.

When the player chooses `Reduce plan`, the key question should be:

`What is the minimum that still makes today useful?`

This lets the player preserve accountability without treating a bad-energy day as a failed day.

## Planned Blocks Vs Daily Commitments

The design must distinguish planned blocks from daily commitments.

- Planned blocks are the weekly intention.
- Daily commitments are the concrete execution choice for today.

Daily commitments must not replace or delete the original weekly blocks. This distinction is important for weekly review and Coach feedback.

## Day Close

Today should support a quick day close.

Recommended CTA:

- `Close day`

The day close should take under 60 seconds.

It should allow the player to:

- Confirm pending commitment/block statuses
- Select optional reasons for adjusted or not-done items
- Add one optional short note

Do not include a daily quality rating in the MVP day close. Quality ratings belong in the weekly review for now.

Avoid turning day close into a long journal or another review form.

## Adjustment Reasons

When a block or commitment is adjusted or not done, the app should offer an optional quick picker.

Initial reasons:

- Low energy
- Lack of time
- Tilt/stress
- Unexpected event
- Unrealistic plan
- Priority changed
- No clear reason

Reason selection should be optional. The goal is useful pattern data, not interrogation.

## Weekly Plan

The weekly plan is the main planning surface.

Represent it as a day-based board:

- Seven days
- Days start from the user's configured planning-week start day
- Editable blocks
- Multiple blocks per day
- No fixed-time calendar requirement
- No drag-and-drop requirement for the MVP

Initial block types:

- Grind
- Study
- Review
- Sport
- Rest
- Admin/Other

The weekly plan should have one short weekly focus.

Good examples:

- Protect energy for Sunday
- Improve study quality
- Review before grinding
- Return to routine without compensating volume

Bad examples:

- Be better
- Win more
- Stay focused

### Weekly Plan CTAs

Recommended states:

- No active plan: `Create weekly plan`
- Existing active plan: `Edit plan`
- Existing draft: `Continue draft`
- Previous week exists and no current draft exists: `Copy previous week`
- Secondary action: `Review with Coach`
- End of planning week: `Do weekly review`

The primary action should reinforce that the player owns the plan.

If monthly targets are not defined yet, the player should still be allowed to create a weekly plan. Show a light warning and a secondary CTA instead of blocking the flow:

- Message: `Without monthly targets, the plan has less pacing context`
- Secondary CTA: `Set monthly targets`

The first weekly plan should start from one balanced editable template. Do not offer multiple template choices in the MVP.

Do not include personal template management in the MVP. Instead, support a simpler `Copy previous week` action when a previous week exists. Copying a previous week should create a clean editable draft.

When copying the previous week, copy:

- Planned blocks
- Weekly focus

Do not copy:

- Block statuses
- Adjustment or missed reasons
- Daily commitments
- Execution data
- Weekly review data
- Coach review summary

Each weekly block should support:

- Type
- Optional short title
- Optional target

Targets should adapt to the block type:

- Grind: sessions, with tournaments as optional secondary context
- Study: hours or minutes
- Review: hands or hours
- Sport: sessions/blocks or hours
- Rest: optional block count or no target
- Admin/Other: optional block count, hours, or no target

## Configurable Planning Week

The app should support a configurable planning-week start day from the beginning.

Default:

- Monday

User setting:

- `weekStartDay`

The weekly plan should always show seven days from the configured start day.

Weekly review timing should follow the user's planning week, not the civil week. Monthly pace should remain based on calendar months.

This is important for poker players because Sunday is often the highest-volume or highest-importance grind day. Some players may prefer to plan the next week on a rest day such as Thursday or Friday.

Use the phrase `planning week` where needed to avoid confusion with the civil week.

When the player creates the first weekly plan, ask about the planning-week start as a light, non-blocking setup question:

- Default copy: `Your planning week starts on Monday`
- Secondary action: `Change`

After this first setup, store the value as a global user preference. Do not ask on every new plan. Future plans should use the saved preference automatically, while settings should allow the player to change it later.

## Next Week Draft

The weekly plan should support a draft state for the next planning week.

Recommended weekly plan statuses:

- Draft
- Active
- Reviewed
- Archived

The player should be able to prepare the next week while the current week remains active.

Today may show a discreet signal:

- `Next week draft`

This signal should not compete with daily execution.

## Compact Planning Week Preview

Today should include a compact seven-day preview of the current planning week.

Recommended representation:

- Chips by block type
- Highlight today
- Show status discreetly: planned, done, adjusted, not done
- Show a maximum of three chips per day, then collapse remaining blocks into a count such as `+2`

Avoid a full calendar layout on Today.

## Monthly Targets

Monthly targets should be a dedicated page in the primary navigation.

Purpose:

- Define monthly pacing
- Inform weekly planning
- Inform Today context
- Inform Coach plan review

Initial categories:

- Grind
- Study
- Review
- Sport

Today should show a compact monthly pace summary by category.

Example:

- Grind: on pace · 8/16 sessions
- Study: below pace · 3/6h
- Review: ok · 40/80 hands
- Sport: below pace · 1/4 sessions

Show status plus one short progress number. Avoid dense charts, percentages, forecasts, or detailed analytics in the MVP. Monthly pace should trigger decisions, not become an analytics page.

## Study

Study should be a fast study-session log in the MVP.

Primary CTA:

- `Log study`

MVP fields:

- Duration
- Study type
- Quality 1 to 5
- Optional note
- Optional link to a planned weekly block

When a study session is linked to a planned study block, ask the player whether the related block should be marked as done. This can be preselected, but it should not happen silently because some study sessions may only partially complete the intended block.

The Study page may show lightweight summaries:

- Study time this week
- Study time this month
- Most common study types
- Average quality

Out of scope:

- Content library
- Course manager
- Advanced tags
- Separate study plan
- Automatic study recommendations

## Review

Review should mean weekly review in the MVP.

Do not include session reviews in the active MVP review page.

Weekly review should be recommended, not mandatory. The player should be allowed to create or continue the next weekly plan even if the prior review was skipped.

The review should show a summarized comparison between original plan and actual execution.

Example:

- Grind: 5 planned / 4 done
- Study: 6h planned / 3h done
- Review: 2 blocks planned / 0 done
- Sport: 3 planned / 2 done

MVP fields:

- Execution rating 1 to 5
- Energy rating 1 to 5
- Focus rating 1 to 5
- Quality rating 1 to 5
- Main wins
- Main leaks or problems
- Main reasons for missed or adjusted blocks
- Adjustment for next week

Any Coach suggestion for the next week should appear after the player completes the review fields. This keeps the review reflective first and lets the Coach use the player's actual weekly context.

The review should act like a mirror, not a tribunal.

## Coach AI

Coach AI should be contextual and plan-focused in the MVP.

The player creates the plan. The Coach reviews it only when requested.

Recommended UI:

- Side drawer inside Weekly plan

The drawer should keep the plan visible while showing Coach findings and suggestions.

The Coach should look for:

- Unrealistic volume
- Missing study or review
- Weak recovery, sport, or rest balance
- Mismatch between monthly targets and weekly plan
- Repeated patterns once review data exists

Suggestion behavior:

- Suggestions are individual
- Each suggestion can be accepted or ignored
- No suggestion is auto-applied
- Copy should be direct and practical
- Avoid theatrical AI personality in the MVP

When the player accepts a Coach suggestion, create an editable proposal before applying the change. The Coach should not silently mutate the player's plan.

For the MVP, do not build a full history center for Coach suggestions. Store the plan-level `coachReviewSummary` and persist accepted changes through the normal plan data. Ignored suggestions do not need detailed persistent history yet.

Avoid:

- Coach as a fixed nav item
- Coach chat as the main app surface
- Coach-generated plans as the default

## First Screen Information Hierarchy

Today should not become a dense dashboard.

Before day preparation:

1. Prepare day CTA
2. Planned blocks for today
3. Weekly focus
4. Compact planning-week preview
5. Compact monthly pace
6. Attention items

After day preparation:

1. Daily commitments
2. Quick status actions
3. Adjust day as a secondary action
4. Weekly focus
5. Compact context

The player should feel: "I know what to do now."

## Product Risks

### Today Becomes Too Busy

The biggest design risk is turning Today into a mini dashboard with too much information.

Mitigation:

- Use execution mode after preparation
- Keep weekly and monthly context compact
- Only show alerts when they are actionable

### The Product Drifts Back To Session Preparation

The previous session-first direction was intentionally canceled.

Mitigation:

- Avoid primary CTAs such as `Prepare session`, `Start grind`, or `Start session`
- Keep sessions out of primary navigation
- Revisit session flows only after planning context exists

### Coach AI Becomes The Product

Coach AI is valuable, but the MVP should not be a chat wrapper.

Mitigation:

- Keep Coach contextual
- Keep plan ownership with the player
- Use suggestions that can be accepted one by one

### Study Becomes A Knowledge Workspace

Study logging matters, but the MVP should not compete with Notion, solvers, courses, or Discord.

Mitigation:

- Keep Study as a fast log
- Defer content library and advanced tagging

## Recommended Implementation Order

This design supports the existing implementation order:

1. Monthly targets MVP
2. Weekly plan MVP
3. Daily execution from weekly blocks
4. Study session log MVP
5. Weekly review MVP
6. Coach AI plan review mock

Before implementation, `DIA-15` should use this spec to redesign the active dashboard/navigation around the planning system.

## Open Product Questions

- Should the first balanced weekly template vary by player profile later, or stay universal until there is real usage data?
- Should the day empty state allow an emergency standalone commitment when there is no weekly plan, or is that out of scope for the MVP?
