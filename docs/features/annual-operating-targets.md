# Annual Operating Targets Feature Spec

## Objective

Add a lightweight operating rhythm layer under Annual direction.

Annual Operating Targets let a player define concrete rhythm metrics for the rest of the year, such as grind days per month, tournaments per month, study hours per week, review volume, training sessions, coaching sessions, sport sessions, or custom metrics.

This layer should help future Monthly targets and Weekly plan decisions without turning Annual direction into OKRs, annual forecasting, financial tracking, or dense analytics.

## Evidence-Informed Principles

- Specific targets with feedback are more useful than vague intentions.
- Short operating rhythms are easier to adjust than annual forecasts.
- Historical target changes should not rewrite past expectations.
- Players may start using the app mid-year, so the app should judge targets from the date they become active.
- The player remains the author of targets; the app may later suggest alignment, but should not auto-apply changes.

## User Flow

1. User opens `Direção anual`.
2. User sees Annual direction as the strategic layer.
3. User sees a separate section named `Ritmo operacional anual`.
4. User adds a predefined metric or a custom metric.
5. For preset metrics, user sets cadence, target value, and effective start date; label, unit, and category stay canonical.
6. For custom metrics, user also sets label, unit, and category.
7. By default, `effectiveFrom` is today's date.
8. User may reveal a less prominent date control to change `effectiveFrom`.
9. User saves explicitly.
10. If the same metric is changed later, the old version remains in history and the new version becomes active from its `effectiveFrom`.
11. Current metrics are visible by default; history is visible but discreet.

## Data Model

### `annualOperatingTargets`

- `userId`
- `year`
- `metricKey`
- `label`
- `category`: `grind | study | review | sport | recovery | custom`
- `unit`
- `cadence`: `daily | weekly | monthly | yearly`
- `targetValue`
- `effectiveFrom`
- `active`
- `createdAt`
- `updatedAt`

History is represented by multiple records with the same `metricKey`, `userId`, and `year`.

When a new version is saved for the same metric:

- previous active versions for that metric become inactive;
- the new version is inserted as active;
- previous records remain available for historical display and future month-specific interpretation.

## Suggested Presets

- `Dias de grind por mês`
  - category: `grind`
  - unit: `dias`
  - cadence: `monthly`
- `Torneios por mês`
  - category: `grind`
  - unit: `torneios`
  - cadence: `monthly`
- `Horas de estudo por semana`
  - category: `study`
  - unit: `horas`
  - cadence: `weekly`
- `Horas de revisão por semana`
  - category: `review`
  - unit: `horas`
  - cadence: `weekly`
- `Sessões de treino por mês`
  - category: `study`
  - unit: `sessões`
  - cadence: `monthly`
- `Sessões de coaching por mês`
  - category: `study`
  - unit: `sessões`
  - cadence: `monthly`
- `Sessões de desporto por semana`
  - category: `sport`
  - unit: `sessões`
  - cadence: `weekly`
- `Métrica personalizada`
  - category: `custom`

## UX Boundaries

- This lives inside `Direção anual` as a separate section.
- Do not create a new page or navigation item.
- Do not make Annual direction itself heavier.
- Do not auto-create monthly targets from this section.
- Monthly targets may derive suggestions only from saved active annual metrics; unsaved modal changes must not leak into Monthly.
- Do not create quarterly planning.
- Do not create OKRs, key results, scores, weights, or annual forecasts.
- Do not include financial poker metrics such as profit, ROI, ABI, EV, or bankroll.
- Do not auto-apply Coach suggestions.

## Success Criteria

- User can add a preset metric quickly.
- Preset metric label, unit, and category are hidden and saved from canonical definitions.
- User can add a custom metric.
- Custom metrics expose editable label, unit, category, target value, cadence, and `effectiveFrom`.
- `effectiveFrom` defaults to today.
- User can change `effectiveFrom` when needed.
- Editing an existing metric creates a new active version and keeps older versions.
- Adding, editing, or removing metrics inside the Annual direction wizard remains isolated until the user saves the wizard.
- Removing a metric uses an in-app confirmation modal, not native browser confirmation.
- History is visible but not visually dominant.
- Annual direction remains the strategic layer; operating targets remain a practical rhythm layer.
- Monthly targets show an empty state with a CTA to Annual direction when no saved active annual metric can produce monthly suggestions.

## Out Of Scope

- Today, Weekly plan, Sessions, Review, or Coach integration.
- Analytics dashboards.
- Calendar scheduling.
- Quarterly planning.
- Financial tracking.
- Automatic generated targets.
