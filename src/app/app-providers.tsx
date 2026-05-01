"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useMemo } from "react";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function AppProviders({ children }: { children: ReactNode }) {
  if (!clerkPublishableKey || !convexUrl) {
    return children;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <ConvexClerkProvider convexUrl={convexUrl}>{children}</ConvexClerkProvider>
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
