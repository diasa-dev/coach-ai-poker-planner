# Claude Design System Prompt

Use this prompt in Claude Design System mode.

```txt
Create a complete design system for Uplinea.

Important brand note:
Uplinea is the approved product name. The logo direction, line/bar mark, spade detail, color palette, and typography are defined by the Uplinea brand guide.

I will attach the logo and brand guide. Use the logo system as a visual foundation, but improve the UI creatively where needed.

Product context:
Uplinea is a professional performance app for online poker tournament players. It helps the player plan, execute, capture real session/study data, review patterns, and use Coach AI to move closer to professional and personal goals.

The app is not:
- a casino app
- a gambling app
- a poker financial tracker
- a technical hand analysis tool
- a generic Notion workspace
- a generic AI chatbot wrapper
- a landing page

The product loop:
Monthly targets -> Weekly plan -> Daily execution -> Poker sessions / Study -> Reviews -> Coach AI patterns -> Next weekly plan

Core product areas:
- Today / operational dashboard
- Weekly plan
- Monthly targets
- Poker sessions
- Study log
- Reviews
- Coach AI
- Settings / privacy

Primary navigation:
- Today
- Weekly plan
- Monthly targets
- Sessions
- Study
- Review
- Coach AI

Global CTA:
Add a highlighted Start session CTA below the logo in the sidebar.

CTA states:
- Start session
- Active session
- Finish and review

Design direction:
Use a hybrid rhythm:
1. Operational screens should be compact, fast, and highly scannable:
   - Today
   - Weekly plan
   - Sessions
   - Monthly targets
   - Study
2. Reflective/AI screens can be calmer and more spacious:
   - Weekly review
   - Session review
   - Coach AI

Visual style:
- professional
- calm
- focused
- modern
- premium but functional
- built for daily use
- compact, but not cramped
- clear hierarchy
- no casino/gambling look
- no generic SaaS card-heavy dashboard

Palette and dark mode:
- Use navy plus teal/cyan as core accents.
- Use restrained category colors.
- Dark mode must be dark slate/charcoal, not pure black.
- Use the all-white logo on dark mode.
- Include light mode and dark mode tokens.
- Include dark mode examples for dashboard, active session, and Coach AI.

Logo variations:
Follow the attached correct logo variation reference.
Include:
- Primary logo
- Stacked logo
- Horizontal logo
- Monochromatic logo
- Mark only
- App icon
- Usage on light background
- Usage on dark background
- Usage on blue background
- Usage on teal/cyan background

Design system components to create:
- App shell / sidebar
- Topbar
- Primary highlighted Start session CTA
- Buttons
- Icon buttons
- Inputs
- Selects
- Textareas
- Sliders/rating controls
- Segmented controls
- Toggles
- Cards
- Compact rows
- Tables
- Drawers
- Modals
- Badges
- Status pills
- Progress indicators
- Empty states
- Attention items
- Coach insight card
- Chat input
- Prompt chips
- Proposal cards
- Privacy/data-permission toggles

Plan block component:
Create a compact professional plan block component.
Avoid large colorful cards.

Block should support:
- compact row version
- expanded version
- category color accent
- type chip
- title
- optional target
- status pill
- quick actions

Block categories:
- Grind
- Study
- Review
- Sport
- Rest
- Admin/Other

Block statuses:
- Planned
- Done
- Adjusted
- Not done

Today / dashboard should include:
- current date / planning week
- required weekly focus/intention as a compact line
- today's commitments
- today's planned blocks
- session CTA/state
- weekly progress
- compact monthly pace
- attention items only when actionable
- compact Coach AI insight with Ask Coach CTA

Attention items can include:
- study below pace
- review below pace
- hands to review
- missed/adjusted block
- pending session review
- weekly review due

Weekly plan:
- Default view: list
- Alternative view: table/board
- Required weekly focus/intention
- Copy previous week
- Add block
- Review with Coach
- Blocks grouped by day
- No fixed-time calendar requirement

Monthly targets:
- Grind
- Study
- Review
- Sport
- Current vs target
- Current pace vs expected pace
- Keep compact and avoid heavy analytics

Poker sessions:
Sessions are core because they feed Coach AI with real grind context.

Create components and screens for:
- Start session drawer/modal
- Active session page
- Quick check-up
- Hand to review
- Quick note
- Micro-intention
- Session timeline
- End session review
- Sessions list/history

Start session:
- Required session focus
- Optional linked Grind block
- Optional energy/focus/tilt initial values
- Optional micro-intention
- Optional max tables
- Optional quality rule

Active session:
- Dedicated focused page on desktop
- Quick capture controls:
  - Quick check-up
  - Hand to review
  - Quick note
  - Micro-intention
- Show session focus
- Show weekly focus
- Show current micro-intention if set
- Show latest 3-5 timeline events
- Show compact Coach insight, not open chat during active play
- CTA: Finish session

Quick check-up:
- Energy 1-5
- Focus 1-5
- Tilt 0-5
- Optional table count
- Optional micro-intention for next hour/block

Hand to review:
- Template + optional note
- Templates:
  - ICM
  - Big pot
  - Bluff catch
  - All-in marginal
  - River difficult
  - Exploit/read
  - Emotional mistake

Quick note:
- Template + optional text
- Templates:
  - Autopilot
  - Tiredness
  - Tilt
  - Distraction
  - Extra table
  - Good decision
  - Technical doubt

End session review:
- If check-ups exist, show automatic summary and allow edit/confirm
- If no check-ups exist, ask final energy/focus/tilt/decision quality
- Required:
  - tournaments played
  - decision quality
  - final focus
  - final energy
  - final tilt
- Optional:
  - financial result: currency + net amount
  - permission to include financial result in Coach AI context
  - good decision
  - main leak/problem
  - next action
  - choose 1-3 priority hands

Financial result:
- Optional and secondary
- Not shown in dashboards by default
- No financial charts
- Used by Coach AI only with explicit permission

Study log:
- Fast log, not knowledge workspace
- Duration
- Study type
- Quality 1-5
- Optional note
- Optional linked weekly block
- Duration presets:
  - 25m
  - 45m
  - 60m
  - 90m

Weekly review:
- Recommended, not mandatory
- Summary first
- Ratings:
  - execution
  - energy
  - focus
  - quality
- Plan vs reality
- Main wins
- Main leaks/problems
- Adjustment for next week
- Coach suggestion after the player reflects

Coach AI:
Coach AI should be present and interactive, but not the only way to use the app.

Create:
- Coach AI page with free chat
- Contextual drawer
- Compact dashboard insight
- Proposal cards
- Context-used indicator
- Prompt chips

Suggested prompt chips:
- Adjust this week
- Analyze monthly pace
- Suggest a study session
- Analyze recent sessions
- I feel lost, what should I do today?

Coach behavior:
- Direct
- Calm
- Practical
- No fake motivation
- Can challenge repeated procrastination without guilt
- Can propose changes, but player confirms before applying
- Shows simple context used, like weekly plan + last 3 sessions
- Does not provide technical poker hand analysis

Coach can help with:
- planning
- accountability
- performance patterns
- session habits
- study/review prioritization
- recovery
- consistency

Privacy:
- Include Settings / privacy controls
- Data permission toggles by data type
- Sensitive/optional data such as financial results should have contextual permission controls

Mobile:
Do not replicate full desktop density.
Show mobile designs/components for:
- Today
- Active session quick check-up
- Coach AI chat
- Short review

Do not encourage phone use during breaks. Breaks are for rest; check-ups are optional and fast.

Output needed:
1. Full design system tokens and components.
2. Light and dark mode.
3. Key screen examples:
   - Today/dashboard
   - Weekly plan list view
   - Monthly targets
   - Sessions page
   - Active session
   - End session review
   - Study log
   - Weekly review
   - Coach AI
4. Key interaction states:
   - start session
   - active session
   - quick check-up
   - mark hand to review
   - quick note
   - finish session
   - log study
   - review with Coach
   - ask Coach
   - accept/ignore/edit proposal

Use Portuguese from Portugal for all visible UI copy.
```
