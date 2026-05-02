# EdgePlan Design Decisions

## Brand

- Use the official EdgePlan logo files from `assets/`.
- Light backgrounds should use the normal logo on white or light surfaces.
- Dark mode and dark sidebar should use the all-white logo variant.
- Do not recreate, recolor, distort, simplify, or replace the mark.
- The current product name is a working name. Keep the UI flexible enough that the wordmark can later change without rebuilding the visual system.

## Brand Tokens

Primary palette:

- Navy: `#0D1B2A`
- Blue: `#1E3A8A`
- Teal: `#22C5D5`
- Light grey: `#EEF2F7`

Typography:

- Inter.

Dark mode:

- Use dark slate/charcoal, not pure black.
- Use the all-white logo version.
- Keep teal as the primary action accent.

## Visual Direction

EdgePlan should feel like a compact performance operating system for professional online poker tournament players.

It should not feel like:

- a casino app
- a gambling app
- a poker financial tracker
- a technical hand analysis tool
- a generic SaaS dashboard
- a Notion-style workspace
- an AI chatbot wrapper
- a landing page

Prefer:

- compact rows
- clear hierarchy
- restrained category accents
- thin dividers
- small status pills
- low visual noise
- high scan speed
- concrete product flows over decorative cards

Avoid:

- oversized hero dashboards
- generic metric cards without an action
- large colorful block cards
- decorative panels that do not support a workflow
- financial charts or result-first poker UI

## Navigation

Primary navigation:

- Hoje
- Plano semanal
- Objetivos mensais
- Sessões
- Estudo
- Revisão
- Coach AI

Settings:

- `Definições` stays lower in the sidebar.

The highlighted global session CTA sits below the logo and changes by session state.

## Weekly Plan

The weekly plan is the main planning surface.

Use two modes:

- `Plano semanal`: compact execution/list view.
- `Planear semana`: full-week creation/editing mode.

`Planear semana` is the primary way to create the week. It should show all seven days side by side on desktop whenever possible.

Required:

- weekly focus/intention
- preset starting points
- seven-day planning grid
- day-level summaries
- compact block cards
- add block per day
- day off state
- copy previous week
- review with Coach
- save plan
- bottom weekly distribution summary

`Adicionar bloco` remains a secondary action for quick edits, not the main planning workflow.

Past days should not be deleted from the weekly view. They can be collapsed or visually quieter when the player is focused on execution.

The current day must be visually obvious with a stronger treatment: badge, accent, and subtle background.

## Plan Blocks

Plan block categories:

- Grind
- Study
- Review
- Sport
- Rest
- Admin/Other

Plan block statuses:

- Planned
- Done
- Adjusted
- Not done

Each block supports:

- compact row version
- expanded version when needed
- category accent
- type/category label
- title
- optional target
- status pill
- quick actions

## Today

Today is an execution screen, not a generic dashboard.

Separate clearly:

- `Compromissos de hoje`: 1-3 practical commitments chosen in the prepare-day flow.
- `Blocos planeados`: original blocks from the weekly plan.

States:

- before preparation: primary CTA `Preparar dia`
- after preparation: commitments with `Feito`, `Ajustar`, `Não feito`
- end of day: `Fechar dia`

Attention items should appear only when actionable.

Coach presence should be compact and contextual.

## Sessions

Sessions are a core app surface because they feed Coach AI with real grind context.

The session flow:

1. Start session from the global CTA, a Grind block, or the Sessions page.
2. Use a short setup drawer.
3. Active session page for focused capture.
4. Finish and review session.

Active session must include:

- weekly focus
- session focus
- linked Grind block
- current micro-intention
- timer/status
- current energy/focus/tilt/tables/hands-to-review state
- quick capture actions
- compact timeline
- passive Coach observation
- `Terminar sessão`

Quick capture actions:

- `Check-up rápido`
- `Mão para rever`
- `Nota rápida`
- `Micro-intenção`

Do not open full Coach chat during active play.

## Reviews

Weekly review is recommended, not mandatory.

It should close the loop from plan to reality:

- automatic summary first
- plan vs reality by category
- adjusted/not done reasons
- player reflection
- Coach suggestion after reflection
- CTA to review with Coach
- CTA to prepare next week

Session review should stay short and practical.

Financial result:

- optional
- secondary
- hidden from dashboards by default
- requires explicit permission before inclusion in Coach AI context

## Coach AI

Coach AI should be present but not dominant.

Surfaces:

- compact Today insight
- contextual drawer
- proposal cards
- full chat page
- context-used indicator
- prompt chips

Coach behavior:

- direct
- calm
- practical
- no fake motivation
- can challenge repeated procrastination without guilt
- proposes changes but never applies without player confirmation
- shows context used
- does not provide technical poker hand analysis

Proposal cards should use a review/confirm flow:

- `Rever proposta`
- `Editar`
- `Ignorar`
- `Aplicar alteração` only after review/confirmation

## First Implementation Slices

Recommended order:

1. App shell, logo usage, visual tokens, sidebar, global session CTA, basic routes.
2. Weekly plan and `Planear semana`.
3. Today execution flow.
4. Sessions: start drawer, active session, quick capture, finish review.
5. Study log and monthly targets.
6. Weekly review.
7. Coach AI contextual surfaces and chat.

