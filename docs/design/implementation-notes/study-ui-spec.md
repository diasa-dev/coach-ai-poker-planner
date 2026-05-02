# Study UI Implementation Spec

## 1. Section Objective

Create a fast MVP study logging surface for poker players.

The Study section should let the player register a study session in under one minute, connect it to the weekly execution loop when relevant, and review recent study volume/quality without becoming a content library, course manager, or analytics dashboard.

Product sequence context:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Study log -> Poker sessions -> Reviews -> Coach AI mock`

## 2. Desktop Layout

Use the standard app shell:

- Left sidebar navigation.
- Highlighted global session CTA remains in the shell, not inside Study.
- Main content area with compact operational density.

Recommended Study page structure:

1. Page header
   - Eyebrow with current day and planning-week context.
   - Title: `Estudo`
   - Short subtitle: `Registo rápido. 60 segundos no máximo.`
   - Primary CTA: `Registar estudo`
2. Two-column content grid
   - Left column: `Novo registo` panel.
   - Right column: weekly/monthly summary followed by recent study sessions.
3. `Novo registo` panel
   - Duration.
   - Study type.
   - Quality 1-5.
   - Optional weekly plan block link.
   - Optional note.
   - Save CTA.
4. Right summary column
   - Lightweight weekly summary.
   - Lightweight monthly summary.
   - Recent sessions list/table.

Desktop hierarchy:

- The logging form is the primary surface.
- Summaries are secondary context.
- Recent sessions should be scannable rows, not large cards.

Visual direction:

- Compact rows, thin dividers, small status pills.
- Study category accent should use the study teal token.
- Avoid hero sections, oversized metric cards, dense charts, and decorative panels.

## 3. Mobile Layout

Mobile should prioritize quick entry.

Recommended order:

1. Top bar with screen title: `Estudo`
2. Primary CTA or inline first panel: `Registar estudo`
3. `Novo registo` form as the first visible surface
4. Collapsed/light summaries
   - `Esta semana`
   - `Este mês`
5. Recent sessions list

Mobile behavior:

- Use a single column.
- Keep form controls thumb-friendly.
- Use a bottom sheet or inline form for `Registar estudo`; choose whichever matches the app pattern at implementation time.
- Avoid showing the weekly/monthly summary above the form unless there is no draft log in progress.
- Recent list can show fewer fields per row, with details on tap.

## 4. Required Components

- Study page header.
- Primary action button.
- Study log form.
- Duration input.
- Study type select.
- Quality rating control from 1 to 5.
- Optional note textarea.
- Optional linked weekly block selector.
- Mark-linked-block-done confirmation.
- Weekly summary block.
- Monthly summary block.
- Recent study sessions list/table.
- Empty state for no study sessions.
- Loading state for form and list.
- Error state for failed save.
- Success/confirmation state after save.

Implementation should reuse existing app UI primitives and visual tokens. Do not copy prototype code directly from the design handoff.

## 5. Buttons And CTAs

Primary:

- `Registar estudo`

Secondary/contextual:

- `Cancelar`
- `Guardar registo`
- `Associar bloco`
- `Não associar`
- `Marcar bloco como feito`
- `Deixar bloco planeado`

Recent list row action, optional:

- `Ver detalhe`

Avoid:

- `Criar curso`
- `Adicionar conteúdo`
- `Gerar recomendação`
- `Criar plano de estudo`
- Any CTA that implies a content library, study curriculum, or automatic coaching recommendation.

## 6. Main States

### Empty State

When there are no study sessions:

- Keep the logging CTA primary.
- Show a simple empty recent list message.
- Do not create a motivational dashboard.

Suggested copy:

- `Ainda não tens registos de estudo.`
- `Regista a próxima sessão para começares a medir tempo e qualidade.`

### Default State

Show:

- New log form.
- Weekly summary.
- Monthly summary.
- Recent sessions.

### Linked Weekly Block State

When the player links a study session to a planned weekly Study block:

- Show the linked block label.
- After save, ask whether the block should be marked as done.
- The answer must be explicit.

If the logged duration reasonably matches the block target, the `Marcar bloco como feito` option may be preselected. If the duration is clearly lower than the block target, do not preselect it.

### Standalone Study State

When no block is linked:

- Save as standalone study.
- Do not show the mark-block-done question.

### Save Success State

After save:

- Add the session to recent list.
- Refresh weekly/monthly summary.
- Clear the form or reset it to useful defaults.
- If a block was linked, show the mark-block-done confirmation before final success messaging.

### Save Error State

Show a compact inline error near the CTA.

Suggested copy:

- `Não foi possível guardar o registo. Tenta novamente.`

## 7. Suggested pt-PT Copy

Page:

- Title: `Estudo`
- Subtitle: `Registo rápido. 60 segundos no máximo.`
- Primary CTA: `Registar estudo`

Form:

- Panel title: `Novo registo`
- `Duração`
- `Tipo de estudo`
- `Qualidade`
- `Bloco semanal (opcional)`
- `Nota (opcional)`
- Placeholder: `O que ficou claro? O que ficou por resolver?`
- CTA: `Guardar registo`

Study types:

- `Drills`
- `Revisão de mãos`
- `Revisão de torneios`
- `Solver`
- `Aula individual`
- `Aula de grupo`
- `Vídeo/curso`
- `Estudo em grupo`
- `Teoria/conceitos`
- `Outro`

Quality:

- `1/5`
- `2/5`
- `3/5`
- `4/5`
- `5/5`

Linked block confirmation:

- Title: `Marcar bloco como feito?`
- Body: `Este registo está associado a um bloco do plano semanal. Queres marcar esse bloco como feito?`
- Primary: `Marcar como feito`
- Secondary: `Deixar planeado`

Summaries:

- `Esta semana`
- `Este mês`
- `Tempo de estudo`
- `Qualidade média`
- `Tipos mais frequentes`
- `Abaixo do ritmo`
- `Dentro do ritmo`
- `Sem meta mensal`

Recent list:

- `Recente`
- `Data`
- `Tipo`
- `Duração`
- `Qualidade`
- `Bloco`
- `Sem bloco`

## 8. Data The UI Needs

Study session fields:

- `id`
- `userId`
- `date`
- `durationMinutes`
- `studyType`
- `quality`
- `note`
- `weeklyPlanBlockId`
- `createdAt`
- `updatedAt`

Linked weekly block display data:

- `weeklyPlanBlockId`
- `dayOfWeek`
- `type`
- `title`
- `targetUnit`
- `targetValue`
- `studyType`
- `status`

Summary data:

- Study minutes logged this planning week.
- Study target for current week if available from linked weekly blocks or monthly pacing.
- Study minutes logged this calendar month.
- Study monthly target if available.
- Average quality for current week.
- Average quality for current month.
- Most common study types for current week/month.

Recent list data:

- Recent study sessions ordered by newest first.
- Date.
- Duration.
- Study type.
- Quality.
- Linked block indicator.

## 9. Expected Interactions

- Player opens Study.
- Player clicks `Registar estudo` or uses the visible `Novo registo` form.
- Player enters duration.
- Player selects one primary study type.
- Player selects quality from 1 to 5.
- Player optionally links a weekly Study block.
- Player optionally adds a note.
- Player saves the log.
- If linked to a weekly block, UI asks whether to mark that block as done.
- If confirmed, update the linked block status to `done`.
- If declined, keep the block status unchanged.
- UI refreshes recent list and lightweight summaries.

Interaction rules:

- One study session has one primary type.
- Linking to a block is optional.
- Marking the block as done is never silent.
- Standalone study is valid.
- Do not require a note.
- Do not ask for advanced tags, content source, course, solver file, or study topic hierarchy.

## 10. Out Of Scope

- Content library.
- Course manager.
- Study curriculum.
- Study recommendations generated automatically.
- Advanced tags.
- Multi-type study sessions.
- Detailed tool tracking.
- Solver/file upload tracking.
- Poker hand analysis.
- Coach-generated technical poker advice.
- Dense analytics dashboard.
- Separate study plan outside the weekly plan.
- Editing the weekly plan from inside Study, except marking a linked block as done after explicit confirmation.

## 11. Implementation Risks

- Study becomes too broad: keep it as a fast log, not a knowledge workspace.
- Weekly block status is updated silently: always ask before marking a linked block as done.
- Linked block logic edits weekly planning behavior too deeply: keep the integration narrow and status-only.
- Summary turns into analytics: keep weekly/monthly summary light and action-oriented.
- Study type options drift from the product spec: use the approved initial list.
- UI copy drifts into Brazilian Portuguese or English: visible UI copy must stay pt-PT.
- Duration matching logic may be over-engineered: use a simple threshold only to decide whether the done option is preselected, not to block the user.
- Mobile layout may bury the logging form below summaries: keep quick logging first.

## 12. Future Visual Smoke Test

When implemented, visually verify:

- Desktop shows `Novo registo` as the primary surface and summaries/list as secondary.
- Mobile opens with quick logging visible before heavy context.
- Study type list contains only the MVP types.
- Quality control clearly supports 1 to 5.
- Optional note is visibly optional.
- Linked weekly block selector is optional and does not require weekly-plan editing.
- Saving a linked study session asks `Marcar bloco como feito?`
- Choosing `Marcar como feito` updates only that linked block status.
- Choosing `Deixar planeado` keeps the block unchanged.
- Recent list updates after save.
- Weekly and monthly summaries update without dense charts.
- Empty state points to `Registar estudo`.
- No UI includes content library, courses, advanced tags, or automatic recommendations.
- All visible UI copy is Portuguese from Portugal.
