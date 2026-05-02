# Poker Sessions UI Implementation Spec

## 1. Section Objective

Create the MVP poker session flow as a focused execution surface for professional online poker tournament players.

The section should let the player start a session with intention, capture low-friction signals during play, finish with a short review, and feed planning, review, study backlog, and Coach AI context.

This must not become a poker tracker, casino product, hand-history tool, solver, financial dashboard, or technical poker analysis surface.

Product sequence context:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Study log -> Poker sessions -> Reviews -> Coach AI mock`

## 2. Desktop Layout

Use the standard app shell:

- Left sidebar navigation.
- Highlighted global session CTA below the logo.
- Main content area.
- Dedicated full-width active-session surface when a session is running.

### Sessions Page

Purpose:

Start, resume, finish/review, and revisit sessions.

Layout:

1. Page header
   - Eyebrow: `Histórico`
   - Title: `Sessões`
   - Subtitle: `Cada sessão alimenta o Coach com contexto real.`
   - Primary CTA: `Iniciar sessão`
   - Secondary CTA: `Filtrar`
2. Active/pending area
   - Active session card if there is an active session.
   - Pending review card if a session needs review.
   - This area should appear above history only when relevant.
3. Filters
   - Period/date.
   - Session state.
   - Review pending.
4. Compact history list/table
   - Date.
   - Focus.
   - Tournaments.
   - Duration.
   - Decision quality.
   - Tilt peak.
   - Hands to review.
   - State/review status.
   - Row action to open detail.

Avoid:

- Calendar-first layout.
- Financial summaries.
- Dense analytics.
- Tournament-by-tournament detail.

### Active Session Page

Purpose:

Support focused capture during play without creating cognitive load.

Layout:

1. Focus banner
   - Weekly focus.
   - Session focus.
   - Timer/status.
   - Linked Grind block, if present.
   - Current micro-intention, if present.
2. Current state strip
   - Energy.
   - Focus.
   - Tilt.
   - Tables.
   - Hands to review.
   - Last check-up.
3. Quick capture grid
   - `Check-up rápido`
   - `Mão para rever`
   - `Nota rápida`
   - `Micro-intenção`
4. Compact timeline
   - Latest 3-5 events only.
5. Passive Coach observation
   - Short, read-only observation.
   - No full chat during active play.
6. Primary CTA
   - `Terminar sessão`

Visual direction:

- Active session can feel more focused/distinctive than normal pages, but still calm.
- Weekly/session focus should be more prominent than metrics.
- Quick capture controls should be large enough for fast use.
- Timeline should support context, not dominate the screen.

## 3. Mobile Layout

Mobile should support fast actions, not long analysis during breaks.

### Sessions Page Mobile

Recommended order:

1. Top bar: `Sessões`
2. Active/pending card if relevant.
3. Primary CTA: `Iniciar sessão`
4. Compact filters.
5. Session history as stacked rows.

History rows should show:

- Date.
- Focus.
- Status.
- Decision quality.
- Tilt peak.
- Hands to review count, if any.

### Active Session Mobile

Recommended order:

1. Session focus and timer.
2. Current micro-intention.
3. Quick capture actions.
4. Current state strip in compact grid.
5. `Terminar sessão`.
6. Latest 3 events.

Mobile rules:

- Prioritize `Check-up rápido`, `Mão para rever`, and `Terminar sessão`.
- Avoid long text inputs as the main mobile interaction.
- Do not encourage full Coach chat during active play.
- Keep review modal/drawer short and scroll-safe.

## 4. Required Components

- Global session CTA state in app shell.
- Sessions page header.
- Start session CTA.
- Active session card.
- Pending review card.
- Session filters.
- Session history table/list.
- Start session drawer/modal.
- Active session focused page.
- Focus banner.
- Current state strip.
- Quick capture action grid.
- Check-up modal/drawer.
- Hand-to-review modal/drawer.
- Quick note modal/drawer.
- Micro-intention modal/drawer.
- Compact timeline.
- Passive Coach observation card.
- Finish session CTA.
- End session review modal/drawer.
- Save draft action.
- Confirm review action.
- Empty state for no sessions.
- Warning state when another session already exists today.
- Loading/error/success states for session actions.

Implementation should reuse existing app UI primitives and visual tokens. Do not copy prototype code directly from the design handoff.

## 5. Buttons And CTAs

Global session CTA states:

- `Iniciar sessão`
- `Sessão ativa`
- `Terminar e rever`

Sessions page:

- Primary: `Iniciar sessão`
- Secondary: `Filtrar`
- Row action: `Abrir`

Start session:

- Primary: `Iniciar sessão`
- Secondary: `Cancelar`

Active session:

- `Check-up rápido`
- `Mão para rever`
- `Nota rápida`
- `Micro-intenção`
- Primary: `Terminar sessão`
- Optional secondary: `Pausa`

End review:

- Primary: `Confirmar review`
- Secondary: `Guardar rascunho`
- Secondary: `Cancelar`

Avoid CTAs:

- `Analisar mão`
- `Ver linha ótima`
- `Gerar range`
- `Dashboard financeiro`
- `Adicionar torneio detalhado`

## 6. Main States

### No Sessions

Show a compact empty state.

Suggested copy:

- `Ainda não tens sessões registadas.`
- `Inicia a próxima sessão para capturar foco, energia e sinais úteis para revisão.`
- CTA: `Iniciar sessão`

### No Active Session

Sessions page shows history and `Iniciar sessão`.

Global CTA shows:

- `Iniciar sessão`

### Active Session

Global CTA shows:

- `Sessão ativa`

Sessions page shows:

- Active session card with focus, start time, duration, linked block, and CTA to return.

Active session page shows:

- Focus banner.
- State strip.
- Quick capture.
- Latest timeline.
- Passive Coach observation.
- `Terminar sessão`.

### Review Pending

Global CTA shows:

- `Terminar e rever`

Sessions page shows:

- Pending review card above history.
- History row status: `Review pendente`.

### Reviewed Session

History row status:

- `Revista`

Session detail may show summary, captured events, and review output.

### More Than One Session Today

Starting a second completed/standalone session on the same day should show a light warning, not a hard block.

Suggested copy:

- `Já existe uma sessão registada hoje. Queres iniciar outra?`
- Primary: `Iniciar outra sessão`
- Secondary: `Cancelar`

## 7. Suggested pt-PT Copy

Navigation:

- `Sessões`

Global CTA:

- `Iniciar sessão`
- `Sessão ativa`
- `Terminar e rever`

Sessions page:

- Title: `Sessões`
- Subtitle: `Cada sessão alimenta o Coach com contexto real.`
- `Histórico`
- `Filtrar`
- `Review pendente`
- `Revista`
- `Em curso`

Start session:

- Title: `Iniciar sessão`
- `Foco da sessão`
- Placeholder: `Ex.: Disciplina em ICM até bolha`
- `Bloco de grind (opcional)`
- `Energia inicial`
- `Foco inicial`
- `Tilt inicial`
- `Micro-intenção inicial`
- `Máximo de mesas`
- `Regra de qualidade`
- CTA: `Iniciar sessão`

Micro-intention templates:

- `Mais calma`
- `Menos mesas`
- `ICM consciente`
- `Sem autopilot`
- `Decisões mais lentas`
- `Proteger energia`

Active session:

- `Foco da semana`
- `Foco da sessão`
- `Micro-intenção atual`
- `Em curso`
- `Energia`
- `Foco`
- `Tilt`
- `Mesas`
- `Mãos a rever`
- `Último check-up`
- `Captura rápida`
- `Linha do tempo`
- `Observação do Coach`
- `Passivo`
- `Terminar sessão`

Quick capture:

- `Check-up rápido`
- `Energia · Foco · Tilt · mesas`
- `Mão para rever`
- `Marca a mão e adiciona contexto`
- `Nota rápida`
- `Autopilot · Tilt · Distração`
- `Micro-intenção`
- `Foco para a próxima hora`

Hand templates:

- `ICM`
- `Big pot`
- `Bluff catch`
- `All-in marginal`
- `River difícil`
- `Exploit/read`
- `Erro emocional`

Quick note templates:

- `Autopilot`
- `Cansaço`
- `Tilt`
- `Distração`
- `Mesa extra`
- `Boa decisão`
- `Dúvida técnica`

End review:

- Title: `Terminar e rever sessão`
- `Torneios jogados`
- `Duração`
- `Resumo automático`
- `Qualidade de decisão`
- `Energia final`
- `Foco final`
- `Tilt final`
- `Boa decisão`
- `Principal leak/problema`
- `Próxima ação`
- `Resultado financeiro · opcional`
- `Incluir resultado financeiro no contexto do Coach`
- `Mãos prioritárias para rever`
- Primary: `Confirmar review`
- Secondary: `Guardar rascunho`

Financial permission helper:

- `Os dados financeiros nunca aparecem em painéis nem em gráficos.`

## 8. Data The UI Needs

Session core:

- `id`
- `userId`
- `status`: `draft | active | reviewPending | reviewed | archived`
- `startedAt`
- `endedAt`
- `durationMinutes`
- `sessionFocus`
- `weeklyPlanBlockId`
- `weeklyFocusSnapshot`
- `maxTables`
- `qualityRule`
- `createdAt`
- `updatedAt`

Initial setup:

- `initialEnergy`
- `initialFocus`
- `initialTilt`
- `initialMicroIntention`

Active state:

- Current/last energy.
- Current/last focus.
- Current/last tilt.
- Current table count.
- Hands-to-review count.
- Last check-up timestamp.
- Current micro-intention.
- Latest 3-5 timeline events.

Check-ups:

- `sessionId`
- `createdAt`
- `energy`
- `focus`
- `tilt`
- `tableCount`
- `microIntention`

Hands to review:

- `sessionId`
- `createdAt`
- `template`
- `note`
- `priority`
- `selectedForReview`

Quick notes:

- `sessionId`
- `createdAt`
- `template`
- `note`

Micro-intentions:

- `sessionId`
- `createdAt`
- `text`
- `source`: `start | checkup | manual`

End review:

- `tournamentsPlayed`
- `decisionQuality`
- `finalEnergy`
- `finalFocus`
- `finalTilt`
- `autoSummary`
- `goodDecision`
- `mainLeak`
- `nextAction`
- `priorityHandIds`
- `financialCurrency`
- `financialNetAmount`
- `includeFinancialResultInCoach`

History row:

- Date.
- Focus.
- Tournaments.
- Duration.
- Decision quality.
- Tilt peak.
- Hands to review count.
- Review status.

Linked Grind block display:

- Block title.
- Block target.
- Block day/date.
- Block status.

## 9. Expected Interactions

### Start Session

- Player clicks `Iniciar sessão` from global CTA, Sessions page, Today Grind block, or weekly Grind block.
- Short drawer/modal opens.
- Player enters required `Foco da sessão`.
- Player optionally links a Grind block.
- Player optionally enters energy, focus, tilt, micro-intention, max tables, and quality rule.
- Player confirms `Iniciar sessão`.
- App opens active session page.

Rules:

- Only one active session at a time.
- Starting a second session today shows a warning, not a hard block.
- Missing optional setup data is allowed.

### Active Capture

- Player can log `Check-up rápido`.
- Player can mark `Mão para rever`.
- Player can add `Nota rápida`.
- Player can set/update `Micro-intenção`.
- Timeline updates with latest 3-5 events.
- Coach observation remains passive and non-chat.

Rules:

- No forced break reminders in MVP.
- Capture should be optional and fast.
- Do not interrupt play.

### Finish And Review

- Player clicks `Terminar sessão`.
- Short review opens immediately.
- If check-ups exist, show automatic summary and allow edit/confirmation.
- If no check-ups exist, ask final energy, focus, tilt, and decision quality.
- Player enters required tournaments played and quality/final ratings.
- Player optionally adds financial result and explicit Coach permission.
- Player optionally chooses 1-3 priority hands.
- Player confirms review.
- Session becomes reviewed.
- Outputs feed monthly Grind progress, weekly review context, review/study backlog, and Coach AI context.

### Save Draft

- Player can save the review draft if tired.
- Session becomes review pending.
- Global CTA switches to `Terminar e rever`.

## 10. Out Of Scope

- Technical poker hand analysis.
- Solver advice.
- Suggested poker lines such as shove/call/fold/bluff/sizing.
- Financial dashboard.
- Financial graphs.
- Tournament-by-tournament tracking.
- Hand history upload/import.
- Casino or gambling-style UI.
- Calendar-first session planning.
- Forced break notifications.
- Full Coach chat during active play.
- Auto-applying Coach suggestions.
- Detailed Coach suggestion history.
- Custom hand templates in the MVP.
- Advanced filters beyond period/state/review pending.

## 11. Implementation Risks

- Sessions overpower planning: keep weekly focus and linked Grind block visible so sessions stay connected to the planning spine.
- Active session becomes too busy: quick capture and finish CTA should dominate; timeline and Coach stay secondary.
- Coach becomes distracting during play: only show passive observations, no open chat.
- Financial result becomes too prominent: keep optional, secondary, hidden from dashboards, and gated by explicit Coach permission.
- Product drifts into hand analysis: use hand marking only for backlog and patterns, not advice.
- Review becomes too long: required fields must stay short and practical.
- Mobile encourages long phone use during breaks: prioritize one-tap capture and defer detailed review.
- Multiple-session handling becomes overbuilt: support warning and continuation, but optimize for one session per day.
- Data model may overfit prototype examples: keep fields aligned with MVP spec, not sample rows.

## 12. Future Visual Smoke Test

When implemented, visually verify:

- Sidebar/global CTA shows the correct state: `Iniciar sessão`, `Sessão ativa`, or `Terminar e rever`.
- Sessions page shows active/pending cards only when relevant.
- History is compact and not calendar-first.
- Starting a session uses a short drawer/modal, not a multi-step flow.
- `Foco da sessão` is required.
- Linking a Grind block is optional.
- Active session page shows weekly focus, session focus, linked block, timer/status, micro-intention, state strip, quick capture, timeline, passive Coach observation, and `Terminar sessão`.
- Timeline shows only latest 3-5 events.
- Mobile active session prioritizes quick capture and finish/review.
- End review opens immediately after `Terminar sessão`.
- If check-ups exist, automatic summary appears.
- If no check-ups exist, final ratings are requested.
- Financial result is optional and secondary.
- Coach financial permission is explicit.
- No dashboard or summary makes financial result prominent.
- Hand marking does not trigger technical poker advice.
- All visible UI copy is Portuguese from Portugal.
