# Poker Session Flow MVP Feature Spec

## Objective

Create a lightweight poker session flow that turns real grind data into useful context for planning, accountability, review, study, and Coach AI guidance.

The session flow should help the player start with intention, capture useful signals during play, close the session with a short review, and feed future planning decisions.

It must not become a poker tracker, hand history tool, solver, casino product, or financial dashboard.

## Product Direction

The app loop is:

`Plan -> Execute -> Capture signals -> Review -> Coach patterns -> Adjust the next plan`

Sessions are a core execution surface because they create the real-world data that helps the Coach AI understand the player over time.

The planning system remains the macro layer. Sessions are the micro execution layer for poker grind.

## Core Principles

- Capture useful signals with low friction.
- Do not interrupt play or encourage phone use during breaks.
- Breaks are for rest; check-ups should be fast and optional.
- The more the player logs, the better the Coach AI can identify patterns, but logging should never feel mandatory during play.
- Coach AI can use session data for performance, planning, study, recovery, and accountability patterns.
- Coach AI must not provide technical poker hand analysis.
- Financial result data is optional, private, and only useful as context for Coach AI if the player allows it.

## Entry Points

Primary global CTA:

- `Iniciar sessão`

This CTA should be visually highlighted in the sidebar below the logo.

CTA states:

- `Iniciar sessão`
- `Sessão ativa`
- `Terminar e rever`

Other entry points:

- Today's Grind block
- Weekly plan Grind block
- Sessions page

The player can start a session from a planned Grind block or create a standalone session.

## Navigation

Sessions should be a primary app surface.

Recommended primary navigation:

- Hoje
- Plano semanal
- Objetivos
- Sessões
- Estudo
- Revisão
- Coach AI

## Session Rules

- One active session at a time.
- The product is optimized for one poker session per day.
- More than one completed session per day may exist, but it is not the primary case.
- If a session already exists today, starting another session should show a light warning, not a hard block.

## Quick Start Session Setup

Pattern:

- One short drawer or modal.
- Do not use a long multi-step setup.

Required:

- Session focus: short required field.

Optional:

- Link to planned Grind block.
- Initial energy 1-5.
- Initial focus 1-5.
- Initial tilt 0-5.
- Initial micro-intention with templates.
- Max tables, suggested from plan/block when available.
- Quality rule, suggested from plan/block when available.

The player should be able to start quickly. Missing optional context is also useful signal for Coach AI.

## Active Session

Purpose:

Help the player capture session signals without creating cognitive load.

Desktop should use a focused session page.

Mobile should support quick check-ups and Coach chat, but should not encourage phone use during breaks.

Primary elements:

- Session focus.
- Weekly focus/intention.
- Current micro-intention, if set.
- Linked Grind block, if any.
- Max tables and quality rule, if set.
- Quick capture buttons.
- Compact latest timeline.
- Small contextual Coach insight when useful.
- Finish session CTA.

Quick capture:

- Check-up rápido.
- Mão para rever.
- Nota rápida.
- Micro-intenção.

## Check-Up Rápido

Can be used during breaks or any moment the player chooses.

Fields:

- Energy 1-5.
- Focus 1-5.
- Tilt 0-5.
- Optional micro-intention for the next hour/block.
- Optional number of open tables.

No notifications or forced break reminders in the MVP.

## Micro-Intentions

Micro-intentions are optional.

They can be set:

- At session start.
- During a check-up.
- During breaks.

Initial templates:

- Mais calma.
- Menos mesas.
- ICM consciente.
- Sem autopilot.
- Decisões mais lentas.
- Proteger energia.

Text should be editable.

## Hands To Review

Hands marked during sessions become review/study backlog.

The Coach AI may use this backlog only for organization and performance patterns, not technical hand advice.

Correct Coach use:

- Suggest planning review time when hands accumulate.
- Notice that many hands are marked in high-tilt sessions.
- Suggest a study/review block for recurring categories.

Incorrect Coach use:

- Suggesting poker lines such as shove, call, fold, bluff, or sizing.

MVP capture:

- Button: `Mão para rever`.
- Template.
- Optional short note.

Initial templates:

- ICM.
- Big pot.
- Bluff catch.
- All-in marginal.
- River difícil.
- Exploit/read.
- Erro emocional.

Future:

- Custom templates.

## Quick Notes

Quick notes are separate from hands to review.

Initial templates:

