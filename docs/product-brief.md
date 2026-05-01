# Coach AI Poker Planner - Product Brief

## Vision

An application for professional online poker tournament players, focused on productivity, organization, accountability, and sustainable performance.

The app should not become a complex financial tracker or a heavy Notion-style workspace. It should work as a daily operational coach: helping the player define priorities, execute commitments, prepare online sessions, review decisions, and improve consistency over time.

## Product Principles

- Simple before complete.
- Few inputs, high value.
- The dashboard is action-oriented: "what matters now?" and "what is the next best action?".
- The AI Coach is adaptive: calm when there is stress/tilt, more direct when there is repeated procrastination.
- Evidence-informed by default: product decisions should be grounded in relevant research, proven performance methods, and real-world usage patterns when available.
- Privacy by default.
- Build phase by phase.
- Do not create generic full pages without a real flow, data model, and purpose.
- The current dashboard is the visual reference; other areas should be designed only when their flow and data are clear.
- Scientific or performance-based ideas must be translated into simple, usable flows. Do not make the app heavy just to expose the theory behind a feature.

## Language Rules

- User-facing UI/copy: Portuguese from Portugal.
- Code, database schema, commits, and technical docs: English.
- Product brainstorming with the founder can happen in pt-PT.

## Decided Stack

- Next.js
- TypeScript
- Tailwind/shadcn
- Convex for database/backend
- Clerk for authentication
- OpenAI API for the AI Coach

## Platform Direction

Balanced responsive product:

- Desktop: online grind, dashboard, sessions, analysis.
- Mobile: quick check-in, daily commitments, short review, AI Coach.

## MVP

Main focus:

1. Daily accountability
2. AI Coach as the central experience
3. Online sessions as context, not as the main financial tracking product

First vertical slice:

- Demo mode without account
- Clerk login
- Real dashboard
- Daily check-in
- Daily commitments
- Simple online session
- Quick review
- AI Coach mock using real app data
- Data persisted in Convex

## AI Coach

Product model:

- Basic Coach included.
- Advanced Coach and deep analysis in the paid plan.
- Future: optional BYOK for power users.

The Coach may use:

- Check-ins
- Goals
- Commitments
- Online sessions
- Reviews
- Notes and marked hands
- Calculated patterns

Important rule: the player must control which data is included in the Coach memory.

## Poker Data

The MVP should not compete with poker financial trackers.

Poker data exists mainly as context to improve feedback:

- Platform
- Tournament/session
- Buy-in
- Simple result
- Focus
- Energy
- Tilt
- Number of tables
- Quick notes
- Marked hands
- Post-session review

Advanced fields should appear only when they are useful.

## Goals

Goals should be hybrid:

- The player can write freely.
- The AI Coach helps transform vague goals into clear, measurable, actionable goals.

Goal hierarchy:

- Year
- Quarter
- Month
- Week
- Today

The daily goal should clearly connect to the larger objective.

## Accountability

Adaptive:

- If there was stress/tilt: calm and regulating tone.
- If there was repeated procrastination: more direct tone.
- Always end with a small next action.

Avoid excessive guilt. The app should increase responsibility without worsening tilt.

## Daily Check-In

Adaptive:

- Ultra-simple by default.
- The app asks for more context only when it helps the AI Coach.

Base fields:

- Sleep
- Energy
- Focus
- Stress
- Priority #1
- 1 to 3 main commitments

## During Online Session

During a session, input must be ultra fast:

- Mark hand
- Quick note
- Tilt +1
- Break done
- Low energy

Details belong in the post-session review.

## Post-Session Review

Two-minute review:

- Simple result
- Focus
- Energy
- Tilt
- 1 good decision
- 1 mistake to review
- Marked hands
- Next action

## Future Coach/Team Support

The architecture should be prepared for:

- Individual player
- Human coach monitoring multiple players
- Teams/squads
- Private sharing controlled by the player

Privacy by default.

## Business Model

Hybrid:

- Individual subscription initially.
- Future plans for coaches/teams.

AI Coach:

- Basic included.
- Advanced/deep analysis in paid plan.

## Development Rules

- Build in small slices.
- Do not create full pages without a real flow.
- Do not let generic prototypes guide product decisions.
- Before implementing or significantly changing each product area, run product discovery first: research relevant evidence, brainstorm options with the founder, ask decision questions one at a time, then document the approved spec.
- Before implementing each approved area, define: objective, evidence-informed principles, data, flow, UX boundaries, success criteria, and out-of-scope items.
- Always validate with build/lint/test when available.
- Keep the app simple, intuitive, and not overwhelming.

## Next Recommended Slice

Slice 1: Technical foundation.

Goal:

- Create the Next.js + TypeScript app.
- Configure Tailwind/shadcn.
- Prepare Convex.
- Prepare Clerk.
- Migrate only the current dashboard as the initial visual reference.

Out of scope:

- Real AI Coach.
- Billing.
- Complete goals/sessions/reviews pages.
- Advanced analytics.
