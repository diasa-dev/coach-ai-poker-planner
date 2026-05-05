import assert from "node:assert";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3100";
const headless = process.env.AUTH_SMOKE_HEADFUL === "1" ? false : true;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const userDataDir =
  process.env.AUTH_SMOKE_PROFILE || path.join(repoRoot, ".coach-dev", "auth-smoke-profile");

const ignoredConsoleErrorFragments = [
  "Download the React DevTools",
  "webpack-hmr",
  "The resource",
  "Failed to load resource: the server responded with a status of 404",
];

function signInInstructions() {
  return [
    "Authenticated smoke requires a Clerk session.",
    "",
    "Run this once and sign in through the opened browser:",
    `AUTH_SMOKE_HEADFUL=1 SMOKE_BASE_URL=${baseUrl} npm run smoke:coach:auth`,
    "",
    "Then close the browser and rerun:",
    `SMOKE_BASE_URL=${baseUrl} npm run smoke:coach:auth`,
  ].join("\n");
}

function assertAuthenticatedSmokeTarget() {
  const parsedUrl = new URL(baseUrl);

  if (parsedUrl.hostname !== "localhost") {
    throw new Error(
      [
        "Authenticated smoke must run against localhost.",
        `Current SMOKE_BASE_URL is ${baseUrl}.`,
        "Use the normal authenticated dev server, for example: SMOKE_BASE_URL=http://localhost:3100 npm run smoke:coach:auth",
      ].join("\n"),
    );
  }

  if (parsedUrl.port === "3103") {
    throw new Error(
      [
        "Authenticated smoke is pointing at port 3103, which is reserved for demo smoke with auth disabled.",
        "Start the normal authenticated dev server with `npm run dev:coach:bg`, then run:",
        "SMOKE_BASE_URL=http://localhost:3100 npm run smoke:coach:auth",
      ].join("\n"),
    );
  }
}

function isUnauthenticatedBody(bodyText) {
  return (
    /(^|\n)Entrar(\n|$)/.test(bodyText) ||
    bodyText.includes("Sign in") ||
    bodyText.includes("Sign up") ||
    bodyText.includes("Entra para preparar a tua semana") ||
    !hasAuthenticatedPlanContext(bodyText)
  );
}

function hasAuthenticatedPlanContext(bodyText) {
  return bodyText.includes("Plano semanal\nAtivo") || bodyText.includes("Plano semanal\nSem plano ativo");
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
  const bodyText = await readBodyText(page);

  if (isUnauthenticatedBody(bodyText)) {
    if (!headless) {
      await openSignInModal(page);

      console.log("Sign in through the opened browser. The smoke will continue after authenticated context loads.");
      await waitForAuthenticatedContext(page);
      return;
    }

    throw new Error(signInInstructions());
  }
}

async function openSignInModal(page) {
  const signInButton = page.getByRole("button", { name: "Entrar" });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if ((await page.getByText("Sign in to Coach AI Poker Planner", { exact: false }).count()) > 0) {
      return;
    }

    if ((await signInButton.count()) > 0) {
      await signInButton.first().click();
    }

    await page.waitForTimeout(1_000);
  }

  await page.getByText("Sign in to Coach AI Poker Planner", { exact: false }).first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function waitForAuthenticatedContext(page) {
  const deadline = Date.now() + 300_000;

  while (Date.now() < deadline) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const pageUrl = page.url();

    if (hasAuthenticatedPlanContext(bodyText)) return;

    if (
      pageUrl.includes("accounts.google.com") &&
      bodyText.includes("Couldn't sign you in") &&
      bodyText.includes("This browser or app may not be secure")
    ) {
      throw new Error(
        [
          "Google sign-in rejected the Playwright browser.",
          "This is an OAuth/provider limitation, not an app bug.",
          "Use email/password in the Clerk modal for this smoke profile, or validate sign-in manually in a normal/private browser.",
        ].join("\n"),
      );
    }

    await page.waitForTimeout(1_000);
  }

  throw new Error("Timed out waiting for authenticated Clerk context.");
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

async function smoke() {
  assertAuthenticatedSmokeTarget();

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    viewport: { width: 1440, height: 1000 },
  });
  const page = context.pages()[0] ?? (await context.newPage());
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await gotoApp(page, "/coach");
    await assertAuthenticatedCoach(page);
    await waitText(page, "Rever proposta");
    await clearActiveApplicationIfNeeded(page);
    await applyCoachProposal(page);

    await gotoApp(page, "/weekly");
    await page.locator(".ep-origin-badge", { hasText: "Coach" }).first().waitFor({
      state: "visible",
      timeout: 20_000,
    });

    await gotoApp(page, "/");

    await gotoApp(page, "/coach");
    const undoButton = page.getByRole("button", { name: /Anular \(\d+s\)/ });

    if ((await undoButton.count()) === 0) {
      throw new Error("Undo window expired before authenticated smoke could clean up.");
    }

    await undoButton.first().click();
    await waitText(page, "Rever proposta");

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
