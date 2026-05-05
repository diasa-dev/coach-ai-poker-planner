import assert from "node:assert";
import {
  createAuthSmokeSessionConfig,
  ensureAuthenticatedSmokeSession,
  launchAuthenticatedSmokeContext,
} from "./auth-smoke-session.mjs";

const authSmokeConfig = createAuthSmokeSessionConfig({
  command: "npm run smoke:mvp:auth",
  name: "Authenticated MVP smoke",
});
const { baseUrl } = authSmokeConfig;

const smokeRunId = `Smoke MVP ${new Date().toISOString()}`;

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

  if (
    text.includes("This page couldn") ||
    text.includes("couldn’t load") ||
    text.includes("Reload to try again")
  ) {
    throw new Error(`${route} rendered the error boundary`);
  }
}

async function gotoApp(page, route) {
  await page.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  await waitForShellToSettle(page);
  await assertNoErrorBoundary(page, route);
}

async function waitForShellToSettle(page) {
  const deadline = Date.now() + 20_000;
  let bodyText = await readBodyText(page);

  while (Date.now() < deadline) {
    if (!bodyText.includes("A preparar entrada")) return;

    await page.waitForTimeout(500);
    bodyText = await readBodyText(page).catch(() => bodyText);
  }
}

async function assertAuthenticated(page) {
  await ensureAuthenticatedSmokeSession(page, authSmokeConfig, { readBodyText });
}

async function clearActiveCoachApplicationIfPossible(page) {
  await gotoApp(page, "/coach");
  const undoButton = page.getByRole("button", { name: /Anular \(\d+s\)/ });

  if ((await undoButton.count()) === 0) return false;

  await undoButton.first().click();
  await page.getByRole("button", { name: /Anular/ }).waitFor({
    state: "hidden",
    timeout: 20_000,
  });
  await page.locator(".ep-coach-proposal-row").first().waitFor({
    state: "visible",
    timeout: 20_000,
  });

  return true;
}

async function ensureStudyMonthlyTarget(page) {
  await gotoApp(page, "/monthly");
  await waitText(page, "Objetivos mensais");

  const editButtons = page.getByRole("button", { name: /Editar categoria/ });
  await editButtons.nth(1).waitFor({ state: "visible", timeout: 20_000 });
  await editButtons.nth(1).click();
  await waitText(page, "A editar");

  const targetInput = page.getByLabel("Objetivo", { exact: true });
  await targetInput.fill("4");
  await page.getByRole("button", { name: "Guardar categoria" }).click();
  await waitText(page, "Estudo");
  await waitText(page, "4h");
}

async function hasWeeklyStudyRegistrationLink(page) {
  await gotoApp(page, "/weekly");
  await waitText(page, "Planear semana");

  return (await page.getByRole("link", { name: "Registar estudo" }).count()) > 0;
}

