import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

export const defaultAuthSmokeBaseUrl = "http://localhost:3100";
export const defaultAuthSmokeProfile = path.join(repoRoot, ".coach-dev", "auth-smoke-profile");

export function createAuthSmokeSessionConfig({
  baseUrl = process.env.SMOKE_BASE_URL || defaultAuthSmokeBaseUrl,
  command,
  name = "Authenticated smoke",
} = {}) {
  return {
    baseUrl,
    command,
    headless: process.env.AUTH_SMOKE_HEADFUL === "1" ? false : true,
    name,
    userDataDir: process.env.AUTH_SMOKE_PROFILE || defaultAuthSmokeProfile,
  };
}

export function assertAuthenticatedSmokeTarget({ baseUrl, command }) {
  const parsedUrl = new URL(baseUrl);
  const expectedUrl = defaultAuthSmokeBaseUrl;
  const commandHint = command ? `SMOKE_BASE_URL=${expectedUrl} ${command}` : `SMOKE_BASE_URL=${expectedUrl}`;

  if (parsedUrl.hostname !== "localhost") {
    throw new Error(
      [
        "Authenticated smoke must run against localhost.",
        `Current SMOKE_BASE_URL is ${baseUrl}.`,
        `Use the normal authenticated dev server: ${commandHint}`,
      ].join("\n"),
    );
  }

  if (parsedUrl.port === "3103") {
    throw new Error(
      [
        "Authenticated smoke is pointing at port 3103, which is reserved for demo smoke with auth disabled.",
        "Start the normal authenticated dev server with `npm run dev:coach:bg`, then run:",
        commandHint,
      ].join("\n"),
    );
  }

  if (parsedUrl.port !== "3100") {
    throw new Error(
      [
        "Authenticated smoke must run on localhost:3100.",
        `Current SMOKE_BASE_URL is ${baseUrl}.`,
        `Start the normal authenticated dev server with \`npm run dev:coach:bg\`, then run: ${commandHint}`,
      ].join("\n"),
    );
  }
}

export async function launchAuthenticatedSmokeContext(config) {
  assertAuthenticatedSmokeTarget(config);

  if (config.headless && !fs.existsSync(config.userDataDir)) {
    throw new Error(signInInstructions(config, "No persistent Playwright auth profile was found."));
  }

  return chromium.launchPersistentContext(config.userDataDir, {
    headless: config.headless,
    viewport: { width: 1440, height: 1000 },
  });
}

export function hasAuthenticatedPlanContext(bodyText) {
  return bodyText.includes("Plano semanal\nAtivo") || bodyText.includes("Plano semanal\nSem plano ativo");
}

export function isUnauthenticatedBody(bodyText) {
  return (
    /(^|\n)Entrar(\n|$)/.test(bodyText) ||
    bodyText.includes("Sign in") ||
    bodyText.includes("Sign up") ||
    bodyText.includes("Entra para preparar a tua semana") ||
    !hasAuthenticatedPlanContext(bodyText)
  );
}

export async function ensureAuthenticatedSmokeSession(page, config, { readBodyText }) {
  const bodyText = await waitForAuthGateToSettle(page, { readBodyText });

  if (!isUnauthenticatedBody(bodyText)) return;

  if (!config.headless) {
    await openSignInModal(page, config);

    console.log(
      "Sign in through the opened browser. The smoke will continue after authenticated context loads.",
    );
    await waitForAuthenticatedContext(page, config);
    return;
  }

  throw new Error(signInInstructions(config, "The Clerk session is missing, expired, or invalid."));
}

async function openSignInModal(page, config) {
  const signInButton = page.getByRole("button", { name: "Entrar" });
  const signInText = page.getByText("Entrar", { exact: true });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await isClerkSignInVisible(page)) {
      return;
    }

    if ((await signInButton.count()) > 0) {
      await signInButton.first().click();
      return;
    }

    if ((await signInText.count()) > 0) {
      await signInText.first().click();
      return;
    }

    await page.waitForTimeout(1_000);
  }

  throw new Error(
    signInInstructions(
      config,
      "The app is signed out, but the Clerk sign-in control was not visible.",
    ),
  );
}

async function waitForAuthGateToSettle(page, { readBodyText }) {
  const deadline = Date.now() + 20_000;
  let lastBodyText = await readBodyText(page);

  while (Date.now() < deadline) {
    if (hasAuthenticatedPlanContext(lastBodyText)) return lastBodyText;

    if (
      /(^|\n)Entrar(\n|$)/.test(lastBodyText) ||
      lastBodyText.includes("Entra para preparar a tua semana") ||
      lastBodyText.includes("Sign in") ||
      lastBodyText.includes("Sign up")
    ) {
      return lastBodyText;
    }

    await page.waitForTimeout(500);
    lastBodyText = await readBodyText(page).catch(() => lastBodyText);
  }

  return lastBodyText;
}

async function isClerkSignInVisible(page) {
  return (
    (await page.getByText("Sign in to Coach AI Poker Planner", { exact: false }).count()) > 0 ||
    (await page.getByText("Sign in", { exact: false }).count()) > 0 ||
    (await page.getByText("Sign up", { exact: false }).count()) > 0
  );
}

async function waitForAuthenticatedContext(page, config) {
  const deadline = Date.now() + 300_000;

  while (Date.now() < deadline) {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    const pageUrl = page.url();

    if (hasAuthenticatedPlanContext(bodyText)) return;

    if (isGooglePlaywrightBlocked(pageUrl, bodyText)) {
      throw new Error(
        [
          "Google sign-in rejected the Playwright browser.",
          "This is an OAuth/provider limitation, not an app bug.",
          "Use email/password in the Clerk modal for this smoke profile, or validate sign-in manually in a normal/private browser.",
          `Profile path: ${config.userDataDir}`,
        ].join("\n"),
      );
    }

    await page.waitForTimeout(1_000);
  }

  throw new Error(signInInstructions(config, "Timed out waiting for authenticated Clerk context."));
}

function isGooglePlaywrightBlocked(pageUrl, bodyText) {
  return (
    pageUrl.includes("accounts.google.com") &&
    bodyText.includes("Couldn't sign you in") &&
    bodyText.includes("This browser or app may not be secure")
  );
}

function signInInstructions(config, reason) {
  const baseUrl = config.baseUrl || defaultAuthSmokeBaseUrl;
  const command = config.command || "npm run smoke:coach:auth";

  return [
    `${config.name || "Authenticated smoke"} requires a valid Clerk session.`,
    reason,
    "",
    `Profile path: ${config.userDataDir}`,
    "",
    "Run this once and sign in through the opened browser:",
    `AUTH_SMOKE_HEADFUL=1 SMOKE_BASE_URL=${baseUrl} ${command}`,
    "",
    "Close the browser after the app is authenticated, then rerun headless:",
    `SMOKE_BASE_URL=${baseUrl} ${command}`,
    "",
    "If the stored session is stale, delete the profile directory intentionally and repeat the headful login.",
  ].join("\n");
}
