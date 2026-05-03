"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useMemo } from "react";
import { isAuthDisabledForSmoke } from "@/lib/runtime-config";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function AppProviders({ children }: { children: ReactNode }) {
  if (isAuthDisabledForSmoke || !clerkPublishableKey) {
    return children;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {convexUrl ? (
        <ConvexClerkProvider convexUrl={convexUrl}>{children}</ConvexClerkProvider>
      ) : (
        children
      )}
    </ClerkProvider>
  );
}

function ConvexClerkProvider({
  children,
  convexUrl,
}: {
  children: ReactNode;
  convexUrl: string;
}) {
  const convex = useMemo(() => new ConvexReactClient(convexUrl), [convexUrl]);

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
