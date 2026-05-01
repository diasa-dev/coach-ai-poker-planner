# Post-Session Review Feature Spec

## Objective

Help the player close the learning loop after a poker session by turning live session data into a short review, a small number of priority hands, and one concrete improvement action.

The post-session review should be a focused debrief, not a financial report, hand history tool, or long journal.

## Product Rationale

The review exists because experience alone does not reliably become improvement. The player needs a short structure that converts the session into feedback and a next action while the session is still fresh.

The review should help answer:

- Did I follow the session focus?
- Where did decision quality drop?
- Which hands matter most for review?
- What pattern should I pay attention to?
- What is the next improvement action?

## Evidence-Informed Principles

- After-action reviews and debriefs are more useful when they are structured, specific, and connected to goals.
- Deliberate improvement depends on identifying a task, a gap, and a next action.
- Reflection should stay close to performance, but it should not become a long emotional dump.
- Poker results contain variance, so process and decision quality should stay more important than financial outcome.

## Entry Point

Primary route:

`/session/review`

Expected flow:

`Dashboard -> Preparar sessão -> Iniciar sessão -> Terminar sessão -> /session/review`

Until the review route exists, the live session screen may show a local `Sessão terminada` state.

## User Flow

### 1. Session Summary

Purpose: give the player useful context without requiring manual reconstruction.

Automatically include:

- pending hands count
- energy average
- tilt peak
- micro-intentions
- quick notes
- filtered key timeline events

Do not show the full raw timeline by default.

### 2. Performance Questions

Purpose: translate the session into learning.

Questions:

- `Cumpriste o foco principal?`
- `Onde a qualidade da decisão caiu?`
- `Qual foi a melhor decisão?`
- `Qual mão/padrão tens de rever?`
- `Qual é a próxima ação?`

The questions should be short, direct, and optimized for a 2-4 minute review.

### 3. Pending Hands Prioritization

Purpose: turn marked hands into actual review work.

Flow:

- show hands pending from the live session
- ask the player to choose 1-3 priority hands
- selected hands become immediate review priorities
- unselected hands remain pending and can appear on the dashboard

Avoid forcing the player to review every hand immediately. That can create friction and procrastination.

### 4. Optional Simple Result

Purpose: capture result context without letting money dominate the review.

Inputs:

- `positivo`
- `negativo`
- `break-even`
- optional short free-text note

Out of scope:

- ROI
- ABI
- buy-ins
- tournament-by-tournament results
- financial charts

### 5. Improvement Plan

Purpose: close the loop with a concrete output.

Output:

- session summary
- main pattern
- 1 study/review action
- priority hands

Example:

`Padrão: qualidade caiu quando o tilt chegou a 4/5. Próxima ação: rever 3 spots ICM marcados antes da próxima sessão.`

## Data Model Draft

### `sessions`

- status: reviewed
- resultType: positive | negative | breakEven | notSet
- resultNote
- focusFollowed
- decisionQualityDrop
- bestDecision
- handOrPatternToReview
- nextAction
- mainPattern
- improvementAction
- reviewedAt
- updatedAt

### `reviewHands`

- sessionId
- eventId
- priorityRank
- status: priority | pending | reviewed
- note
- updatedAt

## UX Principles

- Complete in 2-4 minutes.
- Use live session data as context, not as a wall of logs.
- Focus on process, learning, and next action.
- Keep result financial context optional and lightweight.
- Do not generate deep AI analysis in the first version.
- Do not force all pending hands to be reviewed immediately.

## Success Criteria

- Player can complete review in under four minutes.
- Player chooses 1-3 priority hands when there are pending hands.
- Review ends with one concrete next action.
- Dashboard can show pending hands plus simple session metrics.
- Review feels like closing a performance loop, not filling a report.

## Dashboard Summary After Review

The dashboard may show:

- pending hands count
- energy average
- tilt peak
- next action

Example:

`4 mãos por rever · energia média 3/5 · tilt pico 4/5`

## Out Of Scope For First Implementation

- deep AI-generated analysis
- full hand history import
- tournament result tracking
- financial analytics
- charts
- coach/team sharing
- reviewing every hand inside this flow

## First Implementation Slice

Recommended first slice:

- create `/session/review`
- use local/default state from the live session shape
- show summary cards for pending hands, energy average, and tilt peak
- show filtered timeline examples
- add the five performance questions
- allow choosing 1-3 priority hands
- add simple optional result
- generate a local improvement plan preview

Do not add real AI generation or financial tracking in this slice.
