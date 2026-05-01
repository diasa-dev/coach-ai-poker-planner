# Session Flow Feature Spec

## Objective

Help an online poker player prepare for, execute, and review a session with higher consistency, focus, and self-regulation.

The session flow should improve performance before and during play. It should not become a poker tracker, finance tool, or heavy note-taking workspace.

## Product Problem

The player needs a lightweight system that answers:

- Am I ready to play now?
- What is my single focus for this session?
- What should I do if tilt, fatigue, or autopilot appears?
- How can I capture important moments without breaking flow?
- What is the smallest useful review after the session?

## Evidence-Informed Principles

- Pre-performance routines can support attention and composure under pressure.
- Implementation intentions, such as if-then plans, help self-regulation when predictable obstacles appear.
- Mental fatigue can reduce attention, accuracy, and reaction quality over time.
- Deliberate improvement needs specific goals, feedback, and short review loops.

## Flow

### 1. Dashboard

The dashboard is not the session workspace.

It should show fast information:

- session readiness summary, not editable sliders
- today's main focus
- next scheduled session
- session status
- primary CTA

Possible CTA states:

- `Preparar sessão`
- `Iniciar sessão`
- `Voltar à sessão`
- `Fazer review`

The dashboard may show whether a pre-session check-in has been completed, but the actual check-in belongs in the pre-session flow.

### 2. Pre-Session

Purpose: decide if the player should start and define the intended mode of play.

This is the first core session screen. It starts from the dashboard CTA:

`Dashboard -> Preparar sessão -> /session/prepare`

Detailed implementation spec: `docs/features/session-prepare.md`

Inputs should be short and performance-oriented:

- sleep
- energy
- focus
- stress
- tilt risk
- platform
- planned start time
- max tables
- tournament/session type
- late registration allowed
- main session focus
- one quality rule
- one or more if-then anti-tilt plans

Output:

- clear start recommendation
- session intention
- anti-tilt plan
- constraints for the session, such as max tables or no extra late registration

Recommended start decision states:

- `Pronto para jogar`
- `Jogar com restrições`
- `Não recomendado começar agora`

The final action is:

- `Iniciar sessão`

This moves the player into the live session route.

### 3. Live Session

Purpose: ultra-fast capture without interrupting play.

This should be a dedicated session screen, not inside the Coach AI chat.

Controls:

- mark hand
- tilt +1
- break done
- quick note
- low energy

The screen should be low-friction:

- large controls
- minimal text
- no dense dashboard layout
- no analytics while playing

Coach AI can appear only as small contextual guidance, not as the main input surface.

### 4. Post-Session Review

Purpose: two-minute review to create learning and accountability.

Inputs:

- simple result
- focus
- energy
- tilt
- one good decision
- one mistake to review
- marked hands
- next action

Output:

- session summary
- data available for Coach AI feedback
- one next improvement action

## Data Model Draft

### `sessions`

- userId
- date
- status: planned | prepared | active | reviewed
- title
- platform
- startTime
- sessionType
- lateRegistrationAllowed
- maxTables
- focus
- qualityRule
- antiTiltPlan
- sleepStart
- energyStart
- focusStart
- stressStart
- tiltRiskStart
- startRecommendation
- markedHandsCount
- tiltCount
- breaksDone
- lowEnergyCount
- quickNotes
- postFocus
- postEnergy
- postTilt
- goodDecision
- mistakeToReview
- nextAction
- updatedAt

## UX Boundaries

- Dashboard only summarizes and routes.
- Do not put editable pre-session check-in controls on the dashboard.
- Live session has its own route and purpose.
- Coach AI uses session data, but does not own the session capture UI.
- Do not show advanced stats in MVP.
- Do not add financial tracking beyond simple context fields.

## Success Criteria

- Player can prepare a session in under 60 seconds.
- Player can capture a live event in one tap.
- Player can complete review in under two minutes.
- Refreshing the app preserves session state.
- Dashboard remains readable and action-oriented.

## Out Of Scope For First Implementation

- full session calendar
- profit/loss analytics
- hand history import
- tournament database
- team/coach sharing
- AI-generated deep session analysis

## First Implementation Slice

Recommended first slice:

- Remove editable pre-session controls from the dashboard and replace them with a readiness summary plus CTA.
- Add dedicated `/session/prepare` route.
- Build the pre-session flow with readiness, grind constraints, intention, anti-tilt plan, and start recommendation.
- Persist status: planned -> prepared -> active.

Do not implement live capture and post-session review until the route and preparation flow feel right.
