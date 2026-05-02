# Planning System Redesign Spec

## Purpose

Redesign Uplinea around the MVP planning system, poker-session flow, and Coach AI before implementing more product behavior.

The app should not feel like a generic poker dashboard, a calendar, a financial tracker, or an AI chat wrapper. The MVP should feel like a performance operating system for professional online poker players:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Sessions/Study -> Reviews -> Coach patterns -> Next weekly plan`

## Source Of Truth

- `docs/features/planning-system.md`
- `docs/features/poker-session-flow.md`
- `docs/design/product-design-brief.md`
- `docs/product-brief.md`
- `README.md`
- Current Linear MVP issues, especially `DIA-15` through `DIA-21`

Archived session-flow specs are historical inputs only. The active session direction lives in `docs/features/poker-session-flow.md`.

## Product Positioning

The MVP should help the player answer:

- What should I do today?
- Is this week still realistic?
- Am I on pace for this month's targets?
- Is there an active or pending poker session?
- What have I missed, adjusted, or avoided?
- What patterns should Coach AI help me notice?
- What should I improve before the next week?
- Is this month still aligned with my annual direction?

The app should optimize for execution, context capture, adjustment, and AI-assisted performance improvement, not passive tracking.

## Evidence-Informed Design Principles

- Specific goals with progress feedback are more useful than vague intentions.
- Daily commitments should translate plans into concrete action.
- Short planning cycles reduce planning fallacy risk.
- Review should diagnose patterns without creating guilt.
- Feedback should produce a next action, not just a score.
- The Coach should challenge the plan when useful, but the player remains the author.
- Session capture should be optional during play but valuable when used.
- Coach AI should use data to improve performance and organization, not to give technical hand advice.

## Primary Navigation

Recommended main navigation:

- Today
- Weekly plan
- Annual direction
- Monthly targets
- Sessions
- Study
- Review
- Coach AI

Also include a visually highlighted `Start session` CTA below the logo in the sidebar.

The highlighted session CTA states:

- `Start session`
- `Active session`
- `Finish and review`

Coach AI should appear both as a primary surface and contextually:

- In the weekly plan as `Review with Coach`
- In the weekly review as a short next-week suggestion
- On Today as a compact insight plus `Ask Coach`
- In Sessions as contextual performance insight
- As a free chat page/drawer with suggested prompts

Remove or defer from primary navigation:

- Analytics
- Notes
- Technical hand analysis

## Today Screen

Today is the default screen after login.

Before the day is prepared, Today should show:

- Primary CTA: `Prepare day`
- Today's planned blocks from the active weekly plan
- Weekly focus as a short line
- Highlighted session CTA/state when relevant
- Compact planning-week preview
- Compact monthly pace summary
- Useful attention items
- Coach AI compact insight plus `Ask Coach`
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
- Session state/CTA when relevant
- Attention items only when actionable

Execution mode should avoid:

- Dense analytics
- Coach chat as the main surface, while still keeping a compact Coach entry point available
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

The weekly plan should have one required short weekly focus/intention.

This weekly focus should appear in the weekly plan, Today, dashboard, and active session.

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
- Many marked hands pending: `Plan review block`

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

## Annual Direction

Annual direction should be a lightweight primary surface in the MVP.

Purpose:

- Define the strategic direction for the year.
- Help monthly targets answer "what should this month move forward?"
- Give Coach AI context for plan and review feedback.

MVP fields:

- Primary direction for the year.
- 2 to 4 priorities.
- Optional constraints or non-negotiables.
- Optional note on what the player does not want to repeat this year.

Avoid:

- Detailed annual forecasting.
- Quarterly planning as a required setup step.
- Heavy OKR/project management language.
- Financial target dashboards.

## Monthly Targets

Monthly targets should be a dedicated page in the primary navigation.

Purpose:

- Define monthly pacing under the annual direction
- Inform weekly planning
- Inform Today context
- Inform Coach plan review
- Inform session and study recommendations

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

## Sessions

Sessions should be a dedicated primary page and a core execution flow.

Reference spec:

- `docs/features/poker-session-flow.md`

Main purposes:

- Start or return to the active session.
- Finish/review a pending session.
- Show compact session history.
- Feed Coach AI with performance context.

Primary global CTA:

- `Start session`, highlighted below the logo.

Session start:

- Short drawer/modal.
- Required session focus.
- Optional link to planned Grind block.
- Optional initial energy/focus/tilt.
- Optional micro-intention.
- Optional max tables and quality rule, suggested from plan/block when available.

Active session:

- Dedicated focused page on desktop.
- Quick check-up.
- Mark hand to review.
- Quick note.
- Micro-intention.
- Compact latest timeline.
- Finish session CTA.

Check-up:

- Energy 1-5.
- Focus 1-5.
- Tilt 0-5.
- Optional micro-intention.
- Optional table count.

End session:

- Opens short review immediately.
- If check-ups exist, show summary and let the player confirm/edit.
- If no check-ups exist, ask final energy/focus/tilt/decision quality.
- Required: number of tournaments played and final decision quality.
- Optional: financial result with explicit permission for Coach AI.
- Optional: good decision, main leak, next action, 1-3 priority hands.

Session page filters:

- Date/period.
- Session state.
- Review pending.

History row:

- Date.
- Focus.
- Number of tournaments.
- Decision quality.
- Tilt peak.
- Hands to review.
- State/review status.

Avoid:

- Calendar-first layout.
- Financial summaries.
- Technical hand analysis.
- Detailed tournament-by-tournament tracking.

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

Review should include weekly review and pending session reviews as separate review types.

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

Session review should be short and should feed the weekly review. The review should act like a mirror, not a tribunal.

## Coach AI

Coach AI should be contextual, interactive, and performance-focused in the MVP.

The player creates the plan. The Coach can review it when requested, answer free-form questions, and propose changes that require confirmation.

Recommended UI:

- Primary Coach AI page with free chat.
- Contextual drawer/action on Today, Weekly plan, Sessions, Study, and Review.
- Compact dashboard insight card with `Ask Coach`.

The contextual drawer should keep the current screen visible while showing Coach findings and suggestions.

The Coach should look for:

- Unrealistic volume
- Missing study or review
- Weak recovery, sport, or rest balance
- Mismatch between monthly targets and weekly plan
- Repeated patterns from plans, sessions, study logs, check-ins, and reviews
- Session patterns such as energy drops, tilt spikes, many marked hands, table creep, or early session endings

Suggestion behavior:

- Suggestions are individual
- Each suggestion can be accepted or ignored
- No suggestion is auto-applied
- Copy should be direct and practical
- Avoid theatrical AI personality in the MVP
- Show simple context used, such as `weekly plan + last 3 sessions`
- Do not provide technical poker hand analysis

When the player accepts a Coach suggestion, create an editable proposal before applying the change. The Coach should not silently mutate the player's plan.

For the MVP, do not build a full history center for Coach suggestions. Store useful summaries and persist accepted changes through normal plan/session/study data. Ignored suggestions do not need detailed persistent history yet.

Avoid:

- Coach-generated plans as the default
- Coach as the only interaction model
- Coach as technical hand analyst

## First Screen Information Hierarchy

Today should not become a dense dashboard.

Before day preparation:

1. Prepare day CTA
2. Planned blocks for today
3. Session CTA/state when relevant
4. Weekly focus
5. Compact planning-week preview
6. Compact monthly pace
7. Attention items
8. Coach insight

After day preparation:

1. Daily commitments
2. Quick status actions
3. Adjust day as a secondary action
4. Session CTA/state when relevant
5. Weekly focus
6. Compact context

The player should feel: "I know what to do now."

## Product Risks

### Today Becomes Too Busy

The biggest design risk is turning Today into a mini dashboard with too much information.

Mitigation:

- Use execution mode after preparation
- Keep weekly and monthly context compact
- Only show alerts when they are actionable

### Sessions Overpower Planning

Sessions are now an active surface, but the macro planning system remains the product spine.

Mitigation:

- Keep the weekly focus and monthly targets visible around session flows.
- Keep session setup short.
- Avoid making session preparation the whole dashboard.

### Coach AI Becomes The Product

Coach AI is valuable and should be present, but the MVP should not become only a chat wrapper.

Mitigation:

- Keep Coach contextual
- Keep plan ownership with the player
- Use suggestions that can be accepted one by one
- Add free chat without replacing structured flows

### Study Becomes A Knowledge Workspace

Study logging matters, but the MVP should not compete with Notion, solvers, courses, or Discord.

Mitigation:

- Keep Study as a fast log
- Defer content library and advanced tagging

## Visual And Brand Direction

Brand/name note:

- Use Uplinea as the approved product name.
- Preserve the approved logo direction: rising line/bar mark with spade detail.
- Follow the Uplinea brand guide for colors, typography, and logo usage.

Design rhythm:

- Operational screens should be compact and fast: Today, Weekly plan, Sessions, Monthly targets, Study.
- Reflective screens can breathe more: Weekly review, session review, Coach AI.

Dark mode:

- Use dark slate/charcoal, not pure black.
- Use the all-white logo on dark mode.
- Provide dark mode rules for sidebar, cards/surfaces, text hierarchy, borders, badges, progress, and session capture.

Logo variations:

- Primary logo.
- Stacked logo.
- Horizontal logo.
- Monochromatic logo.
- Mark only.
- App icon.
- Usage on light, dark, blue, and teal/cyan backgrounds.

Prefer:

- Clear hierarchy.
- Compact summaries.
- Direct CTAs.
- Editable blocks.
- Quick status controls.
- Compact professional rows for blocks, with category chips or left accents.
- Navy plus teal/cyan accents with restrained category colors.

Avoid:

- Hero-style dashboard.
- AI chat-first-only layout.
- Full calendar scheduling.
- Motivational filler.
- Dense analytics.
- Pure black dark mode.
- Casino/gambling visual language.
- Generic SaaS card soup.

## Recommended Implementation Order

This design updates the implementation order:

1. Annual direction MVP
2. Monthly targets MVP
3. Weekly plan MVP
4. Daily execution from weekly blocks
5. Study session log MVP
6. Poker session flow MVP
7. Weekly and session review MVP
8. Coach AI contextual chat and review mock

Before implementation, `DIA-15` should use this spec to redesign the active dashboard/navigation around the planning system.

## Open Product Questions

- Should the first balanced weekly template vary by player profile later, or stay universal until there is real usage data?
- Should the day empty state allow an emergency standalone commitment when there is no weekly plan, or is that out of scope for the MVP?
