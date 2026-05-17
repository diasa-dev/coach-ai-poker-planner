import { readFileSync } from "node:fs";

const shell = readFileSync("src/components/uplinea-shell.tsx", "utf8");
const persistenceAuth = readFileSync("src/lib/persistence-auth.ts", "utf8");
const today = readFileSync("src/components/today-execution.tsx", "utf8");

const checks = [
  {
    name: "shell auth loading has a timeout constant",
    pass: shell.includes("AUTH_LOADING_TIMEOUT_MS") && shell.includes("useLoadingTimeout(!isLoaded)"),
  },
  {
    name: "shell auth loading renders recovery instead of infinite spinner after timeout",
    pass: shell.includes("authLoadingTimedOut") && shell.includes("<AuthRecoveryScreen />"),
  },
  {
    name: "Convex auth loading degrades to unavailable after timeout",
    pass:
      persistenceAuth.includes("PERSISTENCE_AUTH_TIMEOUT_MS") &&
      persistenceAuth.includes("isLoaded && isSignedIn && isLoading && loadingTimedOut") &&
      persistenceAuth.includes('kind: "unavailable"'),
  },
  {
    name: "Today no longer blocks on undefined data queries",
    pass:
      today.includes('if (auth.kind === "loading")') &&
      !today.includes("weeklyPlan === undefined ||") &&
      !today.includes("preparedDay === undefined ||") &&
      !today.includes("monthlyTargets === undefined ||") &&
      !today.includes("annualPlan === undefined"),
  },
];

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.pass ? "✓" : "✗"} ${check.name}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}
