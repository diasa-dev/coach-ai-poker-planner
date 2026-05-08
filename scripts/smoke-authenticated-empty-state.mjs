import {
  createAuthSmokeSessionConfig,
  ensureAuthenticatedSmokeSession,
  launchAuthenticatedSmokeContext,
} from "./auth-smoke-session.mjs";

const authSmokeConfig = createAuthSmokeSessionConfig({
  command: "npm run smoke:empty:auth",
  name: "Authenticated empty-state smoke",
});
const { baseUrl } = authSmokeConfig;

const forbiddenStrings = [
  "Modo demo/mock",
  "Semana demo",
  "João M.",
  "Plano da semana demo",
  "Bluff catch — river",
  "Push/fold spots",
  "42 torneios",
];

const routes = ["/", "/weekly", "/monthly", "/annual", "/sessions", "/study", "/review", "/coach"];

const expectedEmptyStateCopy = new Map([
  ["/", ["Começa pela direção anual", "Definir direção anual"]],
  ["/weekly", ["Planear semana", "Dados reais ligados"]],
  ["/monthly", ["Ainda não há métricas anuais para orientar este mês.", "Sem direção anual"]],
  ["/annual", ["Ainda não definiste a direção anual.", "Definir direção"]],
  ["/sessions", ["Ainda não há sessões registadas."]],
  ["/study", ["Ainda não tens registos de estudo", "Registar estudo"]],
  ["/review", ["Ainda não há plano semanal real para rever.", "Sem estudo registado nesta semana"]],
  ["/coach", ["Sem plano ativo", "Sem sessões"]],
]);

async function readBodyText(page) {
  await page.locator("body").waitFor({ state: "visible", timeout: 20_000 });
  return page.locator("body").innerText();
}

async function waitForShellToSettle(page) {
  const deadline = Date.now() + 20_000;
  let bodyText = await readBodyText(page);

  while (Date.now() < deadline) {
    if (!bodyText.includes("A preparar entrada") && !bodyText.includes("A carregar")) return bodyText;

    await page.waitForTimeout(500);
    bodyText = await readBodyText(page).catch(() => bodyText);
  }

  return bodyText;
}

function assertNoErrorBoundary(text, route) {
  if (
    text.includes("This page couldn") ||
    text.includes("couldn’t load") ||
    text.includes("Reload to try again")
  ) {
    throw new Error(`${route} rendered the error boundary`);
  }
}

function assertNoForbiddenStrings(text, route) {
  const matches = forbiddenStrings.filter((value) => text.includes(value));
  if (matches.length > 0) {
    throw new Error(`${route} rendered authenticated demo/mock copy: ${matches.join(", ")}`);
  }
}

function assertExpectedEmptyState(text, route) {
  const expected = expectedEmptyStateCopy.get(route) ?? [];
  const missing = expected.filter((value) => !text.includes(value));
  if (missing.length > 0) {
    throw new Error(
      `${route} did not render the expected authenticated empty-state copy: ${missing.join(", ")}. ` +
        "Use a dedicated signed-in Clerk/Convex profile with no app data for this smoke.",
    );
  }
}

async function gotoSettled(page, route) {
  await page.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  const bodyText = await waitForShellToSettle(page);
  assertNoErrorBoundary(bodyText, route);
  assertNoForbiddenStrings(bodyText, route);
  assertExpectedEmptyState(bodyText, route);
}

const context = await launchAuthenticatedSmokeContext(authSmokeConfig);
const page = context.pages()[0] ?? await context.newPage();

try {
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await ensureAuthenticatedSmokeSession(page, authSmokeConfig, { readBodyText });

  for (const route of routes) {
    await gotoSettled(page, route);
    console.log(`✓ ${route} has authenticated empty-state copy and no demo/mock copy`);
  }

  console.log("Authenticated empty-state smoke passed.");
} finally {
  await context.close();
}