async function applyCoachProposalForStudyBlocks(page) {
  await clearActiveCoachApplicationIfPossible(page);
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

async function ensureWeeklyStudyBlock(page) {
  if (await hasWeeklyStudyRegistrationLink(page)) return "existing";

  await applyCoachProposalForStudyBlocks(page);

  if (!(await hasWeeklyStudyRegistrationLink(page))) {
    throw new Error("MVP smoke could not find or create a valid Weekly Study block.");
  }

  return "coach-proposal";
}

async function expectSelectedWeeklyBlock(select) {
  const selected = await select.evaluate(
    (element) => element.options[element.selectedIndex]?.textContent?.trim() ?? "",
  );

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
  await page.getByLabel("Nota (opcional)").fill(`${smokeRunId}: estudo ligado ao plano semanal.`);
  await page.getByRole("button", { name: "Guardar registo" }).click();
  await waitText(page, "Marcar bloco como feito?");
  await page.getByRole("button", { name: "Marcar como feito" }).click();
  await waitText(page, "Registo guardado.");
}

async function ensureTodayPreparedAndDone(page) {
  await gotoApp(page, "/");
  await waitText(page, "Compromissos de hoje");
  await waitText(page, "Ritmo mensal");

  const commitmentsCard = page.locator(".today-commitments-card");

  if ((await commitmentsCard.getByRole("button", { name: "Feito" }).count()) === 0) {
    await page.getByRole("button", { name: /Preparar dia|Editar dia/ }).first().click();
    await waitText(page, "Preparar dia");
    await page.getByLabel("Adicionar compromisso (opcional)").fill(`${smokeRunId}: compromisso mínimo`);
    await page.getByRole("button", { name: "Confirmar dia" }).click();
    await commitmentsCard.getByRole("button", { name: "Feito" }).first().waitFor({
      state: "visible",
      timeout: 20_000,
    });
  }

  await commitmentsCard.getByRole("button", { name: "Feito" }).first().click();
  await page.getByText("A guardar", { exact: false }).waitFor({
    state: "hidden",
    timeout: 20_000,
  }).catch(() => undefined);
  await waitText(page, "Feito");
}

async function saveMinimalWeeklyReview(page) {
  await gotoApp(page, "/review");
  await waitText(page, "Contexto de estudo da semana");
  await waitText(page, "Ligado ao plano");
  await waitText(page, "Direção anual e objetivos mensais");

  await page.getByRole("button", { name: "Guardar revisão" }).click();
  await waitText(page, "Revisão guardada.");
}

async function assertMvpContextSurfaces(page) {
  await gotoApp(page, "/monthly");
  await waitText(page, "Objetivos mensais");
  await waitText(page, "Estudo");

  await gotoApp(page, "/weekly");
  await waitText(page, "Plano semanal");
  await page.locator('i[aria-label="Feito"]').first().waitFor({
    state: "visible",
    timeout: 20_000,
  });

  await gotoApp(page, "/");
  await waitText(page, "Compromissos de hoje");
  await waitText(page, "Ritmo mensal");

  await gotoApp(page, "/review");
  await waitText(page, "Contexto de estudo da semana");
  await waitText(page, "Ligado ao plano");

  await gotoApp(page, "/coach");
  await waitText(page, "Contexto usado");
  await waitText(page, "Objetivos mensais");
  await waitText(page, "Registo de estudo");
  await waitText(page, "Sinais de estudo");
  await waitText(page, "Revisão semanal");
  await waitText(page, "Concluída");
}

async function smoke() {
  const context = await launchAuthenticatedSmokeContext(authSmokeConfig);
  const page = context.pages()[0] ?? (await context.newPage());
  const consoleErrors = [];
  const cleanupNotes = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await gotoApp(page, "/coach");
    await assertAuthenticated(page);
    await ensureStudyMonthlyTarget(page);

    const studyBlockSource = await ensureWeeklyStudyBlock(page);
    await saveLinkedStudyLog(page);
    await ensureTodayPreparedAndDone(page);
    await saveMinimalWeeklyReview(page);
    await assertMvpContextSurfaces(page);

    const cleaned = await clearActiveCoachApplicationIfPossible(page).catch((error) => {
      cleanupNotes.push(`Coach proposal cleanup skipped: ${error.message}`);
      return false;
    });

    if (!cleaned && studyBlockSource === "coach-proposal") {
      cleanupNotes.push(
        "Coach proposal undo was not available; local/dev Weekly Plan mutations are expected for this smoke.",
      );
    }

    const blockingErrors = consoleErrors.filter(
      (entry) => !ignoredConsoleErrorFragments.some((fragment) => entry.includes(fragment)),
    );

    assert.deepStrictEqual(blockingErrors, []);
  } finally {
    await context.close();
  }

  for (const note of cleanupNotes) {
    console.warn(note);
  }
  console.log("SMOKE_OK authenticated MVP integrated persisted loop");
}

smoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
