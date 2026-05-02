# Review UI Implementation Spec

## 1. Section Objective

Create the MVP `Revisão` section as a light weekly reflection surface that closes the loop between plan and execution.

The section should help the player understand what happened during the planning week, reflect on wins and leaks, capture missed/adjusted reasons, and define one practical adjustment for the next week before seeing a Coach suggestion.

Product sequence context:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Study log -> Poker sessions -> Reviews -> Coach AI mock`

The review must be recommended, not mandatory. The player can skip the weekly review and still create or continue the next weekly plan.

Evidence-informed product direction:

- Use short feedback loops: compare plan vs execution, then adjust the next plan.
- Reflection should identify patterns and next actions, not create guilt.
- Ratings are useful as simple self-assessment signals, but should not become a heavy analytics report.
- Coach suggestion appears after player reflection so the player stays the author of the review and plan.

## 2. Desktop Layout

Use the standard app shell:

- Left sidebar navigation.
- Highlighted global session CTA remains in the shell.
- Primary navigation label: `Revisão`.
- Main content area with a calm reflective layout.

Recommended desktop structure:

1. Page header
   - Eyebrow with current planning-week range.
   - Title: `Revisão`.
   - Subtitle: `Recomendada, não obrigatória. Fecha a semana sem bloquear a próxima.`
   - Primary CTA by state:
     - `Fazer revisão semanal` when review is available.
     - `Continuar revisão` when draft exists.
     - `Ver resumo` when already reviewed.
   - Secondary CTA: `Preparar próxima semana`.
2. Pending session reviews context
   - Separate compact section above or beside the weekly review.
   - Shows pending poker session reviews as context only.
   - CTA per pending item: `Terminar review da sessão`.
   - Must not merge pending session review fields into the weekly review form.
3. Plan vs execution summary
   - Compact comparison by category:
     - Grind
     - Estudo
     - Review
     - Sport
   - Show planned vs done/adjusted/not done.
   - Include missed/adjusted reasons summary when available.
4. Weekly review form
   - Ratings 1-5.
   - Wins.
   - Leaks/problems.
   - Missed/adjusted reasons.
   - Adjustment for next week.
5. Coach suggestion area
   - Locked/placeholder until the reflection fields are completed.
   - After completion, show one short suggestion for next week.
   - Suggestion is advisory and can open an editable proposal later.
6. Final actions
   - `Guardar revisão`
   - `Guardar rascunho`
   - `Preparar próxima semana`
   - `Rever com Coach`

Desktop hierarchy:

- Weekly review is the main surface.
- Pending session reviews are visible but clearly separate.
- Plan vs execution summary supports reflection; it is not a full analytics dashboard.
- Coach suggestion comes after reflection, not before.

Visual direction:

- Use calmer spacing than operational screens, but keep the page scannable.
- Prefer compact rows, thin dividers, low-noise status pills, and restrained category accents.
- Avoid large metric-card walls, charts, guilt-heavy warnings, and dashboard-style analytics.

## 3. Mobile Layout

Mobile should support a short review that can be completed without feeling like a report.

Recommended mobile order:

1. Top bar
   - Screen title: `Revisão`.
   - Planning-week range.
2. Review state card
   - Primary CTA: `Fazer revisão semanal`, `Continuar revisão`, or `Ver resumo`.
   - Secondary CTA: `Saltar por agora`.
3. Pending session reviews context
   - Collapsed by default if there are multiple pending sessions.
   - Each row shows date, focus, and `Terminar review`.
4. Plan vs execution summary
   - Four stacked category rows.
   - Keep details expandable.
5. Ratings
   - Four 1-5 controls.
6. Reflection fields
   - Wins.
   - Leaks/problems.
   - Missed/adjusted reasons.
   - Adjustment for next week.
7. Coach suggestion
   - Appears only after the reflection is saved or marked complete.
8. Sticky bottom action when editing
   - `Guardar revisão`
   - Secondary: `Guardar rascunho`

Mobile rules:

- Single column only.
- Keep text areas short and scroll-safe.
- Do not show dense tables.
- Do not place Coach suggestion above player reflection.
- Do not make pending session reviews feel required before the weekly review.

## 4. Required Components

- Review page header.
- Weekly review state card.
- Pending session reviews context section.
- Pending session review row/card.
- Plan vs execution summary.
- Category comparison row for Grind, Estudo, Review, Sport.
- Status breakdown for planned/done/adjusted/not done.
- Missed/adjusted reasons summary.
- Rating control from 1 to 5.
- Reflection form.
- Wins textarea.
- Leaks/problems textarea.
- Missed/adjusted reasons selector or textarea.
- Next-week adjustment textarea.
- Coach suggestion placeholder.
- Coach suggestion card.
- Coach context-used indicator.
- Review action footer.
- Empty state for no active/previous weekly plan.
- Already-reviewed summary state.
- Skipped review state.
- Loading state.
- Saving state.
- Save error state.

Implementation should reuse existing app UI primitives and visual tokens. Do not copy prototype source code directly from the design handoff.

## 5. Buttons And CTAs

Primary CTAs:

- `Fazer revisão semanal`
- `Continuar revisão`
- `Guardar revisão`
- `Preparar próxima semana`

Secondary/contextual CTAs:

- `Guardar rascunho`
- `Saltar por agora`
- `Ver resumo`
- `Rever com Coach`
- `Terminar review da sessão`
- `Ver sessões pendentes`
- `Editar reflexão`

Coach suggestion CTAs:

- `Ver proposta`
- `Ignorar`
- `Perguntar ao Coach`

CTA rules:

- `Saltar por agora` must not block next-week planning.
- `Preparar próxima semana` can appear before review completion, but should communicate that review context will be weaker if skipped.
- `Terminar review da sessão` navigates to the session review flow; it does not open weekly review fields.
- Coach actions must not auto-apply changes to the weekly plan.

Avoid CTAs:

- `Gerar relatório`
- `Ver analytics`
- `Aplicar automaticamente`
- `Corrigir plano automaticamente`
- `Analisar mãos`
- `Dashboard financeiro`
- Any CTA implying mandatory review, dense analytics, technical poker hand advice, or automatic Coach edits.

## 6. Main States

### No Weekly Plan Context

When there is no active or previous weekly plan to review:

- Show a compact empty state.
- Primary CTA should point back to weekly planning.
- Do not create a standalone journaling flow disconnected from the planning spine.

Suggested copy:

- `Ainda não há uma semana para rever.`
- `Cria um plano semanal para poderes comparar plano e execução no fim da semana.`
- CTA: `Criar plano semanal`

### Review Available

When the planning week has execution data and no review yet:

- Show `Fazer revisão semanal` as the primary action.
- Show plan vs execution summary.
- Show pending session reviews as separate context if any exist.
- Make it clear the review is recommended, not required.

Suggested copy:

- `A revisão ajuda a preparar a próxima semana, mas não bloqueia o plano.`

### Draft Review

When the player has started but not saved the weekly review:

- Primary CTA: `Continuar revisão`.
- Preserve entered ratings and reflection text.
- Coach suggestion should remain hidden until reflection is completed.

### Already Reviewed

When the week is reviewed:

- Show read-only summary first.
- Allow `Editar reflexão` if the MVP implementation supports editing; otherwise omit it.
- Show Coach suggestion if it was generated.
- Keep `Preparar próxima semana` available.

### Skipped Review

When the player chooses `Saltar por agora`:

- Mark review as skipped or leave it unreviewed according to future data model decision.
- Allow next-week planning immediately.
- Keep a soft option to return later.

Suggested copy:

- `Podes voltar a esta revisão mais tarde.`

### Pending Session Reviews Present

When one or more poker sessions have `reviewPending` status:

- Show a separate section: `Reviews de sessão pendentes`.
- Keep it contextual, not blocking.
- Each row should show date, focus, duration or tournaments if available, and CTA.
- Weekly review can still be completed without finishing all session reviews.

Suggested copy:

- `Há sessões por fechar. Podem melhorar o contexto da revisão semanal, mas não são obrigatórias agora.`

### Coach Suggestion Locked

Before the player completes reflection:

- Show a subdued placeholder.
- Explain that Coach suggestion appears after the player's reflection.
- Do not show the suggestion from auto-summary alone.

Suggested copy:

- `Conclui a tua reflexão primeiro. O Coach responde depois com base no que escreveste.`

### Coach Suggestion Available

After ratings and reflection are completed:

- Show one short Coach suggestion for the next week.
- Show context used.
- Provide `Ver proposta`, `Ignorar`, and `Perguntar ao Coach`.
- Do not auto-apply the suggestion.

### Save Error

Show compact inline error near the action footer.

Suggested copy:

- `Não foi possível guardar a revisão. Tenta novamente.`

## 7. Suggested pt-PT Copy

Navigation:

- `Revisão`

Page:

- Title: `Revisão`
- Subtitle: `Recomendada, não obrigatória. Fecha a semana sem bloquear a próxima.`
- `Semana de planeamento`
- `Fazer revisão semanal`
- `Continuar revisão`
- `Guardar revisão`
- `Guardar rascunho`
- `Saltar por agora`
- `Preparar próxima semana`

Pending session reviews:

- `Reviews de sessão pendentes`
- `Review pendente`
- `Terminar review da sessão`
- `Há sessões por fechar. Podem melhorar o contexto da revisão semanal, mas não são obrigatórias agora.`

Plan vs execution:

- `Plano vs execução`
- `Planeado`
- `Feito`
- `Ajustado`
- `Não feito`
- `Motivos principais`
- `Sem motivos registados`

Categories:

- `Grind`
- `Estudo`
- `Review`
- `Sport`

Ratings:

- `Execução`
- `Energia`
- `Foco`
- `Qualidade`
- `1/5`
- `2/5`
- `3/5`
- `4/5`
- `5/5`

Reflection:

- `A tua reflexão`
- `Principais wins`
- `Principais leaks/problemas`
- `Motivos para blocos falhados ou ajustados`
- `Ajuste para a próxima semana`
- Placeholder wins: `O que correu bem e queres repetir?`
- Placeholder leaks: `Que padrão te custou mais esta semana?`
- Placeholder reasons: `Ex.: pouca energia, plano irrealista, tilt/stress, imprevisto.`
- Placeholder adjustment: `Que mudança concreta torna a próxima semana mais realista?`
- `Concluir reflexão`

Reason options:

- `Pouca energia`
- `Falta de tempo`
- `Tilt/stress`
- `Imprevisto`
- `Plano irrealista`
- `Prioridade mudou`
- `Sem motivo claro`

Coach:

- `Sugestão do Coach`
- `Aparece depois da tua reflexão`
- `Contexto usado`
- `Ver proposta`
- `Ignorar`
- `Perguntar ao Coach`
- `Conclui a tua reflexão primeiro. O Coach responde depois com base no que escreveste.`

Empty/reviewed states:

- `Ainda não há uma semana para rever.`
- `Cria um plano semanal para poderes comparar plano e execução no fim da semana.`
- `Revisão guardada.`
- `Podes voltar a esta revisão mais tarde.`

## 8. Data The UI Needs

Weekly review core:

- `id`
- `userId`
- `weeklyPlanId`
- `status`: `notStarted | draft | completed | skipped`
- `executionRating`
- `energyRating`
- `focusRating`
- `qualityRating`
- `wins`
- `leaks`
- `missedReasons`
- `nextWeekAdjustment`
- `coachSuggestion`
- `createdAt`
- `updatedAt`
- `completedAt`
- `skippedAt`

Weekly plan context:

- `weeklyPlanId`
- `weekStartDate`
- `weekEndDate`
- `planningWeekLabel`
- `weeklyFocus`
- `weeklyPlanStatus`
- `nextWeekDraftExists`

Plan vs execution summary:

- Category totals for Grind, Study, Review, Sport.
- Planned target per category.
- Done total per category.
- Adjusted total per category.
- Not-done total per category.
- Optional unit per category, such as sessions, hours, minutes, hands, blocks, or tournaments.
- Progress/status label per category.

Block-level context for expandable detail:

- `weeklyPlanBlockId`
- `dayOfWeek`
- `date`
- `type`
- `title`
- `targetUnit`
- `targetValue`
- `status`: `planned | done | adjusted | notDone`
- `statusReason`
- `note`
- Linked session or study indicator when relevant.

Pending session reviews:

- `sessionId`
- `date`
- `sessionFocus`
- `status`: `reviewPending`
- `durationMinutes`
- `tournamentsPlayed`
- `linkedWeeklyPlanBlockId`
- `handsToReviewCount`
- `lastUpdatedAt`

Session review context already completed during the week:

- Number of reviewed sessions.
- Average decision quality if available.
- Average/final energy and focus if available.
- Tilt peak or average if available.
- Hands to review count.
- Session main leaks/problems when available.

Coach suggestion display:

- Suggestion text.
- Context used label, for example `plano semanal + execução + sessões revistas`.
- Optional proposal preview.
- Suggestion state: `hidden | available | ignored | proposalOpened`.

## 9. Expected Interactions

### Open Review

- Player opens `Revisão`.
- UI loads the current or most recently completed planning week.
- If no weekly plan exists, show no-plan empty state.
- If review exists, show summary.
- If review is available or draft, show weekly review flow.

### Review Weekly Execution

- Player reads plan vs execution summary.
- Player can expand category rows to inspect done, adjusted, and not-done blocks.
- Player can see missed/adjusted reasons already captured from daily execution.
- Player can add or edit the main missed/adjusted reasons in the weekly review.

Rules:

- Do not require every block to be individually explained again.
- Do not make the summary chart-heavy.
- Do not edit the Weekly plan from this screen.

### Complete Reflection

- Player sets ratings from 1 to 5:
  - execution;
  - energy;
  - focus;
  - quality.
- Player enters wins.
- Player enters leaks/problems.
- Player confirms or enters missed/adjusted reasons.
- Player writes one adjustment for next week.
- Player saves the review.

Rules:

- Notes should be useful but not required to be long.
- Coach suggestion should remain hidden until reflection is completed.
- Review can be saved as draft.

### Handle Pending Session Reviews

- Pending session reviews appear in a separate context section.
- Player may click `Terminar review da sessão`.
- UI navigates to the session review flow.
- Returning to Review refreshes the context.

Rules:

- Pending session reviews do not block weekly review.
- Weekly review does not replace session review.
- Session details feed weekly review context only after available.

### Skip Review

- Player clicks `Saltar por agora`.
- UI confirms or records the skipped state.
- Player can continue to `Preparar próxima semana`.

Rules:

- Skipping must not create guilt-heavy copy.
- Skipping must not block next-week planning.
- The review can remain available later if the data model supports it.

### Coach Suggestion

- After reflection is completed, UI requests or shows one Coach suggestion.
- Suggestion uses weekly plan execution, ratings, reflection, and available session/study context.
- Player can ignore it, ask Coach, or open an editable proposal.

Rules:

- No suggestion is auto-applied.
- The Coach must not provide technical poker hand advice.
- The Coach should suggest next-week planning adjustments, not create a report.

## 10. Out Of Scope

- Mandatory weekly review.
- Blocking next-week planning until review is complete.
- Heavy analytics report.
- Dense charts, trend dashboards, or long historical analysis.
- Financial poker dashboards or result-first review.
- Technical poker hand analysis.
- Solver advice or poker-line recommendations.
- Editing the Weekly plan directly from Review.
- Auto-applying Coach suggestions.
- Coach-generated weekly plan as the default.
- Full Coach suggestion history center.
- Daily journaling as a separate product surface.
- Requiring all pending session reviews before weekly review.
- Long mandatory text prompts.
- Calendar-first review UI.

## 11. Implementation Risks

- Review becomes mandatory by implication: keep `Saltar por agora` and `Preparar próxima semana` available.
- Pending session reviews get mixed into weekly review: keep them as a separate context section and route to the session flow.
- Plan vs execution becomes analytics-heavy: show category totals and expandable details only.
- Ratings become punitive: frame ratings as self-assessment, not grades.
- Reflection becomes too long: keep prompts short and allow concise answers.
- Coach appears too early: lock suggestion until player reflection is completed.
- Coach mutates plans silently: all suggestions must go through an editable proposal/confirmation flow.
- Product drifts into poker hand analysis: session review context can mention hands-to-review counts, never hand advice.
- Weekly plan slice coupling gets too deep: Review can read weekly plan data, but should not edit weekly plan blocks except through future approved proposal flows.
- UI copy drifts into Brazilian Portuguese or English: all visible user copy must stay pt-PT.
- Mobile becomes a long form: keep sections collapsible and actions sticky.

## 12. Future Visual Smoke Test

When implemented, visually verify:

- `Revisão` appears as the active navigation item.
- Page header communicates that weekly review is recommended, not mandatory.
- `Saltar por agora` and `Preparar próxima semana` are available without completing review.
- Pending session reviews appear in a separate section from weekly review.
- Pending session review CTA routes to session review, not the weekly review form.
- Plan vs execution summary shows Grind, Estudo, Review, and Sport.
- Summary shows planned vs done/adjusted/not done without dense charts.
- Ratings clearly support 1 to 5 for execution, energy, focus, and quality.
- Reflection includes wins, leaks/problems, missed/adjusted reasons, and adjustment for next week.
- Coach suggestion placeholder appears before reflection completion.
- Coach suggestion appears only after reflection is completed or saved.
- Coach suggestion includes context used.
- Coach suggestion does not auto-apply changes.
- No UI suggests technical hand analysis, solver advice, financial dashboards, or mandatory reports.
- Mobile keeps pending sessions, summary, ratings, reflection, and Coach suggestion in a readable single-column flow.
- All visible UI copy is Portuguese from Portugal.
