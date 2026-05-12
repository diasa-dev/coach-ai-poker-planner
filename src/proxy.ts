import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
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
const isProtectedRoute = createRouteMatcher([
  "/",
  "/annual(.*)",
  "/coach(.*)",
  "/monthly(.*)",
  "/review(.*)",
  "/session(.*)",
  "/sessions(.*)",
  "/settings(.*)",
  "/study(.*)",
  "/weekly(.*)",
]);

export default hasClerkKeys
  ? clerkMiddleware(async (auth, request) => {
      if (isProtectedRoute(request)) {
        await auth.protect();
      }
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
