"use client";

import { useUser } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";

const PERSISTENCE_AUTH_TIMEOUT_MS = 8000;

type PersistenceAuthState =
  | { kind: "loading"; isReady: false; isSignedIn: false; firstName?: string }
  | { kind: "signed-out"; isReady: false; isSignedIn: false; firstName?: string }
  | { kind: "ready"; isReady: true; isSignedIn: true; firstName?: string }
  | { kind: "unavailable"; isReady: false; isSignedIn: true; firstName?: string };

export function usePersistenceAuth(): PersistenceAuthState {
  const { isLoaded, isSignedIn, user } = useUser();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const firstName = user?.firstName ?? undefined;
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isLoading) return;

    const timeoutId = window.setTimeout(() => setLoadingTimedOut(true), PERSISTENCE_AUTH_TIMEOUT_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isLoaded, isLoading, isSignedIn]);

  if (isLoaded && isSignedIn && isLoading && loadingTimedOut) {
    return { kind: "unavailable", isReady: false, isSignedIn: true, firstName };
  }

  if (!isLoaded || isLoading) {
    return { kind: "loading", isReady: false, isSignedIn: false, firstName };
  }

  if (!isSignedIn) {
    return { kind: "signed-out", isReady: false, isSignedIn: false, firstName };
  }

  if (isAuthenticated) {
    return { kind: "ready", isReady: true, isSignedIn: true, firstName };
  }

  return { kind: "unavailable", isReady: false, isSignedIn: true, firstName };
}

export function getSignedInPersistenceMessage(featureName: string) {
  return `Sessão ativa, mas ainda não conseguimos ligar os dados reais de ${featureName}. Verifica a configuração Clerk/Convex antes de usar esta área.`;
}
