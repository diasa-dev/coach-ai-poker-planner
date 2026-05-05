import assert from "node:assert";
import {
  createAuthSmokeSessionConfig,
  ensureAuthenticatedSmokeSession,
  launchAuthenticatedSmokeContext,
} from "./auth-smoke-session.mjs";

const authSmokeConfig = createAuthSmokeSessionConfig({
  command: "npm run smoke:coach:auth",
  name: "Authenticated Coach smoke",
});
const { baseUrl } = authSmokeConfig;

const ignoredConsoleErrorFragments = [
  "Download the React DevTools",
  "webpack-hmr",
  "The resource",
  "Failed to load resource: the server responded with a status of 404",
];

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

async function readBodyText(page) {
  await page.locator("body").waitFor({ state: "visible", timeout: 20_000 });
  return page.locator("body").innerText();
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
  await assertNoErrorBoundary(page, route);
}

async function assertAuthenticatedCoach(page) {
  await ensureAuthenticatedSmokeSession(page, authSmokeConfig, { readBodyText });
}

async function clearActiveApplicationIfNeeded(page) {
  const undoButton = page.getByRole("button", { name: /Anular \(\d+s\)/ });

  if ((await undoButton.count()) === 0) return;

  await undoButton.first().click();
  await waitText(page, "Rever proposta");
}

async function applyCoachProposal(page) {
  // Give the authenticated shell a moment to hydrate before exercising controls.
  await page.waitForTimeout(750);
  await page.getByRole("button", { name: "Rever proposta" }).click();
  await page.locator(".ep-coach-proposal-row").first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
  assert.strictEqual(await page.locator(".ep-coach-proposal-row").count(), 3);

  await page.getByRole("button", { name: "Aplicar alteração" }).click();
  await waitText(page, "Aplicar 3 alterações ao plano?");
  await page.getByRole("button", { name: "Sim, aplicar" }).click();
  await waitText(page, "Alteração aplicada ao plano");
  await waitTextPattern(page, /Plano .*\(3 alterações\)/);
  await page.getByRole("button", { name: /Anular \(\d+s\)/ }).waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function waitForCoachCleanupState(page) {
  await page.getByRole("button", { name: /Anular/ }).waitFor({
    state: "hidden",
    timeout: 20_000,
  });
  await page.locator(".ep-coach-proposal-row").first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Aplicar alteração" }).waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function smoke() {
  const context = await launchAuthenticatedSmokeContext(authSmokeConfig);
  const page = context.pages()[0] ?? (await context.newPage());
  const verificationPage = await context.newPage();
  const consoleErrors = [];

  for (const smokePage of [page, verificationPage]) {
    smokePage.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    smokePage.on("pageerror", (error) => consoleErrors.push(error.message));
  }

  try {
    await gotoApp(page, "/coach");
    await assertAuthenticatedCoach(page);
    await waitText(page, "Rever proposta");
    await clearActiveApplicationIfNeeded(page);
    await applyCoachProposal(page);

    await gotoApp(verificationPage, "/weekly");
    await verificationPage.locator(".ep-origin-badge", { hasText: "Coach" }).first().waitFor({
      state: "visible",
      timeout: 20_000,
    });

    const undoButton = page.getByRole("button", { name: /Anular \(\d+s\)/ });

    if ((await undoButton.count()) === 0) {
      throw new Error(
        "Authenticated smoke cleanup could not find the Coach undo button after verifying the Weekly badge. The undo window may have expired, the Coach page may have lost active proposal state, or the apply step did not expose cleanup.",
      );
    }

    await undoButton.first().click();
    await waitForCoachCleanupState(page);

    await gotoApp(verificationPage, "/");

    const blockingErrors = consoleErrors.filter(
      (entry) => !ignoredConsoleErrorFragments.some((fragment) => entry.includes(fragment)),
    );

    assert.deepStrictEqual(blockingErrors, []);
  } finally {
    await context.close();
  }

  console.log("SMOKE_OK authenticated coach proposal apply weekly badge today load undo");
}

smoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
