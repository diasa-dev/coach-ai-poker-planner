# Live Session Feature Spec

## Objective

Help the player capture important session events with minimal attention cost while protecting the plan created in session preparation.

The live session screen should be a one-tap capture surface for online poker tournaments. It should not become a dashboard, tracker, chat, or analysis page.

## Product Rationale

During a tournament session, the player's main task is playing poker. The app should support performance without becoming another source of cognitive load.

The live session flow should be designed around:

- low interruption cost
- one-tap event capture
- visible session constraints
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

### 2. Event Capture

Purpose: capture useful signals in one tap.

First version events:

- `Marcar mão`
- `Tilt +1`
- `Energia baixa`
- `Nota rápida`

Out of first version:

- `Break feito`, because online tournament breaks are structural and do not need tracking in MVP.
- detailed hand notes
- financial results
- table-by-table tracking

### 3. Quick Note

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

### 4. Session State

Purpose: show whether the session is drifting from the plan without creating analysis mode.

Always visible:

- marked hands count
- tilt count
- low energy count

Avoid:

- charts
- events per hour
- profit/loss
- hand history import
- dense notes list

### 5. Coach AI Context

Purpose: provide very short regulation prompts when risk signals appear.

The Coach must be contextual and lightweight, not a chat.

Examples:

- `2 sinais de tilt. Volta à regra de qualidade.`
- `Energia baixa registada. Evita abrir mesas extra.`
- `Já marcaste 5 mãos. Chega para review, agora volta ao foco.`

Rules:

- no open chat during live play
- no long explanations
- no dense analysis
- only show guidance when it can reduce risk or restore focus

### 6. Finish Session

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
- markedHandsCount
- tiltCount
- lowEnergyCount
- quickNotes
- startedAt
- endedAt
- updatedAt

### `sessionEvents`

- sessionId
- userId
- type: markedHand | tilt | lowEnergy | quickNote
- template
- note
- createdAt

## UX Principles

- One tap for core events.
- Large controls.
- Minimal text.
- No dashboard layout.
- No analytics during play.
- No Coach chat during play.
- The player should be able to use it without breaking focus.
- Mobile should be viable, but desktop is the main grind context.

## Success Criteria

- Player can capture a core event in one tap.
- Player can add a quick note in under 10 seconds.
- Player can see focus, max tables, and quality rule without searching.
- Player can see marked hands, tilt, and low energy counts at a glance.
- Session finish moves directly into review.

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
- add one-tap event buttons
- add quick note templates and short input
- show counts
- show simple contextual Coach message based on counts
- `Terminar sessão` can point to a placeholder review route only after the post-session review discovery/spec exists

Do not implement post-session review until its Product Discovery Workflow is complete.
