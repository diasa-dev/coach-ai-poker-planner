import assert from "node:assert";
import { chromium } from "playwright";

const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3103";

async function waitText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({
    state: "visible",
    timeout: 20_000,
  });
}

async function smoke() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}/coach`, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  await waitText(page, "Rever proposta");

  // Give React/Clerk-free dev mode one tick to hydrate before clicking.
  await page.waitForTimeout(500);

  await page.getByRole("button", { name: "Rever proposta" }).click();
  await waitText(page, "Quinta · 09:00 · Estudo · ICM");
  await waitText(page, "Sexta · 09:00 · Estudo · Open ranges");
  await waitText(page, "Sábado · 09:00 · Estudo · Bluff catch");

  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByRole("button", { name: "Eliminar bloco 2" }).waitFor({
    state: "visible",
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Eliminar bloco 2" }).click();
  await waitText(page, "Plano da semana 18 (2 alterações)");
  await page.locator('input[value="ICM"]').waitFor({
    state: "visible",
    timeout: 20_000,
  });
  assert.strictEqual(await page.locator('input[value="Open ranges"]').count(), 0);

  await page.getByRole("button", { name: "Concluir edição" }).click();
  await waitText(page, "2 blocos selecionados");
  await waitText(page, "Quinta · 09:00 · Estudo · ICM");
  await waitText(page, "Sábado · 09:00 · Estudo · Bluff catch");
  assert.strictEqual(await page.getByText("Sexta · 09:00 · Estudo · Open ranges").count(), 0);

  await page.getByRole("button", { name: "Aplicar alteração" }).click();
  await waitText(page, "Aplicar 2 alterações ao plano?");
  await page.getByRole("button", { name: "Cancelar" }).click();
  await waitText(page, "2 blocos selecionados");

  await page.getByRole("button", { name: "Aplicar alteração" }).click();
  await page.getByRole("button", { name: "Sim, aplicar" }).click();
  await waitText(page, "Alteração aplicada ao plano");
  await waitText(page, "Plano da semana 18 (2 alterações)");
  await page.getByRole("button", { name: /Anular \(\d+s\)/ }).waitFor({
    state: "visible",
    timeout: 20_000,
  });
  await page.getByRole("button", { name: /Anular/ }).click();
  await waitText(page, "2 blocos selecionados");

  for (const path of ["/", "/weekly", "/sessions", "/review", "/session/review", "/session/prepare", "/session/live"]) {
    await page.goto(`${baseUrl}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    });
    await page.locator("body").waitFor({ state: "visible", timeout: 10_000 });
    const bodyText = await page.locator("body").innerText();

    if (bodyText.includes("This page couldn") || bodyText.includes("couldn’t load")) {
      throw new Error(`${path} rendered the error boundary`);
    }
  }

  const blockingErrors = consoleErrors.filter(
    (entry) =>
      !entry.includes("Download the React DevTools") &&
      !entry.includes("webpack-hmr"),
  );

  if (blockingErrors.length) {
    throw new Error(blockingErrors.join("\n"));
  }

  await browser.close();
  console.log("SMOKE_OK coach proposal flow and adjacent routes");
}

smoke().catch((error) => {
  console.error(error);
  process.exit(1);
});
