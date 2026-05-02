# Uplinea Design Handoff

This folder is the visual handoff reference for the Uplinea implementation.

Use it as a product and visual source of truth, not as production code to copy blindly.

## Source Files

- `source/Uplinea_Print.pdf` - full printable prototype reference.
- `source/Uplinea.zip` - original Claude Design export.
- `assets/` - official logo assets, brand reference image, and support motifs.
- `tokens/colors_and_type.css` - exported visual tokens for color, type, spacing, radius, and dark mode reference.
- `notes/design-decisions.md` - implementation rules and product-specific design decisions.

## Handoff Priority

When implementation details conflict, use this order:

1. Feature specs in `docs/features/`.
2. Product brief in `docs/product-brief.md`.
3. Design decisions in `docs/design-handoff/uplinea/notes/design-decisions.md`.
4. Latest PDF/screens in `docs/design-handoff/uplinea/source/Uplinea_Print.pdf`.
5. Prototype source in `docs/design-handoff/uplinea/source/Uplinea.zip`.

## Implementation Rule

The prototype defines layout, hierarchy, visual direction, and interaction intent.

It does not define final code architecture. Rebuild with the app stack and existing project patterns.

## Core Product Loop

`Monthly targets -> Weekly plan -> Daily execution -> Poker sessions / Study -> Reviews -> Coach AI patterns -> Next weekly plan`

## Must Preserve

- Portuguese from Portugal for all visible UI copy.
- English for code, schemas, commits, and technical docs.
- Compact operational screens for daily use.
- Calm reflective screens for review and Coach AI.
- Sidebar with official logo and highlighted session CTA.
- Session CTA states: `Iniciar sessão`, `Sessão ativa`, `Terminar e rever`.
- Weekly plan as the center of execution.
- `Planear semana` as the primary weekly planning flow.
- `Adicionar bloco` as a secondary quick-edit action.
- Coach suggestions never auto-apply changes.
- Financial session result is optional, secondary, private, and only used by Coach AI with explicit permission.
