# Live Session Feature Spec

## Objective

Help the player capture important session events with minimal attention cost while protecting the plan created in session preparation.

The live session screen should be a fast capture surface for online poker tournaments. It should not become a dashboard, tracker, chat, or analysis page.

## Product Rationale

During a tournament session, the player's main task is playing poker. The app should support performance without becoming another source of cognitive load.

The live session flow should be designed around:

- low interruption cost
- fast state capture with timestamps
- visible session constraints
- pending hand review accountability
- break-based micro-intentions
- short contextual regulation when risk signals increase
- clean data for the post-session review

## Evidence-Informed Principles

- Interruptions and task switching can increase cognitive load and make it harder to return attention to the primary task.
- Mental fatigue can impair technical and decision-making performance in skilled athletes and high-pressure tasks.
- Under pressure, attention can move toward worries or irrelevant cues, reducing resources available for the main task.
- Implementation intentions are most useful during execution when the relevant cue appears and the response is simple.

## Entry Point

Primary route:

`/session/live`

Expected flow:

`Dashboard -> Preparar sessão -> Iniciar sessão -> /session/live`

Until the live route exists, the prepare screen may keep a local `Sessão iniciada` state.

## User Flow

### 1. Session Header

Purpose: keep the player anchored to the plan.

Always visible:

- main focus
- max tables
- quality rule

This information should be compact and readable at a glance.

### 2. State Capture

Purpose: capture useful state changes with timestamped context.

First version state inputs:

- tilt scale: `0-5`
- energy scale: `1-5`

Each value selection creates a timeline event:

- `22:05 · Tilt 3/5`
- `22:18 · Energia 2/5`

Do not use `Tilt +1` or `Energia baixa` counters as the primary model. Tilt and energy are states that fluctuate, not only events that increment.

### 3. Hands To Review

Purpose: make important hands hard to forget without replacing the player's tracker, screenshots, or Discord workflow.

First version flow:

- click `Mão para rever`
- choose a template
- optional short note
- save to pending review list

Default templates:

- `ICM`
- `Big pot`
- `Bluff catch`
- `All-in marginal`
- `River difícil`
- `Exploit / read`
- `Erro emocional`

Example:

- `21:15 · Mão para rever · ICM · AQo BB vs BTN`

This should create pending review accountability for the dashboard and post-session review.

### 4. Break Micro-Intention

Purpose: use tournament breaks as natural reset points without tracking break completion.

First version flow:

- choose a micro-intention template
- optionally edit the text
- save for the next block

Default templates:

- `Mais calma`
- `Menos mesas`
- `ICM consciente`
- `Sem autopilot`
- `Decisões mais lentas`
- `Proteger energia`

Example:

- `22:55 · Micro-intenção · Sem autopilot em spots ICM`

Out of first version:

- `Break feito`, because online tournament breaks are structural and do not need tracking in MVP.
- detailed hand notes
- financial results
- table-by-table tracking

### 5. Quick Note

Purpose: capture unexpected context without long writing.

First version:

- default fixed templates
- optional short free-text note

Default templates:

- `ICM`
- `Bad beat`
- `Autopilot`
- `Dúvida river`
- `Mesa extra`
- `Cansaço`

Future:

- templates configurable in settings or session preferences
- Coach AI may suggest templates based on repeated leaks

Do not build template settings in the first live session slice.

### 6. Session State

Purpose: show whether the session is drifting from the plan without creating analysis mode.

Always visible:

- pending hands count
- current tilt
- current energy
- energy average
- tilt peak

Avoid:

- charts
- events per hour
- profit/loss
- hand history import
- dense timeline

### 7. Timeline

Purpose: confirm capture without turning the screen into analysis.

Show only the latest 3-5 events in a small side list.

Timeline event types:

- handToReview
- tiltState
- energyState
- microIntention
- quickNote

The complete timeline belongs in post-session review or future analysis, not as the main live screen.

### 8. Coach AI Context

Purpose: provide very short regulation prompts when risk signals or drift appear.

The Coach must be contextual and lightweight, not a chat.

Examples:

- `Tilt 4/5. Volta à regra de qualidade.`
- `Energia média 2/5. Evita abrir mesas extra.`
- `Já marcaste 5 mãos. Chega para review, agora volta ao foco.`

Rules:

- no open chat during live play
- no long explanations
- no dense analysis
- only show guidance when it can reduce risk or restore focus

### 9. Finish Session

Primary action:

- `Terminar sessão`

Expected behavior:

- move directly to post-session review

Reason: review is most valuable while the session is still fresh, and this closes the loop:

`preparar -> jogar -> rever`

## Data Model Draft

### `sessions`

- status: active | reviewed
- mainFocus
- maxTables
- qualityRule
- pendingHandsCount
- currentTilt
- currentEnergy
- energyAverage
- tiltPeak
- latestMicroIntention
- startedAt
- endedAt
- updatedAt

### `sessionEvents`

- sessionId
- userId
- type: handToReview | tiltState | energyState | microIntention | quickNote
- value
- template
- note
- createdAt

## UX Principles

- One tap for scale values and common templates.
- Large controls.
- Minimal text.
- No dashboard layout.
- No analytics during play.
- No Coach chat during play.
- The player should be able to use it without breaking focus.
- Mobile should be viable, but desktop is the main grind context.

## Success Criteria

- Player can capture tilt and energy state in one tap.
- Player can mark a hand for review in under 10 seconds.
- Player can set a break micro-intention in under 10 seconds.
- Player can add a quick note in under 10 seconds.
- Player can see focus, max tables, and quality rule without searching.
- Player can see pending hands, current tilt, current energy, energy average, and tilt peak at a glance.
- Session finish moves directly into review.

## Dashboard Summary After Session

The dashboard should not show the full timeline.

It may show:

- pending hands count
- energy average
- tilt peak

Example:

`4 mãos por rever · energia média 3/5 · tilt pico 4/5`

## Out Of Scope For First Implementation

- post-session review UI
- template settings
- real Coach AI generation
- financial tracking
- hand history import
- table-by-table tracking
- calendar or scheduling

## First Implementation Slice

Recommended first slice:

- create `/session/live`
- use local/default state only
- show focus, max tables, and quality rule from defaults
- replace increment counters with tilt and energy scale buttons
- add hand-to-review capture with templates and short note
- add break micro-intention capture with templates and editable text
- add latest timeline side list
- add quick note templates and short input
- show current state and derived summary
- show simple contextual Coach message based on current state and timeline
- `Terminar sessão` can point to a placeholder review route only after the post-session review discovery/spec exists

Do not implement post-session review until its Product Discovery Workflow is complete.
