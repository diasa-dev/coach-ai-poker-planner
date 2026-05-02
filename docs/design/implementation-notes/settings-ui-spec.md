# Settings UI Implementation Spec

## 1. Section Objective

Create the MVP settings surface for preferences that affect the planning system, Coach AI context, theme, and current auth/mock state.

`Definições` should be quiet and utility-focused. It exists to let the player control how the app behaves across the product spine without becoming an account center, billing area, profile page, or admin console.

Product sequence context:

`Annual direction -> Monthly targets -> Weekly plan -> Daily execution -> Study log -> Poker sessions -> Reviews -> Coach AI mock`

MVP scope:

- Planning week start day.
- Coach AI data permissions.
- Dark mode.
- Demo/mock mode indication when the app is running without real environment data.
- Account/auth placeholders because Clerk exists in the stack.

## 2. Desktop Layout

Use the standard app shell:

- Left sidebar navigation.
- Highlighted global session CTA remains in the shell, not inside Settings.
- `Definições` appears as secondary navigation, visually below the primary product surfaces.
- Main content area with a compact settings layout.

Recommended desktop structure:

1. Page header
   - Eyebrow: `Definições`
   - Title: `Preferências`
   - Subtitle: `Controla a semana de planeamento, o tema e o contexto usado pelo Coach.`
2. Two-column settings grid
   - Left/main column: planning week and Coach permissions.
   - Right/secondary column: appearance, account/auth state, and demo/mock mode status.
3. Planning week panel
   - Shows the current planning-week start day.
   - Lets the user change the start day with a simple select or segmented picker.
   - Explains that future weekly plans and reviews follow this preference.
4. Coach AI permissions panel
   - Data-type permission rows with short descriptions and toggles.
   - Financial result permission must be explicit and more cautious than normal data rows.
   - Show a compact summary of what the Coach can currently use.
5. Appearance panel
   - Dark mode toggle.
   - Optional system preference option only if easy to support without adding complexity.
6. Account/auth panel
   - If signed in: show account status and a Clerk account/user button placeholder.
   - If signed out and Clerk is configured: show sign-in CTA placeholder.
   - If Clerk keys are missing: show demo mode state instead of broken auth controls.
7. Demo/mock mode panel or banner
   - Only visible when the app is in mock/demo mode or missing live service configuration.
   - Keep it informative, not alarming.

Desktop hierarchy:

- Planning week and Coach permissions are the primary settings.
- Theme and auth state are secondary utilities.
- Demo/mock mode status should be visible but should not dominate the page.

Visual direction:

- Use compact panels with setting rows, thin dividers, and clear labels.
- Use toggles for binary preferences.
- Use select/segmented control for planning week start day.
- Dark mode should use the established dark slate/charcoal rules, not pure black.
- Do not copy prototype code directly from the design handoff.

## 3. Mobile Layout

Mobile should use a single-column settings list.

Recommended order:

1. Top bar
   - Title: `Definições`
2. Demo/mock mode status, only if active
3. Planning week panel
4. Coach AI permissions panel
5. Appearance panel
6. Account/auth panel

Mobile behavior:

- Keep each setting as a compact row.
- Use full-width rows with right-aligned controls.
- Coach permissions can be grouped under a collapsible section if the list becomes too long.
- Avoid side-by-side controls.
- Avoid long explanatory text; keep descriptions to one short line.

## 4. Required Components

- Settings page header.
- Planning week start day control.
- Coach AI permissions list.
- Data permission row.
- Sensitive data permission row.
- Toggle control.
- Theme mode control.
- Account/auth placeholder block.
- Demo/mock mode status block.
- Save/pending state for changed preferences.
- Error state for failed preference save.
- Loading state while preferences/auth status load.

Implementation should reuse existing app UI primitives and visual tokens.

## 5. Buttons And CTAs

Primary/contextual:

- `Guardar alterações`
- `Iniciar sessão`
- `Gerir conta`

Secondary:

- `Cancelar`
- `Repor predefinições`

Avoid:

- `Gerir plano`
- `Billing`
- `Upgrade`
- `Criar equipa`
- `Convidar coach`
- `Editar perfil avançado`
- Any CTA implying billing, team accounts, coach accounts, or advanced profile management.

If preferences autosave, do not show `Guardar alterações`; instead show a small saved state such as `Guardado`.

## 6. Main States

### Default State

Use when preferences load successfully.

The page shows:

- Current planning week start day.
- Current Coach permissions.
- Current theme preference.
- Account/auth state.
- Demo/mock mode indication only if relevant.

### Unsaved Changes

Use if the implementation chooses explicit save.

- Highlight only changed rows subtly.
- Enable `Guardar alterações`.
- Keep navigation available; warn only if leaving would lose changes.

### Saving State

- Disable the changed controls or show row-level pending state.
- Use copy: `A guardar...`

### Saved State

- Use subtle confirmation copy: `Guardado`.
- Do not show a large success banner for normal preference changes.

### Error State

Use when saving preferences fails.

Suggested copy:

- `Não foi possível guardar as alterações.`
- `Tenta novamente.`

Keep the user's selected values visible so they can retry.

### Demo/Mock Mode State

Use when live Clerk/Convex/OpenAI configuration is missing or the app intentionally runs in demo mode.

Suggested copy:

- `Modo demo ativo`
- `Alguns dados podem ser temporários até ligares a conta e os serviços.`

Do not block the settings page in demo mode.

### Signed Out State

Use when Clerk is configured but the user is not authenticated.

Suggested copy:

- `Sessão não iniciada`
- `Inicia sessão para guardar preferências na tua conta.`

Primary CTA:

- `Iniciar sessão`

### Signed In State

