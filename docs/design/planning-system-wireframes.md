# Planning System Text Wireframes

## Purpose

Translate the planning-system redesign into implementation-ready text wireframes without prescribing final visual styling.

Source spec:

- `docs/design/planning-system-redesign-spec.md`
- `docs/features/poker-session-flow.md`

This document is for `DIA-15`: redesign dashboard and navigation from the planning system.

## Global App Shell

### Desktop

Use a quiet product layout optimized for repeated daily use.

Recommended shell:

- Left sidebar navigation
- Highlighted `Start session` CTA below the logo
- Main content area
- Optional right/context panel only when a screen needs it

Primary navigation:

- Today
- Weekly plan
- Annual direction
- Monthly targets
- Sessions
- Study
- Review
- Coach AI

Secondary navigation:

- Settings

Highlighted session CTA states:

- `Start session`
- `Active session`
- `Finish and review`

### Mobile

Recommended shell:

- Top bar with current screen title
- Bottom navigation with the same primary surfaces
- Contextual actions inside the screen

Mobile should prioritize Today execution over overview density.

Mobile should also support active-session quick check-up, short session review, and Coach chat.

## Today

Today is the default first screen.

### State A: No Active Weekly Plan

Purpose:

Move the player into the planning spine instead of allowing disconnected daily tracking.

Layout:

1. Page header
   - Title: `Today`
   - Small date/planning-week context
2. Empty state
   - Message: `You do not have a plan for this planning week yet`
   - Primary CTA: `Create weekly plan`
3. Secondary context
   - If monthly targets exist, show a compact monthly pace preview
   - If monthly targets do not exist, show secondary CTA: `Set monthly targets`

Avoid:

- `Prepare day` without a weekly plan
- Generic habit creation
- Coach prompt as the main empty state

### State B: Active Weekly Plan, Day Not Prepared

Purpose:

Help the player decide the day.

Layout priority:

1. Today header
   - Title: `Today`
   - Planning week range
   - Weekly focus as a short line
2. Primary action band
   - CTA: `Prepare day`
   - Brief supporting text: planned blocks are ready to turn into commitments
3. Session CTA/state
   - If Grind block exists: compact `Start session` CTA
   - If session active: `Active session` CTA
   - If session review pending: `Finish review` CTA
4. Today's planned blocks
   - Compact block list
   - Show type, optional title, optional target
   - No heavy editing here
5. Compact planning-week preview
   - Seven days from configured planning-week start
   - Highlight today
   - Max three chips per day plus count
6. Monthly pace summary
   - Status plus short number per category
7. Attention items
   - Only actionable items
   - Examples: no review block this week, study below monthly pace, next week draft exists, hands to review, session review pending
8. Coach insight
   - One compact useful insight
   - CTA: `Ask Coach`

Primary CTA:

- `Prepare day`

Secondary CTAs:

- `Edit weekly plan`
- `Set monthly targets` if missing

### State C: Prepare Day Flow

Purpose:

Convert weekly blocks into 1 to 3 practical commitments.

Recommended pattern:

- Modal, drawer, or focused inline stepper
- Keep it short
- Avoid a full new planning page unless mobile requires it

Steps:

1. Quick state check
   - Sleep, energy, focus, stress only if needed
2. Plan choice
   - `Follow plan`
   - `Adjust plan`
   - `Reduce plan`
3. Commitment selection
   - Pick or edit 1 to 3 commitments derived from today's blocks
4. Confirm
   - CTA: `Start day`

Special case:

- If player chooses `Reduce plan`, show: `What is the minimum that still makes today useful?`

### State D: Execution Mode

Purpose:

Keep the player focused after the day has been prepared.

Layout priority:

1. Execution header
   - Title: `Today`
   - Weekly focus line
   - Status: day prepared
2. Daily commitments
   - 1 to 3 items
   - Each item has quick actions:
     - Done
     - Adjust
     - Not done
3. Secondary action
   - `Adjust day`
4. Original planned blocks
   - Compact, secondary
   - Clear distinction from commitments
5. Session CTA/state
   - Start or return to active session when relevant
6. Compact context
   - Planning-week preview
   - Monthly pace
   - Actionable attention items only
7. End-of-day action
   - `Close day`

Avoid:

- Prominent weekly plan editing
- Dense analytics
- Coach chat
- Repeated prompts to re-plan

### State E: Close Day

Purpose:

Close the daily loop without turning it into a journal.

Recommended pattern:

- Small modal/drawer

Fields:

- Confirm pending statuses
- Optional reason for adjusted/not-done items
- Optional short note

