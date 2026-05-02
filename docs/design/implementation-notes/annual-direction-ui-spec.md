# Annual Direction UI Implementation Spec

## 1. Section Objective

Create the MVP strategic direction surface before Monthly targets.

Annual direction should help a professional online poker player define the yearly context that guides monthly targets, weekly planning, reviews, and Coach AI feedback.

The section answers:

- What am I trying to build this year?
- What are the 2 to 4 priorities that should guide decisions?
- What constraints or non-negotiables must protect the year?
- What should I avoid repeating this year?
- What should this month move forward?

Product sequence:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Study log -> Poker sessions -> Reviews -> Coach AI mock`

This screen must stay lightweight. It must not become annual forecasting, quarterly planning, an OKR system, a financial target dashboard, or a broad life-planning workspace.

## 2. Desktop Layout

Use the standard app shell from the design handoff:

- Left sidebar navigation.
- Official EdgePlan logo in the sidebar.
- Highlighted global session CTA below the logo.
- Main content area with compact operational density.
- `Direção anual` active in navigation.

Recommended desktop structure:

1. Page header
   - Eyebrow: current year, for example `2026`.
   - Title: `Direção anual`.
   - Subtitle: `Define o contexto que orienta os objetivos mensais e as decisões da semana.`
   - Primary CTA:
     - `Definir direção` when no annual direction exists.
     - `Editar direção` when an annual direction exists.

2. Primary direction panel
   - Main working surface.
   - Shows one short statement as the central yearly direction.
   - In edit mode, use a focused text field or textarea with clear length guidance.
   - The statement should be specific enough to guide tradeoffs, but not forced into a formula.
   - Good examples:
     - `Construir uma rotina estável de MTTs sem sacrificar energia e estudo.`
     - `Aumentar consistência de volume mantendo review semanal obrigatório.`
   - Weak examples to avoid in helper copy:
     - `Ser melhor.`
     - `Ganhar mais.`
     - `Focar-me.`

3. Priorities section
   - Shows 2 to 4 priority rows or compact chips.
   - Priorities should be editable as short statements.
   - The UI should make the count constraint obvious: minimum 2, maximum 4.
   - Do not introduce weights, scores, key results, quarterly ownership, or priority categories unless approved later.

4. Constraints and non-negotiables section
   - Optional.
   - Use short rows or chips.
   - Purpose: protect boundaries that should affect planning decisions.
   - Examples:
     - `Domingo é dia de maior volume.`
     - `Não jogar quando o sono estiver muito fraco.`
     - `Review antes de aumentar volume.`
   - Keep this as planning context, not a rules engine.

5. Avoid repeating section
   - Optional short note.
   - Purpose: capture a known pattern the player does not want to repeat this year.
   - Keep tone practical and non-judgmental.
   - Example: `Não compensar semanas fracas com volume irrealista na semana seguinte.`

6. Context preview panel
   - Secondary panel explaining where this direction appears next.
   - Must mention Monthly targets and Coach AI.
   - Should not include editing controls for Monthly targets, Weekly plan, or Coach AI.
   - Suggested content:
     - `Nos Objetivos mensais: aparece como contexto para decidir o que este mês deve mover.`
     - `No Coach AI: ajuda a detetar desalinhamento entre direção, objetivos e plano semanal.`

7. Next action area
   - Primary next-step CTA: `Definir objetivos mensais`.
   - Secondary CTA only when useful: `Pedir revisão ao Coach`.
   - The Monthly targets CTA should navigate to Monthly targets. It must not create targets from this screen.

Desktop hierarchy:

- Primary direction is the main content.
- Priorities are the main supporting structure.
- Constraints and avoid-repeating notes are optional supporting context.
- Coach and Monthly targets previews are informational/contextual, not dominant.

Visual direction:

- Compact product UI, not a landing page.
- Use rows, quiet panels, thin dividers, and small status/helper text.
- Avoid oversized hero treatment, motivational cards, dense dashboards, charts, timelines, and generic goal-management UI.
- Do not copy prototype source code directly. The design handoff is a visual/product reference only.

## 3. Mobile Layout

Mobile should support quick review and simple editing without creating a long planning workshop.

Recommended mobile order:

1. Top bar
   - Screen title: `Direção anual`.
   - Current year context.

2. Primary direction
   - First visible content.
   - In read mode, show the statement prominently but compactly.
   - In edit mode, use a full-width textarea.

3. Priorities
   - Single-column list.
   - Add/remove priority controls should respect the 2 to 4 limit.
   - Avoid drag-and-drop ordering in the MVP.

4. Constraints and non-negotiables
   - Collapsible if space is tight.
   - Keep short descriptions visible enough to affect decisions.

5. Avoid repeating
   - Optional text area or compact read block.

6. Context preview
   - Short collapsed or compact block explaining Monthly targets and Coach AI usage.

7. Primary CTA
   - Sticky bottom action is acceptable in edit mode:
     - `Guardar direção`
   - In read mode:
     - `Definir objetivos mensais`

Mobile behavior:

- Use one column.
- Do not use horizontal tables.
- Do not show all helper examples permanently if they create clutter.
- Keep editing explicit and easy to cancel.

## 4. Required Components

- Annual direction page header.
- Current year display.
- Empty Annual direction state.
- Existing Annual direction read state.
- Annual direction edit state.
- Primary direction field.
- Priority row/chip component.
- Add priority action.
- Remove priority action.
- Priority count validation.
- Constraints/non-negotiables list.
- Add constraint action.
- Avoid repeating note field.
- Context preview for Monthly targets.
- Context preview for Coach AI.
- Primary next-step CTA to Monthly targets.
- Optional Coach review CTA.
- Loading state.
- Saving state.
- Inline validation state.
- Save error state.

Implementation should reuse existing app UI primitives, visual tokens, and shell behavior.

## 5. Buttons And CTAs

Primary CTAs:

- `Definir direção`
- `Guardar direção`
- `Editar direção`
- `Definir objetivos mensais`

Secondary/contextual CTAs:

- `Cancelar`
- `Adicionar prioridade`
- `Remover prioridade`
- `Adicionar limite`
- `Pedir revisão ao Coach`

CTA rules:

- `Definir objetivos mensais` is the main next-step CTA after the annual direction exists.
- `Pedir revisão ao Coach` should be secondary and optional.
- Coach may review or challenge the direction, but must not auto-apply changes.
- Do not block Monthly targets if the user chooses to skip Annual direction; other specs already allow non-blocking missing annual context.

Avoid CTAs:

- `Criar forecast anual`
- `Planear trimestres`
- `Criar OKRs`
- `Gerar objetivos automaticamente`
- `Aplicar sugestão do Coach`
- `Definir metas financeiras`
- `Criar roadmap`

Any action implying forecasting, quarterly planning, OKRs, financial tracking, automatic target generation, or Coach auto-apply is out of MVP scope.

## 6. Main States

### Empty State

Use when the current year has no Annual direction.

The page should:

- Explain the purpose in one short paragraph.
- Offer `Definir direção` as the primary CTA.
- Show the expected inputs before editing:
  - primary direction;
  - 2 to 4 priorities;
  - optional constraints;
  - optional avoid-repeating note.
- Offer `Definir objetivos mensais` as a secondary navigation action only if the broader product allows skipping Annual direction.

Suggested copy:

- `Ainda não definiste a direção anual.`
- `Define uma direção simples para o ano antes de escolher o ritmo do mês.`
- `Isto dá contexto aos Objetivos mensais, ao Plano semanal e ao Coach AI.`

### Editing First Direction

Use when the player creates the annual direction for the first time.

Rules:

- Primary direction is required.
- Priorities require minimum 2 and maximum 4.
- Constraints are optional.
- Avoid repeating is optional.
- Saving is explicit.
- Keep examples available, but not visually dominant.

Validation copy:

- `Escreve a direção principal do ano.`
- `Adiciona pelo menos 2 prioridades.`
- `Podes ter no máximo 4 prioridades.`

### Existing Direction

Use when a saved Annual direction exists.

The page should show:

- Current year.
- Primary direction.
- 2 to 4 priorities.
- Constraints/non-negotiables if present.
- Avoid-repeating note if present.
- Last updated date in a subtle location.
- CTA to `Editar direção`.
- CTA to `Definir objetivos mensais`.

Do not show progress bars or annual completion percentages.

### Editing Existing Direction

Use when the player changes a saved direction.

Rules:

- Preserve existing values in editable fields.
- Saving is explicit.
- Cancelling should discard unsaved edits.
- No automatic cascade changes to Monthly targets, Weekly plan, or Coach context should happen silently.
- After save, Monthly targets and Coach AI should receive updated context.

### Missing Monthly Targets

Use when Annual direction exists but the current month has no Monthly targets.

Show a compact next-action block:

- `Próximo passo`
- `Define objetivos mensais para transformar esta direção em ritmo de execução.`
- CTA: `Definir objetivos mensais`

Do not create Monthly targets inline.

### Coach Context Disabled Or Unavailable

Use if Coach AI context permissions or mock/live Coach availability are not ready.

- Keep Annual direction usable.
- Hide or disable `Pedir revisão ao Coach` with a short explanation if needed.
- Do not make Coach AI required for saving direction.

Suggested copy:

- `O Coach ainda não está disponível para rever esta direção.`
- `A direção fica guardada e pode ser usada como contexto mais tarde.`

### Save Error

Show a compact inline error near the save action.

Suggested copy:

- `Não foi possível guardar a direção anual. Tenta novamente.`

Keep entered values visible so the player can retry.

## 7. Suggested pt-PT Copy

Page:

- `Direção anual`
- `Define o contexto que orienta os objetivos mensais e as decisões da semana.`
- `2026`

Empty state:

- `Ainda não definiste a direção anual.`
- `Define uma direção simples para o ano antes de escolher o ritmo do mês.`
- `Isto dá contexto aos Objetivos mensais, ao Plano semanal e ao Coach AI.`

Primary direction:

- `Direção principal`
- `O que queres construir este ano?`
- `Escreve uma frase curta que ajude a tomar decisões.`
- `Exemplo: construir uma rotina estável de MTTs sem sacrificar energia e estudo.`

Priorities:

- `Prioridades`
- `Escolhe 2 a 4 prioridades para guiar o ano.`
- `Adicionar prioridade`
- `Remover prioridade`
- `Prioridade 1`
- `Prioridade 2`
- `Prioridade 3`
- `Prioridade 4`

Constraints:

- `Limites e não-negociáveis`
- `Que regras devem proteger o teu ano?`
- `Adicionar limite`
- `Opcional, mas útil para evitar planos irrealistas.`

Avoid repeating:

- `O que não repetir este ano`
- `Que padrão queres evitar?`
- `Exemplo: compensar semanas fracas com volume irrealista.`

Context preview:

- `Como isto será usado`
- `Nos Objetivos mensais: ajuda a decidir o que este mês deve mover.`
- `No Plano semanal: serve como lembrete de alinhamento, sem bloquear a criação do plano.`
- `No Coach AI: ajuda a detetar desalinhamento entre direção, objetivos mensais e plano semanal.`

Coach:

- `Pedir revisão ao Coach`
- `O Coach pode rever esta direção e desafiar pontos vagos ou irrealistas.`
- `O Coach não altera nada sem confirmação.`
- `Contexto usado: direção anual`

Monthly targets CTA:

- `Definir objetivos mensais`
- `Próximo passo`
- `Transforma esta direção no ritmo do mês.`

Saving:

- `Guardar direção`
- `A guardar...`
- `Guardado`
- `Não foi possível guardar a direção anual. Tenta novamente.`

## 8. Data The UI Needs

Annual direction fields:

- `annualPlan.id`
- `annualPlan.userId`
- `annualPlan.year`
- `annualPlan.primaryDirection`
- `annualPlan.priorities`
- `annualPlan.constraints`
- `annualPlan.avoidRepeating`
- `annualPlan.createdAt`
- `annualPlan.updatedAt`

Derived UI data:

- `hasAnnualDirection`
- `priorityCount`
- `canAddPriority`
- `canRemovePriority`
- `hasCurrentMonthTargets`
- `coachPlanningContextAllowed`
- `coachAvailable`
- `lastUpdatedLabel`

Monthly targets context needs:

- Annual direction primary statement.
- Annual priority list.
- Constraints/non-negotiables that affect planning.
- Missing Annual direction flag.
- No Annual direction editing controls inside Monthly targets.

Coach AI context needs:

- Annual direction primary statement.
- Priorities.
- Constraints/non-negotiables.
- Avoid-repeating note.
- Current monthly targets if available.
- Active weekly plan if available.
- Coach permissions state.

Coach behavior expectation:

- Coach may flag vague direction, too many priorities, unrealistic constraints, or mismatch between Annual direction, Monthly targets, and Weekly plan.
- Coach may propose clearer wording or a planning adjustment.
- Coach suggestions are individual and optional.
- Coach must not auto-apply changes.
- Coach must not provide technical poker hand analysis.

## 9. Expected Interactions

- User opens `Direção anual` from primary navigation.
- If no direction exists, the page shows a focused empty state.
- User chooses `Definir direção`.
- User enters one primary direction.
- User adds 2 to 4 priorities.
- User optionally adds constraints/non-negotiables.
- User optionally adds what not to repeat this year.
- User saves explicitly.
- Saved direction becomes visible in read state.
- User can navigate to `Objetivos mensais` with the annual context available there.
- Monthly targets shows the primary direction, priorities, and relevant constraints as context only.
- Coach AI can later use Annual direction to review alignment across monthly targets and weekly plans.
- User can edit Annual direction later without silently changing existing Monthly targets or Weekly plans.

## 10. Out Of Scope

- Annual forecasting.
- Quarterly planning.
- OKR system.
- Annual calendar.
- Year roadmap.
- Financial target dashboard.
- Profit, ROI, ABI, EV, bankroll, or graph-based poker metrics.
- Automatic Coach-generated direction.
- Automatic Coach-applied changes.
- Monthly target editing inside Annual direction.
- Weekly plan editing inside Annual direction.
- Advanced analytics.
- Priority weights, scores, confidence levels, or key results.
- Goal templates library.
- Public sharing, coach accounts, or team review.
- Technical poker hand analysis.

## 11. Implementation Risks

- Making Annual direction too heavy. The success criterion is under three minutes, so the UI should stay short.
- Turning priorities into OKRs. Keep priorities as simple statements, not measurable key results.
- Blocking Monthly targets unnecessarily. Annual direction is strategic context, not a hard gate for using the app.
- Creating annual forecast or quarterly setup pressure. The MVP explicitly avoids this.
- Letting Coach AI feel like the author. The player writes the direction; Coach can review and challenge only.
- Overusing motivational copy. The tone should be practical and direct.
- Making constraints feel punitive. They should protect planning quality, not create guilt.
- Updating Monthly targets or Weekly plan silently after editing Annual direction. Context can update, but existing plans should not change without explicit action.
- Showing Annual direction too prominently on execution screens. Today and Monthly targets need compact context, not a second planning surface.
- Copying prototype code instead of rebuilding with project primitives.

## 12. Future Visual Smoke Test

When implemented, verify:

- Desktop page loads in the app shell with `Direção anual` active in navigation.
- Official logo and global session CTA remain visible and unchanged.
- Empty state shows `Definir direção` and explains the four expected inputs.
- Edit state requires primary direction and 2 to 4 priorities.
- Priority add/remove controls enforce minimum 2 and maximum 4.
- Constraints/non-negotiables are optional.
- Avoid-repeating note is optional.
- Save is explicit and shows loading/error states.
- Existing direction read state shows primary direction, priorities, optional constraints, optional avoid-repeating note, and subtle last updated context.
- `Definir objetivos mensais` navigates to Monthly targets and does not edit targets inline.
- Monthly targets can show the Annual direction context without adding Annual direction editing controls.
- Coach review CTA is secondary and does not auto-apply changes.
- Mobile view is single-column with no horizontal overflow.
- No annual forecasting, quarterly planning, OKR language, financial metrics, dense charts, generic analytics cards, or Coach auto-apply actions appear.
