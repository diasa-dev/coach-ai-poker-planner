# Monthly Targets UI Implementation Spec

## 1. Section Objective

Create the MVP pacing surface between Annual direction and Weekly plan.

Monthly targets should help a professional online poker player translate the annual direction into a simple calendar-month target set across four categories:

- Grind
- Study
- Review
- Sport

The section answers:

- Is this month aligned with the annual direction?
- What should this month move forward?
- What targets should guide the weekly plan?
- Is the current month broadly on pace without turning the app into analytics?

Product sequence:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Study log -> Poker sessions -> Reviews -> Coach AI mock`

This screen must stay focused on planning decisions. It must not become a financial tracker, dense analytics dashboard, calendar, quarterly planning flow, or Coach-generated automation surface.

## 2. Desktop Layout

Use the standard app shell from the design handoff:

- Left sidebar navigation.
- Official EdgePlan logo in the sidebar.
- Highlighted global session CTA below the logo.
- Main content area with compact operational density.
- `Objetivos mensais` active in navigation.

Recommended desktop structure:

1. Page header
   - Eyebrow: current month and calendar progress, for example `Maio · dia 14 de 31`.
   - Title: `Objetivos mensais`.
   - Subtitle: `Define o ritmo do mês para orientar a semana e o dia.`
   - Primary CTA:
     - `Definir objetivos` when no targets exist.
     - `Editar objetivos` when targets exist.

2. Annual direction context strip
   - Compact strip above targets.
   - Shows `Direção anual`.
   - Shows the annual primary direction as the main line.
   - Shows 2 to 4 annual priority chips when available.
   - Shows constraints/non-negotiables only if they affect planning.
   - If missing, show the non-blocking missing Annual direction state.

3. Target category list/table
   - Primary working surface.
   - Four rows only: Grind, Study, Review, Sport.
   - Each row shows category, unit, current progress, target, pace status, and edit action.
   - Use compact rows with thin dividers and restrained category accents.
   - A slim progress bar is allowed, but the text readout must remain primary.

4. Per-category editor
   - Open one category at a time.
   - Desktop can use an inline expanded row, right drawer, or focused panel.
   - The editor must show only fields relevant to that category.
   - Saving is explicit.

5. Month pace summary
   - Secondary strip or compact panel below/alongside the category list.
   - Shows one short status per category.
   - Good examples:
     - `Grind · dentro do ritmo · 8/16 sessões`
     - `Estudo · abaixo do ritmo · 3/6h`
   - Avoid charts, percentages as the main display, financial projections, and dense forecast language.

6. Context preview
   - Small implementation cue explaining how the data appears elsewhere.
   - Should mention Today and Weekly plan, but must not add controls for those sections.

Desktop hierarchy:

- Annual direction is strategic context, not the main editor.
- Target rows are the main interaction.
- Pace summary helps decisions but stays low-noise.
- Context preview is informational only.

Visual direction:

- Compact product UI, not a landing page.
- Category accents should follow existing design tokens where possible.
- Prefer rows/table/list over large dashboard cards.
- Avoid generic metric-card walls.

## 3. Mobile Layout

Mobile should support quick review and category-by-category editing.

Recommended mobile order:

1. Top bar
   - Screen title: `Objetivos mensais`.
   - Current month context.

2. Annual direction compact strip
   - Collapsible after the first line if space is tight.
   - Missing state remains visible but short.

3. Category list
   - Single column.
   - One compact row/card per category.
   - Each row shows category, current/target, and pace status.
   - Tap row or `Editar` opens the category editor.

4. Primary CTA
   - Sticky bottom action is acceptable:
     - `Definir objetivos` when empty.
     - `Guardar objetivos` inside editor.

5. Context preview
   - Short references to `Hoje` and `Plano semanal`.

Mobile editor behavior:

- Use a bottom sheet or full-screen sheet.
- Open one category editor at a time.
- Numeric inputs must be easy to tap.
- Do not show all four editors expanded at once.
- Do not use horizontal tables.

## 4. Required Components

- Monthly targets page header.
- Current month display or selector.
- Annual direction context strip.
- Missing Annual direction state.
- No-targets state.
- Existing-targets state.
- Target category row/card.
- Category accent/chip for Grind, Study, Review, Sport.
- Per-category target editor.
- Unit selector.
- Primary target value input.
- Optional secondary unit/value input for Grind.
- Pace status pill.
- Slim progress indicator.
- Month pace summary.
- Context preview for Today and Weekly plan.
- Loading state.
- Saving state.
- Inline validation state.
- Save error state.

Do not copy prototype source code directly. The design handoff is a visual/product reference only.

## 5. Buttons And CTAs

Primary CTAs:

- `Definir objetivos`
- `Editar objetivos`
- `Guardar objetivos`

Secondary/contextual CTAs:

- `Cancelar`
- `Editar categoria`
- `Guardar categoria`
- `Limpar categoria`
- `Definir direção anual`
- `Ver plano semanal`
- `Preparar semana`

CTA rules:

- `Definir direção anual` is secondary and must not block monthly target creation.
- `Ver plano semanal` and `Preparar semana` are navigation/context CTAs only.
- Do not edit the Weekly plan from this screen.

Avoid CTAs:

- `Criar previsão`
- `Ver analytics`
- `Adicionar meta financeira`
- `Gerar plano automático`
- `Aplicar sugestão do Coach`
- Any action implying financial tracking, dense analytics, automatic Coach changes, or adjacent non-MVP flows.

## 6. Main States

### Missing Annual Direction

When Annual direction does not exist:

- Monthly target creation remains available.
- Show a compact non-blocking warning above the target area.
- Offer `Definir direção anual` as a secondary CTA.
- Do not force an onboarding flow.

Suggested copy:

- `Ainda não definiste a direção anual.`
- `Podes definir objetivos mensais agora, mas o plano terá menos contexto estratégico.`

Today and Weekly plan may still receive monthly pace context, but without annual-alignment copy.

### No Targets

When the current month has no targets:

- Show Annual direction context if available.
- Show four empty categories: Grind, Estudo, Review, Sport.
- Make `Definir objetivos` the primary CTA.
- Do not show empty analytics panels.

Suggested copy:

- `Ainda não tens objetivos para este mês.`
- `Define metas simples para Grind, Estudo, Review e Sport.`
- `Isto vai dar contexto ao Hoje e ao Plano semanal.`

### Existing Targets

When targets exist:

- Show all four categories in a compact list/table.
- Show current progress, target value, unit, and pace status.
- Allow category-by-category editing.
- Keep completed/past months read-only unless a future spec explicitly approves past-month editing.

### Editing Category

When editing a category:

- Only the selected category is editable.
- Validate positive numeric target values.
- Keep units constrained to MVP units.
- Saving is explicit.
- Cancelling should discard unsaved category edits.

Category unit rules:

- Grind:
  - Primary unit: `sessões`.
  - Optional secondary unit: `torneios`.
- Study:
  - Primary unit: `horas` or `minutos`.
- Review:
  - Primary unit: `mãos`, `horas`, or `minutos`.
- Sport:
  - Primary unit: `sessões`, `blocos`, `horas`, or `minutos`.

### Pace Warning

When a category is behind pace:

- Use a low-noise warning status.
- Copy should point to planning action, not guilt.
- Weekly plan can later use this context to suggest adding or adjusting blocks, but not from this screen.

Suggested copy:

- `Abaixo do ritmo`
- `Podes compensar isto no próximo Plano semanal.`

### Save Error

Show a compact inline error near the save action.

Suggested copy:

- `Não foi possível guardar os objetivos. Tenta novamente.`

## 7. Suggested pt-PT Copy

Page:

- `Objetivos mensais`
- `Define o ritmo do mês para orientar a semana e o dia.`
- `Maio · dia 14 de 31`

Annual direction:

- `Direção anual`
- `Este mês deve aproximar-te disto:`
- `Prioridades do ano`
- `Sem direção anual`
- `Ainda não definiste a direção anual.`
- `Podes definir objetivos mensais agora, mas o plano terá menos contexto estratégico.`
- `Definir direção anual`

Targets:

- `Grind`
- `Estudo`
- `Review`
- `Sport`
- `Unidade principal`
- `Objetivo`
- `Unidade secundária`
- `Objetivo secundário`
- `Progresso atual`
- `Ritmo`

Units:

- `sessões`
- `torneios`
- `horas`
- `minutos`
- `mãos`
- `blocos`

Pace statuses:

- `Sem meta mensal`
- `Sem progresso`
- `Abaixo do ritmo`
- `Dentro do ritmo`
- `Acima do ritmo`
- `Completo`

Example rows:

- `Grind · 8/16 sessões · dentro do ritmo`
- `Estudo · 3/6h · abaixo do ritmo`
- `Review · 40/80 mãos · dentro do ritmo`
- `Sport · 1/4 sessões · abaixo do ritmo`

Context preview:

- `No Hoje: aparece como resumo compacto de ritmo mensal.`
- `No Plano semanal: ajuda a perceber se a semana chega para manter o mês no ritmo.`
- `Sem objetivos mensais, o plano semanal terá menos contexto de ritmo.`

## 8. Data The UI Needs

Annual direction context:

- `annualPlan.id`
- `annualPlan.year`
- `annualPlan.primaryDirection`
- `annualPlan.priorities`
- `annualPlan.constraints`
- `annualPlan.updatedAt`

Monthly target fields:

- `id`
- `userId`
- `month`
- `category`
- `primaryUnit`
- `targetValue`
- `optionalSecondaryUnit`
- `optionalSecondaryTargetValue`
- `createdAt`
- `updatedAt`

Derived progress data:

- `currentPrimaryValue`
- `currentSecondaryValue`
- `paceStatus`
- `paceDeltaLabel`
- `daysElapsedInMonth`
- `daysInMonth`

Progress source expectations:

- Grind primary progress comes from completed poker sessions.
- Grind optional tournament progress comes from completed session reviews.
- Study progress comes from logged study duration.
- Review progress can come from review block completion, marked-hand review completion, or logged review duration when those flows exist.
- Sport progress can come from weekly plan block completion or a future dedicated sport log if approved.

Today context needs:

- Compact monthly pace rows by category.
- Missing-targets flag.
- Missing Annual direction flag.
- No monthly-target editing controls.

Weekly plan context needs:

- Monthly targets by category.
- Current progress by category.
- Pace status by category.
- Enough data to compare planned weekly blocks against monthly pace.
- No changes to weekly-plan editing behavior in this spec.

## 9. Expected Interactions

- User opens `Objetivos mensais` from primary navigation.
- If Annual direction exists, the page shows it as strategic context.
- If Annual direction is missing, the page shows a non-blocking warning and secondary CTA.
- User defines targets for Grind, Study, Review, and Sport.
- User edits one category at a time.
- User saves explicitly.
- Saved targets update the month pace summary.
- Today receives compact monthly pace context.
- Weekly plan receives monthly target context to judge whether the week supports the month.
- Coach AI mock may later use this data to flag mismatch between monthly targets and weekly plan, but must not auto-apply changes.

## 10. Out Of Scope

- Editing Weekly plan from this screen.
- Changing the Weekly plan slice implementation.
- Dense analytics dashboards.
- Financial poker tracking.
- Profit, ROI, ABI, EV, bankroll, or graph-based poker metrics.
- Quarterly planning flow.
- Detailed annual forecasting.
- Automatic Coach-generated targets.
- Automatic Coach-applied plan changes.
- Multiple monthly target templates.
- Fitness tracking beyond simple Sport target units.
- Calendar scheduling.
- Drag-and-drop.
- Technical poker hand analysis.

## 11. Implementation Risks

- Treating Annual direction as a required blocker. It should be context, not a gate.
- Turning pace into analytics. The screen should support planning decisions only.
- Using hours as Grind's primary unit. MVP direction says Grind primary unit is sessions, with tournaments optional.
- Making Review ambiguous with Study. Keep Review as a monthly target category even if review can also appear as a study type elsewhere.
- Showing too many monthly numbers in Today. Today should only show compact context.
- Editing or reworking Weekly plan behavior while implementing Monthly targets. This spec only defines the context that Weekly plan can consume later.
- Treating calendar-month pace and planning-week pace as the same thing. Monthly pace is based on calendar month; Weekly plan follows the configured planning week.
- Making Coach suggestions feel automatic. Coach context can inform, but the player remains the author of the plan.
- Copying prototype code instead of rebuilding with project primitives.

## 12. Future Visual Smoke Test

When implemented, verify:

- Desktop page loads in the app shell with `Objetivos mensais` active in navigation.
- Official logo and global session CTA remain visible and unchanged.
- Missing Annual direction state appears without blocking target creation.
- No-targets state shows Grind, Estudo, Review, and Sport plus `Definir objetivos`.
- Existing-targets state shows all four categories with current/target values and pace status.
- Category editor opens for one category at a time.
- Target save is explicit.
- Grind uses `sessões` as primary unit and optional `torneios` as secondary context.
- Study uses time units.
- Review supports `mãos` or time units.
- Sport supports `sessões`, `blocos`, or time units.
- Today context stays compact and does not become analytics.
- Weekly plan context shows monthly pace without changing Weekly plan controls.
- Mobile view is single-column with no horizontal table overflow.
- No financial metrics, dense charts, generic analytics cards, or Coach auto-apply actions appear.