CTA:

- `Close day`

Do not include daily quality rating in the MVP.

## Weekly Plan

Weekly plan is the main planning surface.

### Default Layout

1. Page header
   - Title: `Weekly plan`
   - Planning week range
   - Status: draft, active, reviewed, archived
2. Weekly focus
   - Required short editable field or display line
3. Main weekly board
   - Seven day columns or rows
   - Starts from `weekStartDay`
   - Blocks grouped by day
4. Right/context area
   - Monthly pace context
   - Coach review drawer trigger
   - Next actions

### Weekly Board

Each day should show:

- Day label
- Date
- Block chips/cards
- Lightweight day summary if useful

Each block should show:

- Type
- Optional short title
- Optional target
- Status if the week is active or past

Block actions:

- Add block
- Edit block
- Remove block
- Change status where appropriate
- Start session when block type is Grind

Do not require fixed times.

### Empty State: No Plan

Show:

- Message: no active plan for this planning week
- Primary CTA: `Create weekly plan`
- Secondary CTA: `Copy previous week` if available

If monthly targets are missing:

- Show warning: `Without monthly targets, the plan has less pacing context`
- Secondary CTA: `Set monthly targets`

### First Plan Creation

Flow:

1. Light planning-week start setup
   - Default: `Your planning week starts on Monday`
   - Secondary action: `Change`
2. Start from one balanced editable template
3. Player edits/removes/adds blocks
4. Player sets weekly focus
5. Save as active plan or draft

### Copy Previous Week

Action:

- `Copy previous week`

Behavior:

- Creates a new draft
- Copies planned blocks
- Copies weekly focus
- Does not copy statuses, execution data, review data, daily commitments, or Coach summary

### Coach Review Drawer

Trigger:

- `Review with Coach`

Drawer contents:

1. Review summary
2. Risks found
3. Suggestions

Each suggestion should include:

- Short problem statement
- Proposed change
- CTA: `Review proposal`
- CTA: `Ignore`

Accepting a suggestion should open an editable proposal before applying it.

## Sessions

Purpose:

Start, capture, finish, review, and revisit poker sessions without turning the app into a poker tracker.

### Sessions Page

Layout:

1. Page header
   - Title: `Sessions`
   - Primary CTA: `Start session`
2. Active/pending area
   - Active session card if any
   - Pending review card if any
3. Filters
   - Date/period
   - Session state
   - Review pending
4. Compact history table/list
   - Date
   - Focus
   - Tournaments
   - Decision quality
   - Tilt peak
   - Hands to review
   - State/review status

Avoid:

- Financial summaries
- Calendar-first layout
- Technical hand analysis

### Start Session Flow

Pattern:

- Short drawer/modal

Fields:

- Required session focus
- Optional linked Grind block
- Optional energy/focus/tilt initial values
- Optional micro-intention
- Optional max tables
- Optional quality rule

CTA:

- `Start session`

### Active Session

Purpose:

Focused capture surface for grind.

Desktop layout:

1. Session header
   - Session focus
   - Weekly focus
   - Linked Grind block if any
   - Current micro-intention if any
2. Quick capture controls
   - `Quick check-up`
   - `Hand to review`
   - `Quick note`
   - `Micro-intention`
3. Current state
   - Energy average/current
   - Focus average/current
   - Tilt current/peak
   - Table count if logged
   - Hands to review count
4. Compact latest timeline
   - Latest 3-5 events
5. Contextual Coach insight
   - Very short, non-chat during active play
6. Primary CTA
   - `Finish session`

Mobile layout:

- Prioritize quick check-up and finish/review.
- Do not encourage long phone use during breaks.

### Quick Check-Up

Fields:

- Energy 1-5
- Focus 1-5
- Tilt 0-5
- Optional table count
- Optional micro-intention for the next block/hour

### Hand To Review

Fields:

- Template
- Optional short note

Initial templates:

- ICM
- Big pot
- Bluff catch
- All-in marginal
- River difficult
- Exploit/read
- Emotional mistake

### Quick Note

Templates:

- Autopilot
- Tiredness
- Tilt
- Distraction
- Extra table
- Good decision
- Technical doubt

Optional text note.

### End Session Review

Open immediately after `Finish session`.

If check-ups exist:

- Show automatic summary
- Let player edit/confirm

If no check-ups exist:

- Ask final energy/focus/tilt/decision quality

Fields:

- Tournaments played
- Decision quality
- Focus final
- Energy final
- Tilt final
- Optional financial result: currency plus net amount
- Optional permission to include financial result in Coach AI context
- Optional good decision
- Optional main leak/problem
- Optional next action
- Choose 1-3 priority hands when marked hands exist

