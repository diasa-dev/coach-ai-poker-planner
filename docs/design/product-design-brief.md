# Product Design Brief

## Current Direction

The app should be redesigned around the planning system, poker session flow, and Coach AI before more product flows are implemented.

The dashboard should not become session-first, but it must support poker sessions as a core execution flow. It should center the player's current plan, weekly execution, session state, monthly pace, annual direction context, and Coach AI guidance.

The detailed approved redesign decisions live in `docs/design/planning-system-redesign-spec.md`.

The implementation-ready text wireframes live in `docs/design/planning-system-wireframes.md`.

Brand note: the current name remains EdgePlan for now. The symbol/logo direction is accepted, but the product name may change later without changing the core identity.

## Primary User Questions

- What should I do today?
- Is this week realistic?
- Am I on pace for this month?
- Is this month aligned with my annual direction?
- What have I missed or adjusted?
- Is there an active or pending poker session?
- What session/study/review data should feed Coach AI?
- What should I improve before next week?

## Primary Surfaces

- Dashboard
- Annual direction
- Monthly targets
- Weekly plan
- Daily execution
- Poker sessions
- Study session log
- Weekly review
- Coach AI chat and contextual review

## Dashboard Should Show

- Today's blocks and commitments
- Current weekly progress
- Session CTA/state
- Annual direction context when it helps a decision
- Light monthly pace feedback
- Study/review attention items
- Hands-to-review backlog when actionable
- Session review CTA when relevant
- Weekly review CTA when relevant
- Coach AI insight plus `Ask Coach` CTA

## Dashboard Should Avoid For Now

- Session preparation as the only dominant product idea
- Dense analytics
- Financial poker tracking
- Full calendar scheduling
- Generic motivational panels
- AI chat as the only way to interact
- Technical poker hand analysis

## Interaction Principles

- Prefer editable blocks over long forms.
- Prefer quick status changes over heavy journaling.
- Prefer optional reasons over mandatory explanations.
- Keep Coach AI suggestions actionable and individually acceptable.
- Keep Coach AI present through contextual insights, a dedicated chat surface, and proposal cards that require confirmation.
- Keep poker-session capture fast and optional during play.
- Use Portuguese from Portugal for user-facing UI.

## Redesign Inputs

Use `docs/features/planning-system.md` as the product source of truth for the planning-system model.

Use `docs/features/poker-session-flow.md` as the product source of truth for poker-session capture and review.

Use `docs/design/planning-system-redesign-spec.md` and `docs/design/planning-system-wireframes.md` as the source of truth for the active redesign direction.

The archived session specs under `docs/archive/session-flow-v0/` are historical inputs only. The active session direction lives in `docs/features/poker-session-flow.md`.