Use when Clerk has an active user.

Suggested copy:

- `Conta ligada`
- `As preferências ficam associadas à tua conta.`

CTA:

- `Gerir conta`

## 7. Suggested pt-PT Copy

Page:

- `Definições`
- `Preferências`
- `Controla a semana de planeamento, o tema e o contexto usado pelo Coach.`

Planning week:

- `Semana de planeamento`
- `A semana começa em`
- `Isto define a ordem do Plano semanal, do Hoje e das reviews.`
- `Segunda-feira`
- `Terça-feira`
- `Quarta-feira`
- `Quinta-feira`
- `Sexta-feira`
- `Sábado`
- `Domingo`

Coach permissions:

- `Permissões do Coach AI`
- `Escolhe que dados o Coach pode usar como contexto.`
- `Plano semanal e objetivos mensais`
- `Foco, blocos planeados, ajustes e ritmo mensal.`
- `Sessões de poker`
- `Foco, duração, torneios, qualidade e sinais de execução.`
- `Estudo`
- `Tipo, duração, qualidade e notas de estudo.`
- `Reviews`
- `Reflexões semanais, ratings e ajustes para a próxima semana.`
- `Energia, foco e tilt`
- `Check-ups e sinais sensíveis de estado durante execução.`
- `Mãos marcadas para rever`
- `Categorias e notas usadas para organizar estudo/review.`
- `Resultado financeiro`
- `Opcional e sensível. Só deve entrar no contexto do Coach com autorização explícita.`
- `O Coach nunca dá análise técnica de mãos.`

Appearance:

- `Aparência`
- `Dark mode`
- `Usar tema escuro`

Auth/account:

- `Conta`
- `Conta ligada`
- `Sessão não iniciada`
- `Iniciar sessão`
- `Gerir conta`

Demo/mock:

- `Modo demo ativo`
- `Alguns dados podem ser temporários até ligares a conta e os serviços.`

Save states:

- `Guardar alterações`
- `Guardado`
- `A guardar...`
- `Não foi possível guardar as alterações.`
- `Tenta novamente.`

## 8. Data The UI Needs

User/preference data:

- `userId`
- `weekStartDay`
- `themePreference`: `light | dark | system`
- `coachDataPermissions`
- `createdAt`
- `updatedAt`

Coach permission flags:

- `allowCoachPlanningContext`
- `allowCoachSessionContext`
- `allowCoachStudyContext`
- `allowCoachReviewContext`
- `allowCoachStateSignals`
- `allowCoachMarkedHandsContext`
- `allowCoachFinancialContextDefault`

Auth/runtime state:

- `isClerkConfigured`
- `isSignedIn`
- `userDisplayName` or `userEmail`, only if already available from Clerk
- `isConvexConfigured`
- `isOpenAIConfigured`
- `isDemoMode`

Notes:

- Financial session result still needs per-session explicit permission. A global default may preselect the option, but it must not silently include historical or future financial data without a clear user-controlled setting.
- Coach permissions should affect context retrieval and prompt construction later, not only the UI.
- If preferences are not yet persisted, keep demo/local behavior clear in the UI.

## 9. Expected Interactions

- Changing `weekStartDay` updates future weekly plan display, Today planning-week preview, and weekly review timing.
- Changing `weekStartDay` must not reorder or mutate existing historical weekly plans silently.
- Coach permission toggles update which data sources the Coach may use.
- Turning off a permission should remove that data source from future Coach context.
- Financial result permission must remain visibly sensitive and should not turn the app into a financial tracker.
- Dark mode toggles the app theme immediately.
- Theme preference should persist per user when signed in, or locally/demo when not signed in.
- `Iniciar sessão` opens the Clerk sign-in flow when Clerk is configured.
- `Gerir conta` opens the Clerk user/account control when signed in.
- Demo/mock mode status explains limitations but does not add a separate demo settings flow.

## 10. Out Of Scope

- Billing or paid plan management.
- Advanced profile editing.
- Team accounts.
- Coach accounts.
- Role management.
- Notification preferences.
- Data export/delete account flow.
- Full privacy center or audit log.
- Coach suggestion history center.
- Poker financial dashboards.
- Technical hand-analysis preferences.
- Multiple workspace/account switching.
- Custom themes beyond light/dark/system.

## 11. Implementation Risks

- Planning-week start day can break weekly plan assumptions if existing plans are recalculated instead of treated as dated records.
- The Settings screen can become a dumping ground for future preferences; keep the MVP list strict.
- Coach permissions can look like privacy theatre if they do not actually control context retrieval later.
- Financial result permission is easy to make too broad. Keep per-session consent explicit.
- Demo/mock mode can confuse users if it appears as a product feature instead of an environment/status indication.
- Clerk controls can feel broken when environment keys are missing; show demo mode instead.
- Dark mode can regress brand quality if implemented as pure black or without the white logo/sidebar rules.
- A global `allowCoachFinancialContextDefault` could be misread as consent for all financial history. Copy and behavior must make the scope clear.

## 12. Future Visual Smoke Test

When this section is implemented, visually verify:

- Desktop Settings loads in the standard app shell and `Definições` is secondary navigation.
- Planning week start day control is visible and defaults to Monday when no preference exists.
- Coach permission rows are compact, readable, and use toggles.
- Financial result permission is visually marked as sensitive and secondary.
- Dark mode toggle changes the app to dark slate/charcoal, not pure black.
- Demo/mock mode indication appears when live service config is missing.
- Clerk signed-in and signed-out placeholders render without layout shifts.
- No billing, advanced profile, team, or coach-account UI appears.
- Mobile Settings is single-column and all controls fit without horizontal scrolling.
- UI copy is Portuguese from Portugal.
