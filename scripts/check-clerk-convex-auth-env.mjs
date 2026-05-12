#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const envPath = join(root, ".env.local");

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim();
    const quoted = value.match(/^(['"])(.*)\1$/);
    env[key] = (quoted ? quoted[2] : value.replace(/\s+#.*$/, "")).trim();
  }
  return env;
}

function decodeClerkPublishableDomain(key) {
  if (!key) return undefined;
  const encoded = key.split("_").slice(2).join("_");
  if (!encoded) return undefined;
  const decoded = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
  return decoded || undefined;
}

function normalizeDomain(value) {
  return value?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function convexDeploymentName(value) {
  return value?.trim().split(/\s+/)[0]?.replace(/^(dev|prod):/, "");
}

const localEnv = { ...parseEnvFile(envPath), ...process.env };
const authDisabled =
  localEnv.UPLINEA_DISABLE_AUTH === "1" ||
  localEnv.NEXT_PUBLIC_UPLINEA_DISABLE_AUTH === "1" ||
  localEnv.NEXT_PUBLIC_UPLINEA_DISABLE_AUTH === "true";
const clerkDomain = normalizeDomain(decodeClerkPublishableDomain(localEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY));
const localIssuer = normalizeDomain(localEnv.CLERK_JWT_ISSUER_DOMAIN);
const convexUrlDomain = normalizeDomain(localEnv.NEXT_PUBLIC_CONVEX_URL);
const convexDeployment = convexDeploymentName(localEnv.CONVEX_DEPLOYMENT);

const failures = [];

if (authDisabled) {
  console.log("Clerk/Convex auth environment check skipped: auth is disabled for this process.");
  process.exit(0);
}

if (!clerkDomain) {
  failures.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or could not be decoded.");
}

if (!localEnv.CLERK_SECRET_KEY) {
  failures.push("CLERK_SECRET_KEY is missing from .env.local/process env.");
}

if (!localIssuer) {
  failures.push("CLERK_JWT_ISSUER_DOMAIN is missing from .env.local/process env.");
} else if (clerkDomain && localIssuer !== clerkDomain) {
  failures.push(`Local CLERK_JWT_ISSUER_DOMAIN (${localIssuer}) does not match Clerk publishable key domain (${clerkDomain}).`);
}

if (!convexUrlDomain) {
  failures.push("NEXT_PUBLIC_CONVEX_URL is missing from .env.local/process env.");
} else if (!convexUrlDomain.endsWith(".convex.cloud")) {
  failures.push("NEXT_PUBLIC_CONVEX_URL must point to a convex.cloud deployment.");
}

if (!convexDeployment) {
  failures.push("CONVEX_DEPLOYMENT is missing from .env.local/process env.");
} else if (convexUrlDomain && !convexUrlDomain.startsWith(`${convexDeployment}.`)) {
  failures.push("CONVEX_DEPLOYMENT does not match NEXT_PUBLIC_CONVEX_URL deployment name.");
}

if (process.env.SKIP_CONVEX_ENV_CHECK !== "1") {
  try {
    const output = execFileSync("npx", ["convex", "env", "list"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const match = output.match(/^CLERK_JWT_ISSUER_DOMAIN=(.+)$/m);
    const convexIssuer = normalizeDomain(match?.[1]);
    if (!convexIssuer) {
      failures.push("Convex env CLERK_JWT_ISSUER_DOMAIN is missing.");
    } else if (clerkDomain && convexIssuer !== clerkDomain) {
      failures.push(`Convex CLERK_JWT_ISSUER_DOMAIN (${convexIssuer}) does not match Clerk publishable key domain (${clerkDomain}).`);
    }
  } catch (error) {
    failures.push(`Could not read Convex env via CLI: ${error.message}`);
  }
}

if (failures.length) {
  console.error("Clerk/Convex auth environment mismatch:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Clerk/Convex auth environment OK: ${clerkDomain}`);
