# Today UI Spec

## 1. Objective

Define the future UI implementation for the `Hoje` section.

`Hoje` is the default daily execution screen. Its job is to turn the active weekly plan into a practical day, then keep the player focused on 1 to 3 commitments, relevant session state, compact planning context, and one useful Coach AI insight.

The screen must not become a full dashboard, full weekly board, habit tracker, analytics page, or Coach chat-first surface.

Product sequence context:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Study log -> Poker sessions -> Reviews -> Coach AI mock`

## 2. Desktop Layout

### Shared shell

- Use the existing app shell direction: left sidebar, main content, optional right/context column.
- Primary navigation label: `Hoje`.
- Sidebar global session CTA remains visible and follows session state:
  - `Iniciar sessão`
  - `Sessão ativa`
  - `Terminar e rever`

### State A: No active weekly plan

Layout priority:

1. Header
   - Title: `Hoje`
   - Date and planning-week context.
2. Empty state panel
   - Explain that there is no active plan for the current planning week.
   - Primary CTA: `Criar plano semanal`.
3. Compact context below or right
   - Monthly targets summary if targets exist.
   - Annual direction line if available.
   - Secondary CTA: `Definir objetivos mensais` only if monthly targets are missing.

Do not show `Preparar dia` in this state.

### State B: Active plan, day not prepared

Use a two-column layout:

- Left/main column:
  1. Header with date, planning-week range, and weekly focus.
  2. Primary action band: `Preparar dia`.
  3. Today's planned blocks as compact read-only rows.
  4. Actionable attention items, only when relevant.
- Right/context column:
  1. Session state card or CTA.
  2. Compact planning-week preview.
  3. Compact monthly pace.
  4. Compact annual/monthly alignment note.
  5. Coach AI compact insight.

The planned blocks list is context only. It must not expose the full Weekly plan board.

### State C: Prepare day flow

Recommended desktop pattern: modal or drawer over `Hoje`.

Flow:

1. Optional quick state check:
   - `Sono`
   - `Energia`
   - `Foco`
   - `Stress`
2. Plan choice:
   - `Seguir plano`
   - `Ajustar plano`
   - `Reduzir plano`
3. Commitment selection:
   - Pick or edit 1 to 3 commitments derived from today's planned blocks.
   - Allow one short custom commitment only if it still maps to the day.
4. Confirm:
   - Primary CTA: `Começar dia`.

If the player chooses `Reduzir plano`, show this prompt:

`Qual é o mínimo que ainda torna o dia útil?`

### State D: Execution mode

Use the same two-column structure, but the main column becomes execution-first.

- Left/main column:
  1. Header with day-prepared status and weekly focus.
  2. `Compromissos de hoje` as the dominant section.
  3. Quick actions on each commitment: `Feito`, `Ajustar`, `Não feito`.
  4. Secondary CTA: `Ajustar dia`.
  5. `Blocos planeados` as clearly secondary context.
- Right/context column:
  1. Session state or CTA.
  2. Compact planning-week preview.
  3. Compact monthly pace.
  4. Actionable attention items only.
  5. Coach AI compact insight.
  6. End-of-day CTA: `Fechar dia`.

Important distinction:

- `Compromissos de hoje` are today's selected execution choices.
- `Blocos planeados` are the original weekly-plan blocks.
- Do not merge them into one list.
- Changing a commitment must not delete or overwrite the original planned block.

### State E: Close day

Recommended desktop pattern: small modal or drawer.

Layout:

1. Pending statuses summary.
2. For each pending or changed item:
   - status selector if needed;
   - optional reason picker when `Ajustado` or `Não feito`.
3. Optional short note.
4. Primary CTA: `Fechar dia`.

Do not include a daily quality rating in the MVP.

## 3. Mobile Layout

Mobile should prioritize action over overview density.

### No active weekly plan

- Top bar title: `Hoje`.
- Empty state appears first.
- Primary CTA full width: `Criar plano semanal`.
- Monthly/annual context is collapsed below.

### Active plan, day not prepared

Order:

1. Weekly focus and date.
2. Full-width `Preparar dia` CTA.
3. Session CTA/state if relevant.
4. Today's planned blocks.
5. Collapsible compact context:
   - planning-week preview;
   - monthly pace;
   - annual/monthly note;
   - Coach insight.

### Prepare day flow

- Use a full-screen sheet or bottom sheet.
- Keep controls large enough for quick selection.
- Avoid long forms.
- Confirm button should stay visible at the bottom when possible.

### Execution mode

Order:

1. `Compromissos de hoje`.
2. Commitment quick actions.
3. Session CTA/state.
4. `Fechar dia`.
5. Secondary `Blocos planeados`.
6. Collapsed planning/monthly/Coach context.

Mobile should not show a dense weekly preview by default. Use a compact horizontal strip or collapsible summary.

## 4. Required Components

- Today header
  - date
  - planning-week range
  - weekly focus line
  - day state: not prepared, prepared, closed
- No-plan empty state
- Prepare-day action band
- Prepare-day modal/drawer/sheet
- Plan choice segmented control
- State check inputs
  - simple 1-5 or compact selectors for energy/focus/stress;
  - sleep can be a small qualitative selector or simple input, depending on the future form pattern.
- Commitment picker
- Commitment row
  - kind/category
  - title
  - optional estimate/target
  - status
  - quick actions
- Planned block row
  - block type
  - title
  - optional target
  - status
  - linked session indicator when relevant
- Session state card
- Compact planning-week preview
  - seven days from configured planning-week start;
  - today highlighted;
  - max three chips per day, then `+N`.
- Compact monthly pace card
- Compact annual/monthly context card
- Attention item row
- Coach AI insight card
- Close-day modal/drawer/sheet
- Optional reason picker

## 5. Buttons and CTAs

Primary CTAs by state:

- No weekly plan: `Criar plano semanal`
- Active plan, not prepared: `Preparar dia`
- Prepare day confirmation: `Começar dia`
- Execution mode: commitment actions plus `Fechar dia`
- Active session: `Voltar à sessão`
- Pending review: `Terminar revisão`

Secondary CTAs:

- `Editar plano semanal`
- `Definir objetivos mensais`
- `Ajustar dia`
- `Perguntar ao Coach`
- `Ver sessões`

Commitment quick actions:

- `Feito`
- `Ajustar`
- `Não feito`

Close day CTAs:

- Primary: `Fechar dia`
- Secondary: `Cancelar`

Session CTAs:

- `Iniciar sessão`
- `Sessão ativa`
- `Terminar e rever`
- `Terminar revisão`

## 6. Main States

### No active weekly plan

Use when there is no active weekly plan for the current planning week.

UI behavior:

- Block daily execution.
- Point to weekly planning.
- Show monthly/annual context only as supporting context.
- Do not allow standalone daily habit tracking in MVP.

### Active plan, day not prepared

Use when the active weekly plan exists but no daily commitments have been confirmed for today.

UI behavior:

- Show weekly focus.
- Show today's planned blocks.
- Make `Preparar dia` the dominant action.
- Show session state if there is a Grind block, active session, or pending review.

### Prepare day flow

Use when the player clicks `Preparar dia` or `Ajustar dia`.

UI behavior:

- Convert planned blocks into 1 to 3 commitments.
- Let the player follow, adjust, or reduce the plan.
- Keep state check lightweight and optional when not needed.

### Execution mode with 1-3 commitments

Use after the player confirms the day.

UI behavior:

- Show commitments as the dominant section.
- Allow fast status changes.
- Keep original planned blocks secondary.
- Keep Coach compact and contextual.

### Close day

Use near end of day or when the player clicks `Fechar dia`.

UI behavior:

- Confirm missing statuses.
- Ask optional reasons only for adjusted/not-done items.
- Capture optional note.
- Do not ask for a daily quality rating.

### Active session / pending review

Use session state when relevant:

- Active session: show a prominent but compact `Sessão ativa` card and CTA `Voltar à sessão`.
- Pending review: show `Revisão de sessão pendente` and CTA `Terminar revisão`.
- Grind block available and no active session: show `Iniciar sessão` from the relevant context.

Do not make the whole `Hoje` screen session-first.

### Compact annual/monthly context

Use as right-column or collapsed context.

- Annual direction: one short line only.
- Monthly targets: status plus one short progress value per category.
- Avoid charts, projections, or dense analytics.

### Compact Coach AI insight

Use one insight at a time.

- Keep it specific, practical, and grounded in current context.
- Show simple context used.
- CTA: `Perguntar ao Coach`.
- Do not open a full chat in the main `Hoje` layout.

## 7. Suggested pt-PT Copy

Navigation:

- `Hoje`
- `Plano semanal`
- `Objetivos mensais`
- `Sessões`
- `Estudo`
- `Revisão`
- `Coach AI`

No active weekly plan:

- `Ainda não tens um plano para esta semana de planeamento.`
- `Cria o plano semanal antes de preparar o dia.`
- `Criar plano semanal`
- `Definir objetivos mensais`

Active plan, not prepared:

- `Foco da semana`
- `Transforma os blocos de hoje em 1 a 3 compromissos práticos.`
- `Preparar dia`
- `Blocos planeados`
- `Contexto da semana`

Prepare day:

- `Preparar dia`
- `Como estás hoje?`
- `Seguir plano`
- `Ajustar plano`
- `Reduzir plano`
- `Qual é o mínimo que ainda torna o dia útil?`
- `Escolhe 1 a 3 compromissos para hoje.`
- `Começar dia`

Execution:

- `Compromissos de hoje`
- `Escolhidos para execução hoje.`
- `Feito`
- `Ajustar`
- `Não feito`
- `Ajustar dia`
- `Fechar dia`
- `Blocos planeados`

Close day:

- `Fechar dia`
- `Confirma o que ficou pendente.`
- `Motivo opcional`
- `Nota curta opcional`
- `Guardar e fechar dia`

Reasons:

- `Energia baixa`
- `Falta de tempo`
- `Tilt/stress`
- `Imprevisto`
- `Plano irrealista`
- `Prioridade mudou`
- `Sem motivo claro`

Session:

- `Iniciar sessão`
- `Sessão ativa`
- `Voltar à sessão`
- `Revisão de sessão pendente`
- `Terminar revisão`
- `Terminar e rever`

Coach:

- `Insight do Coach`
- `Contexto usado`
- `Perguntar ao Coach`
- Example insight: `Tens uma revisão de sessão pendente e o estudo está abaixo do ritmo. Antes da próxima sessão, considera fechar a revisão ou reduzir o plano de hoje.`

Annual/monthly:

- `Direção anual`
- `Este mês deve aproximar-te de`
- `Ritmo mensal`
- `No ritmo`
- `Abaixo do ritmo`
- `Sem objetivo definido`

## 8. Data Needed by the UI

Current date and planning context:

- current date
- configured planning-week start day
- current planning-week range
- today day index in planning week

Annual direction:

- primary direction
- priorities, optional for compact context

Monthly targets:

- category
- target value
- current progress
- unit
- pace status

Weekly plan:

- active weekly plan id
- status
- planning-week range
- weekly focus/intention
- today's planned blocks
- all week blocks for compact preview only
- next week draft flag, if any

Weekly plan blocks:

- id
- day
- type
- title
- optional target unit/value
- optional study type
- status
- optional reason
- linked session id, if any

Daily execution:

- day preparation status
- optional state check values
- plan choice: follow, adjust, reduce
- commitments
- commitment status
- commitment optional reason
- close-day note
- closed-at timestamp

Sessions:

- active session status
- pending review status
- linked Grind block id
- session focus
- started-at timestamp
- hands-to-review count
- pending review id

Coach AI mock/context:

- compact insight text
- context-used label
- suggested action/CTA
- no technical hand-analysis content

## 9. Expected Interactions

- Clicking `Criar plano semanal` navigates to the Weekly plan creation flow.
- Clicking `Preparar dia` opens the prepare-day flow.
- Selecting `Seguir plano`, `Ajustar plano`, or `Reduzir plano` changes commitment suggestions, but never mutates weekly blocks directly.
- Confirming prepare day creates 1 to 3 daily commitments and enters execution mode.
- `Feito`, `Ajustar`, and `Não feito` update commitment status immediately.
- Choosing `Ajustar` or `Não feito` should offer an optional reason picker.
- `Ajustar dia` reopens the prepare-day flow with existing commitments prefilled.
- `Fechar dia` opens close-day flow and asks only for unresolved statuses/reasons/note.
- Starting a session from `Hoje` should link to a Grind block when the user started from that block/context.
- Active session CTA routes to the active session surface.
- Pending review CTA routes to the session review flow.
- `Perguntar ao Coach` opens the contextual Coach drawer or Coach page with Today context.
- Coach suggestions must not auto-apply changes.

## 10. Out of Scope

- Full Weekly plan board inside `Hoje`.
- Drag-and-drop planning.
- Fixed-time calendar.
- Standalone habit tracker when no weekly plan exists.
- Daily quality rating.
- Dense analytics, forecasts, or financial dashboards.
- Poker hand technical analysis.
- Coach-generated automatic plan changes.
- Multiple template choices.
- Advanced Coach suggestion history.
- Notifications or forced break reminders.
- Financial result display on `Hoje`.

## 11. Implementation Risks

- `Hoje` becomes too dense if weekly preview, monthly pace, session state, attention items, and Coach insight all compete visually.
- Commitments and planned blocks may be accidentally merged, which would break the planning/review model.
- `Preparar dia` may become a long check-in form instead of a fast execution bridge.
- Session state may overpower daily execution if the session card becomes the dominant area.
- Coach AI may feel like the main product if the insight card expands into chat by default.
- Monthly pace can drift into analytics; keep it to status plus one short progress number.
- Mobile can become too tall if all compact context is expanded by default.
- Reason capture can feel punitive if required; keep it optional.

## 12. Future Visual Smoke Test

Run after implementation:

1. Desktop, no active weekly plan:
   - `Hoje` shows no-plan empty state.
   - `Preparar dia` is not visible.
   - `Criar plano semanal` is the primary CTA.
2. Desktop, active plan, day not prepared:
   - `Preparar dia` is visually dominant.
   - Today's planned blocks are visible as read-only context.
   - Weekly focus, monthly pace, annual context, session state, and Coach insight are compact.
   - No full Weekly plan board appears.
3. Desktop, prepare-day flow:
   - User can choose follow/adjust/reduce.
   - User can confirm 1 to 3 commitments.
   - `Reduzir plano` shows `Qual é o mínimo que ainda torna o dia útil?`
4. Desktop, execution mode:
   - `Compromissos de hoje` is the dominant section.
   - `Blocos planeados` remains secondary and visually separate.
   - Each commitment has `Feito`, `Ajustar`, `Não feito`.
   - `Fechar dia` is available.
5. Desktop, session states:
   - Active session shows `Sessão ativa` / `Voltar à sessão`.
   - Pending review shows `Revisão de sessão pendente` / `Terminar revisão`.
   - The page remains execution-first.
6. Mobile:
   - Primary CTA or commitments appear before compact context.
   - Weekly/monthly/Coach context is collapsed or clearly secondary.
   - No text overlaps in commitment rows or CTAs.
7. Dark mode:
   - Sidebar logo uses the white variant.
   - Teal remains the primary action accent.
   - Status pills remain readable.
