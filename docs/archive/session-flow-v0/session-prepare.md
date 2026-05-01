# Session Prepare Feature Spec

## Objective

Help the player decide whether to start a poker session now, define the intended mode of play, and reduce predictable performance leaks before tables are open.

This screen is a preparation tool, not a dashboard, tracker, or chat.

## Product Rationale

The preparation flow should support high-level performance through:

- a short pre-performance routine that narrows attention before play
- readiness checks for sleep, energy, focus, stress, and tilt risk
- explicit constraints that protect the session from autopilot decisions
- if-then plans for predictable failure points, such as tilt, fatigue, or table creep
- one clear start decision instead of a vague feeling of readiness

## Entry Point

Primary route:

`Dashboard -> Preparar sessão -> /session/prepare`

The dashboard CTA should route here when there is no active session.

## User Flow

### 1. Readiness

Purpose: establish current state quickly.

Inputs:

- sleep: 1-5
- energy: 1-5
- focus: 1-5
- stress: 1-5
- tilt risk: 1-5
- decision quality risk
- main session focus

Output:

- readiness score
- readiness label
- short warning when one factor is risky

### 2. Session Plan

Purpose: define the minimum constraints before the player is emotionally involved.

Inputs:

- max tables
- one quality rule

Default copy examples:

- `6 mesas no máximo`
- `Decisão de qualidade > volume.`
- `ICM calmo no late game.`

### 3. Performance Guardrails

Purpose: convert intent into concrete rules.

Inputs:

- one quality rule
- one to three if-then plans

Examples:

- Quality rule: `Decisão de qualidade > volume.`
- If-then: `Se abrir mesas extra por impulso, então fecho a próxima mesa marginal.`
- If-then: `Se sentir tilt depois de bad beat, então marco a mão e espero 60 segundos antes da próxima decisão marginal.`
- If-then: `Se energia cair para 2/5, então reduzo mesas no próximo break.`

### 4. Start Decision

Purpose: make the decision explicit.

States:

- `Pronto para jogar`
- `Jogar com restrições`
- `Não recomendado começar agora`

Decision rules for MVP:

- `Pronto para jogar`: readiness high and no critical factor is too low/high.
- `Jogar com restrições`: readiness medium, or one risk factor needs a constraint.
- `Não recomendado começar agora`: readiness low, or tilt/stress risk is too high.

The screen should explain the reason in one short sentence.

### 5. Final Action

Primary action:

- `Iniciar sessão`

Secondary actions:

- `Guardar preparação`
- `Voltar ao dashboard`

When the player starts:

- create or update session
- set status to `active`
- move to future live session route

For the first UI slice, the button may stop at prepared state if the live route is not implemented yet.

## Data Model Draft

### `sessions`

- userId
- date
- status: planned | prepared | active | reviewed
- maxTables
- mainFocus
- decisionQualityRisk
- qualityRule
- ifThenPlans
- sleepStart
- energyStart
- focusStart
- stressStart
- tiltRiskStart
- readinessScore
- startRecommendation
- startRecommendationReason
- createdAt
- updatedAt

## UX Principles

- Keep it completable in under 60 seconds.
- Use controls, not long text fields, for repeated inputs.
- Use one compact free-text field only where the player's wording matters.
- Do not show analytics while preparing.
- Do not make this part of the Coach AI chat.
- The Coach can provide a recommendation, but the player owns the decision.
- Keep the layout calmer and more focused than the dashboard.

## First Implementation Slice

Build only `/session/prepare` with local/default state first:

- readiness controls
- decision quality risk
- main focus
- max table constraint
- quality rule
- if-then plans
- calculated recommendation
- actions that do not yet require live session implementation

Out of scope for the first implementation slice:

- live session capture
- post-session review
- full session history
- AI-generated recommendations
- calendar scheduling

## MVP Product Decisions

### Draft Creation

Do not create a session draft immediately when the user opens `/session/prepare`.

Create or update the session only when the player clicks:

- `Guardar preparação`
- `Iniciar sessão`

Reason: opening the page should not pollute session history with abandoned drafts.

### Starting Against Recommendation

Allow the player to start even when the recommendation is `Não recomendado começar agora`, but require an override reason.

MVP copy:

`Quero começar apesar do aviso porque...`

Reason: the app should guide performance decisions without taking control away from the player.

### Daily Check-In Defaults

Reuse daily check-in values as defaults when available, but keep session readiness as a separate snapshot.

Reason: the daily state can help pre-fill the form, but session readiness can change later in the day.

### Max Tables Control

Use preset buttons plus a numeric field.

Presets:

- `2`
- `4`
- `6`
- `8`

The player can still type a custom value.

Reason: presets keep the flow fast, while custom input avoids forcing the wrong constraint.

### First Start Behavior

Before the live route exists, `Iniciar sessão` keeps the player on `/session/prepare` and shows a local `Sessão iniciada` state.

Reason: live session capture is a separate product area and needs its own Product Discovery Workflow before implementation.

## Remaining Product Questions

- Should the first persisted version store prepared sessions in Convex immediately, or keep one more local UX iteration first?