Output:

- Session summary
- Review/study backlog updates
- Monthly Grind progress update
- Weekly review context

## Annual Direction

Purpose:

Set the strategic context for the year before the player creates monthly targets.

Layout:

1. Page header
   - Title: `Annual direction`
   - Current year
2. Primary direction
   - One short editable statement
3. Priorities
   - 2 to 4 priority rows
4. Constraints
   - Optional short notes or chips
5. Avoid repeating
   - Optional short note
6. Next action
   - CTA: `Set monthly targets`

Avoid:

- Detailed annual forecasting
- Quarterly planning as a required step
- Financial dashboards
- Heavy OKR language

## Monthly Targets

Purpose:

Set pacing context for weekly planning and Today, using annual direction as strategic context.

Layout:

1. Page header
   - Title: `Monthly targets`
   - Current month
2. Target categories
   - Grind
   - Study
   - Review
   - Sport
3. Per-category target editor
   - Primary unit
   - Target value
   - Optional secondary unit where applicable
4. Month pace summary
   - Light status
   - Short progress number

Avoid:

- Dense analytics
- Financial poker tracking
- Quarterly planning flows

## Study

Purpose:

Fast study-session logging, not a knowledge workspace.

Layout:

1. Page header
   - Title: `Study`
2. Primary CTA
   - `Log study`
3. Lightweight summary
   - Study time this week
   - Study time this month
   - Average quality
   - Common study types
4. Recent study sessions
   - Date
   - Duration
   - Type
   - Quality
   - Linked block indicator if present

### Log Study Flow

Fields:

- Duration
- Study type
- Quality 1 to 5
- Optional note
- Optional linked weekly block

If linked to a planned study block:

- Ask whether to mark the block as done
- Preselect yes only if the logged duration reasonably matches the block target

Out of scope:

- Content library
- Advanced tags
- Course manager

## Review

Purpose:

Weekly review only in the MVP.

Layout:

1. Page header
   - Title: `Review`
   - Planning week range
2. Review CTA/state
   - `Do weekly review` when available
   - If already reviewed, show summary
3. Plan vs execution summary
   - Grind planned vs done
   - Study planned vs done
   - Review planned vs done
   - Sport planned vs done
4. Review fields
   - Execution 1 to 5
   - Energy 1 to 5
   - Focus 1 to 5
   - Quality 1 to 5
   - Main wins
   - Main leaks/problems
   - Main reasons for missed or adjusted blocks
   - Adjustment for next week
5. Coach next-week suggestion
   - Appears after review fields are completed

Review should be recommended, not blocking. If the player skips it, allow creating or continuing the next weekly plan.

## Coach AI

Purpose:

Provide contextual, interactive performance assistance without becoming the only way to use the app.

### Coach AI Page

Layout:

1. Page header
   - Title: `Coach AI`
   - Short subtitle about performance, planning, study, and sessions
2. Chat area
   - Free text input
   - Suggested prompts
   - Context-used indicator
3. Suggested prompts
   - Adjust this week
   - Analyze monthly pace
   - Suggest a study session
   - Analyze recent sessions
   - I feel lost, what should I do today?
4. Response actions
   - Save insight
   - Create proposal
   - Apply with confirmation
   - Ignore

### Contextual Coach Drawer

Can appear from:

- Today
- Weekly plan
- Sessions
- Study
- Review

Should include:

- Current context summary
- One or more suggested actions
- Free text follow-up input
- Context-used line, such as `Used: weekly plan + last 3 sessions`

### Coach Boundaries

The Coach may help with:

- Planning
- Accountability
- Performance patterns
- Session habits
- Study/review prioritization
- Recovery and consistency

The Coach must not:

- Give technical hand analysis
- Suggest specific poker lines
- Auto-apply changes
- Use financial data without permission

## Settings

Minimum relevant setting for this redesign:

- Planning week start day
- Coach AI data permissions
- Dark mode

This value is first introduced lightly during first weekly plan creation, then remains editable in settings.

## Visual Priority Notes

The product should feel calm, structured, and practical.

Use cards only for repeated items or contained tools. Avoid decorative dashboard panels that do not map to a real decision.

Prefer:

- Clear hierarchy
- Compact summaries
- Direct CTAs
- Editable blocks
- Quick status controls

Avoid:

- Hero-style dashboard
- AI chat-first layout
- Full calendar scheduling
- Motivational filler
- Dense analytics