- Autopilot.
- Cansaço.
- Tilt.
- Distração.
- Mesa extra.
- Boa decisão.
- Dúvida técnica.

Each note may include optional text.

## Timeline

During the active session:

- Show only the latest 3-5 events.
- Do not make the timeline the center of the screen.

After the session:

- Show a summarized timeline.
- Let the detailed timeline be collapsed and filterable.

## End Session Review

When the player clicks `Terminar sessão`, open a short review immediately.

Allow saving/finishing later if the player is exhausted.

If the player made check-ups during the session:

- Show automatic summary.
- Let the player edit or confirm.

If the player did not make check-ups:

- Ask for final energy, focus, tilt, and decision quality.

Required:

- Number of tournaments played.
- Decision quality 1-5.
- Focus final 1-5.
- Energy final 1-5.
- Tilt final 0-5.

Automatically captured:

- Started at.
- Ended at.
- Duration.

Duration is background context, not a highlighted tournament-performance metric.

Optional:

- Financial result: currency plus net amount.
- Include financial result in Coach AI memory.
- Good decision.
- Main mistake/leak.
- Next action.
- Select 1-3 priority hands from marked hands.

## Financial Result

Financial result is optional and secondary.

Rules:

- Store currency and net amount only if the player enters it.
- Do not show financial result on dashboards by default.
- Do not build financial graphs in the MVP.
- Coach AI may use it only with explicit permission.
- Result should never be used as the main quality signal for MTT performance.

## Session Review Outputs

The session review should feed:

- Session detail.
- Monthly Grind progress.
- Hands-to-review backlog.
- Study/review planning.
- Weekly review.
- Coach AI pattern detection.

The session review may suggest:

- Creating a Review block if hands accumulate.
- Creating a Study block if a recurring category appears.
- Adjusting the next plan if sessions repeatedly end early, tilt spikes, or energy drops.

Suggestions should never be auto-applied.

## Coach AI Use

Coach AI may identify patterns such as:

- Tilt rises when energy drops.
- Sessions without micro-intention correlate with lower focus.
- Many marked hands accumulate without review blocks.
- Sessions repeatedly end early.
- Table count rises above the intended limit.
- Study after certain session types has lower quality.

Coach AI must focus on:

- Performance.
- Organization.
- Accountability.
- Planning.
- Recovery.
- Study/review prioritization.

Coach AI must not focus on:

- Technical hand analysis.
- Solver-like advice.
- Financial tracking.

## Sessions Page

Purpose:

- Show active session.
- Show pending session reviews.
- Show compact session history.

MVP filters:

- Date/period.
- Session state.
- Review pending.

Each history row should show:

- Date.
- Focus.
- Number of tournaments.
- Decision quality.
- Tilt peak.
- Hands to review.
- State/review status.

Avoid:

- Calendar-first layout.
- Heavy analytics.
- Financial summaries.

## Data Model Draft

### `sessions`

- userId
- weeklyPlanBlockId
- date
- status: setup | active | reviewPending | reviewed
- focus
- initialEnergy
- initialFocus
- initialTilt
- initialMicroIntention
- maxTables
- qualityRule
- tournamentsPlayed
- decisionQualityFinal
- energyFinal
- focusFinal
- tiltFinal
- energyAverage
- focusAverage
- tiltAverage
- tiltPeak
- tableCountPeak
- financialCurrency
- financialNetAmount
- allowCoachFinancialContext
- goodDecision
- mainLeak
- nextAction
- startedAt
- endedAt
- reviewedAt
- createdAt
- updatedAt

### `sessionEvents`

- sessionId
- userId
- type: checkUp | handToReview | quickNote | microIntention
- energy
- focus
- tilt
- tableCount
- template
- note
- createdAt

### `reviewHands`

- userId
- sessionId
- eventId
- category
- note
- priorityRank
- status: pending | priority | reviewed
- createdAt
- updatedAt

## UX Boundaries

- Do not require logging during play.
- Do not encourage phone use during breaks.
- Do not add hand-history import in the MVP.
- Do not add detailed tournament-by-tournament tracking.
- Do not build financial analytics.
- Do not turn Coach AI into a technical poker hand coach.

## Success Criteria

- Player can start a session in under 30 seconds.
- Player can make a check-up in under 10 seconds.
- Player can mark a hand for review in under 10 seconds.
- Player can finish the short session review in under three minutes.
- Session data improves dashboard attention items, weekly review, and Coach AI suggestions.
