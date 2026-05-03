export const isAuthDisabledForSmoke =
  process.env.NEXT_PUBLIC_UPLINEA_DISABLE_AUTH === "1" ||
  process.env.NEXT_PUBLIC_UPLINEA_DISABLE_AUTH === "true";

export const hasPersistenceConfig = Boolean(
  !isAuthDisabledForSmoke &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CONVEX_URL,
);

export const hasClerkConfig = Boolean(
  !isAuthDisabledForSmoke && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
