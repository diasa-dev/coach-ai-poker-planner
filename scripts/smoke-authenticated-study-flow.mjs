import assert from "node:assert";
import {
  createAuthSmokeSessionConfig,
  ensureAuthenticatedSmokeSession,
  launchAuthenticatedSmokeContext,
} from "./auth-smoke-session.mjs";

const authSmokeConfig = createAuthSmokeSessionConfig({
  command: "npm run smoke:study:auth",
  name: "Authenticated Study smoke",
});
const { baseUrl } = authSmokeConfig;

const ignoredConsoleErrorFragments = [
  "Download the React DevTools",
  "webpack-hmr",
  "The resource",
  "Failed to load resource: the server responded with a status of 404",
];

async function readBodyText(page) {
  await page.locator("body").waitFor({ state: "visible", timeout: 20_000 });
  return page.locator("body").innerText();
}

async function waitText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function waitTextPattern(page, pattern) {
  await page.getByText(pattern).first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function assertNoErrorBoundary(page, route) {
  const text = await readBodyText(page);

  if (text.includes("This page couldn") || text.includes("couldn’t load") || text.includes("Reload to try again")) {
    throw new Error(`${route} rendered the error boundary`);
  }
}

async function gotoApp(page, route) {
  await page.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  await assertNoErrorBoundary(page, route);
}

async function assertAuthenticated(page) {
  await ensureAuthenticatedSmokeSession(page, authSmokeConfig, { readBodyText });
}

async function clearActiveApplicationIfNeeded(page) {
  await gotoApp(page, "/coach");
  const undoButton = page.getByRole("button", { name: /Anular \(\d+s\)/ });

  if ((await undoButton.count()) === 0) return;

  await undoButton.first().click();
  await page.getByRole("button", { name: /Anular/ }).waitFor({
    state: "hidden",
    timeout: 20_000,
  });
  await page.locator(".ep-coach-proposal-row").first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function applyStudySetupProposal(page) {
  await gotoApp(page, "/coach");
  await waitText(page, "Rever proposta");
  await page.getByRole("button", { name: "Rever proposta" }).click();
  await page.locator(".ep-coach-proposal-row").first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Aplicar alteração" }).click();
  await waitTextPattern(page, /Aplicar \d+ alterações ao plano\?/);
  await page.getByRole("button", { name: "Sim, aplicar" }).click();
  await waitText(page, "Alteração aplicada ao plano");
}

async function expectSelectedWeeklyBlock(select) {
  const selected = await select.evaluate((element) => element.options[element.selectedIndex]?.textContent?.trim() ?? "");

  assert.notStrictEqual(selected, "");
  assert.notStrictEqual(selected, "Sem bloco");
}

async function saveLinkedStudyLog(page) {
  await gotoApp(page, "/weekly");
  const studyLink = page.getByRole("link", { name: "Registar estudo" }).first();
  await studyLink.waitFor({ state: "visible", timeout: 20_000 });
  await studyLink.click();

  await waitText(page, "Registar estudo");
  await expectSelectedWeeklyBlock(page.getByLabel("Bloco semanal (opcional)"));

  await page.getByRole("button", { name: "Guardar registo" }).click();
  await waitText(page, "Marcar bloco como feito?");
  await page.getByRole("button", { name: "Marcar como feito" }).click();
  await waitText(page, "Registo guardado.");
}

async function assertStudyContextSurfaces(page) {
  await gotoApp(page, "/");
  await waitText(page, "Ritmo mensal");

  await gotoApp(page, "/monthly");
  await waitText(page, "Objetivos mensais");

  await gotoApp(page, "/review");
  await waitText(page, "Contexto de estudo da semana");
  await waitText(page, "Ligado ao plano");

  await gotoApp(page, "/coach");
  await waitText(page, "Registo de estudo");
  await waitText(page, "Sinais de estudo");
}

async function smoke() {
  const context = await launchAuthenticatedSmokeContext(authSmokeConfig);
  const page = context.pages()[0] ?? (await context.newPage());
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await gotoApp(page, "/coach");
    await assertAuthenticated(page);
    await clearActiveApplicationIfNeeded(page);
    await applyStudySetupProposal(page);
    await saveLinkedStudyLog(page);
    await assertStudyContextSurfaces(page);
    await clearActiveApplicationIfNeeded(page);

    const blockingErrors = consoleErrors.filter(
      (entry) => !ignoredConsoleErrorFragments.some((fragment) => entry.includes(fragment)),
    );

    assert.deepStrictEqual(blockingErrors, []);
  } finally {
    await context.close();
  }

  console.log("SMOKE_OK authenticated study flow linked log context surfaces");
}

smoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
