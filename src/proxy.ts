import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isTemporaryProductionDevClerk = Boolean(
  process.env.VERCEL_ENV === "production" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_"),
);

const hasClerkKeys = Boolean(
  process.env.UPLINEA_DISABLE_AUTH !== "1" &&
    process.env.NEXT_PUBLIC_UPLINEA_DISABLE_AUTH !== "1" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY &&
    !isTemporaryProductionDevClerk,
);
const shouldCanonicalizeLocalhost = Boolean(
  process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_"),
);

function canonicalizeLocalDevelopmentHost(request: Request) {
  if (!shouldCanonicalizeLocalhost) {
    return null;
  }

  const url = new URL(request.url);
  if (url.hostname !== "127.0.0.1") {
    return null;
  }

  url.hostname = "localhost";
  return NextResponse.redirect(url);
}

export default hasClerkKeys
  ? clerkMiddleware((_, request) => canonicalizeLocalDevelopmentHost(request) ?? NextResponse.next())
  : (request: Request) => canonicalizeLocalDevelopmentHost(request) ?? NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
