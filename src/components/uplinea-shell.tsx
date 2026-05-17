"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Compass,
  MessageSquareText,
  Moon,
  Play,
  Search,
  Settings,
  Sparkles,
  Spade,
  Sun,
  Target,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  buildPlanDaysFromStoredBlocks,
  getTodayIsoDate,
} from "@/lib/planning/weekly-plan";
import { SidebarStartSessionModal } from "@/components/start-session-form";
import { usePersistenceAuth } from "@/lib/persistence-auth";
import { hasClerkConfig, hasPersistenceConfig } from "@/lib/runtime-config";

const demoSessionCtaStorageKey = "uplinea-demo-session-cta-state";
const demoSessionsStorageKey = "uplinea-demo-sessions-state";
const demoSessionCtaEvent = "uplinea-demo-session-state-change";
const qaPreviewStorageKey = "uplinea-local-qa-preview";
const qaPreviewParam = "qa-preview";
const todayIsoDate = getTodayIsoDate();
const AUTH_LOADING_TIMEOUT_MS = 8000;

function useLoadingTimeout(enabled: boolean, timeoutMs = AUTH_LOADING_TIMEOUT_MS) {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const timeoutId = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timeoutId);
  }, [enabled, timeoutMs]);

  return enabled && timedOut;
}

function canUseLocalQaPreview() {
  if (typeof window === "undefined") return false;

  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.")
  );
}

function readLocalQaPreview(searchParams?: { get(name: string): string | null } | null) {
  if (typeof window === "undefined" || !canUseLocalQaPreview()) return false;

  if (searchParams?.get(qaPreviewParam) === "1") {
    window.localStorage.setItem(qaPreviewStorageKey, "1");
    return true;
  }

  if (searchParams?.get(qaPreviewParam) === "0") {
    window.localStorage.removeItem(qaPreviewStorageKey);
    return false;
  }

  return window.localStorage.getItem(qaPreviewStorageKey) === "1";
}

const navSections = [
  {
    label: "Principal",
    items: [{ href: "/", label: "Hoje", statusLabel: "cockpit diário", icon: Sun }],
  },
  {
    label: "Execução",
    items: [
      { href: "/sessions", label: "Sessões", statusLabel: "jogo e estudo", icon: Spade },
      { href: "/review", label: "Mãos/revisão", statusLabel: "pendentes", icon: MessageSquareText },
      { href: "/study", label: "Estudo", statusLabel: "blocos", icon: BookOpen },
    ],
  },
  {
    label: "Planeamento",
    items: [
      { href: "/weekly", label: "Plano semanal", statusLabel: "executar a semana", icon: CalendarDays },
      { href: "/monthly", label: "Objetivos mensais", statusLabel: "ritmo do mês", icon: Target },
      { href: "/annual", label: "Direção anual", statusLabel: "norte estratégico", icon: Compass },
    ],
  },
  {
    label: "Inteligência",
    items: [{ href: "/coach", label: "Coach AI", statusLabel: "contexto e ajustes", icon: Sparkles }],
  },
];

const navItems = navSections.flatMap((section) => section.items);

function AuthenticatedUplineaShell({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const authLoadingTimedOut = useLoadingTimeout(!isLoaded);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("uplinea-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";

    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle("dark-mode", theme === "dark");
  }, []);

  if (!isLoaded && authLoadingTimedOut) {
    return <AuthRecoveryScreen />;
  }

  if (!isLoaded) {
    return (
      <div className="ep-auth-screen">
        <span className="ep-auth-loading">A preparar entrada...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return <LoginScreen />;
  }

  const email = user.primaryEmailAddress?.emailAddress;
  const displayName = user.firstName ?? email ?? "Conta Uplinea";
  const initials = getProfileInitials(user.firstName, email);

  return (
    <UplineaShellFrame profile={{ displayName, initials, subtitle: "Conta ativa" }}>
      {children}
    </UplineaShellFrame>
  );
}

function getProfileInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "Uplinea";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "UP";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UplineaShell({ children }: { children: ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [localQaPreview, setLocalQaPreview] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setLocalQaPreview(readLocalQaPreview(new URLSearchParams(window.location.search)));
      setHasMounted(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!hasMounted) {
    return (
      <div className="ep-auth-screen">
        <span className="ep-auth-loading">A preparar entrada...</span>
      </div>
    );
  }

  if (localQaPreview) {
    return (
      <UplineaShellFrame
        forceDemoMode
        profile={{ displayName: "QA preview", initials: "QA", subtitle: "Sem login" }}
      >
        {children}
      </UplineaShellFrame>
    );
  }

  if (hasClerkConfig) {
    return <AuthenticatedUplineaShell>{children}</AuthenticatedUplineaShell>;
  }

  return <UplineaShellFrame>{children}</UplineaShellFrame>;
}

function UplineaShellFrame({
  children,
  profile = { displayName: "Modo local", initials: "UP", subtitle: "Demo sem sessão" },
  forceDemoMode = false,
}: {
  children: ReactNode;
  profile?: { displayName: string; initials: string; subtitle: string };
  forceDemoMode?: boolean;
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";

    const storedTheme = window.localStorage.getItem("uplinea-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    return storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";
  });
  const currentItem =
    navItems.find((item) => isActivePath(pathname, item.href)) ??
    (pathname.startsWith("/settings")
      ? { href: "/settings", label: "Definições", icon: Settings }
      : navItems[0]);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle("dark-mode", isDark);
    window.localStorage.setItem("uplinea-theme", theme);

    return () => {
      document.documentElement.removeAttribute("data-theme");
      document.body.classList.remove("dark-mode");
    };
  }, [isDark, theme]);

  return (
    <div className="ep-shell">
      <aside className="ep-sidebar" aria-label="Navegação principal">
        <Link className="ep-brand" href="/" aria-label="Ir para Hoje">
          <Image
            src="/uplinea/logo-sidebar-solid-0b5a98.png"
            width={984}
            height={985}
            alt="Uplinea"
            priority
            style={{ width: "70px", height: "auto" }}
          />
        </Link>

        {hasPersistenceConfig ? <PersistenceAwareSessionCta forceDemoMode={forceDemoMode} /> : <DemoSessionCta />}

        <nav className="ep-nav" aria-label="Navegação principal">
          {navSections.map((section) => (
            <section className="ep-nav-section" aria-label={section.label} key={section.label}>
              <span className="ep-nav-section-label">{section.label}</span>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={active ? "ep-nav-item active" : "ep-nav-item"}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span className="ep-nav-copy">
                      <span>{item.label}</span>
                      <small>{item.statusLabel}</small>
                    </span>
                    {item.href === "/" || item.href === "/sessions" ? (
                      <ShellSessionNavIndicator forceDemoMode={forceDemoMode} target={item.href} />
                    ) : null}
                  </Link>
                );
              })}
            </section>
          ))}
        </nav>

        <Link
          className={
            pathname.startsWith("/settings") ? "ep-nav-item ep-settings active" : "ep-nav-item ep-settings"
          }
          href="/settings"
        >
          <Settings size={18} aria-hidden="true" />
          <span>Definições</span>
        </Link>

        <div className="ep-profile" aria-label="Perfil">
          <span>{profile.initials}</span>
          <div>
            <strong>{profile.displayName}</strong>
            <small>{profile.subtitle}</small>
          </div>
        </div>
      </aside>

      <div className="ep-workspace">
        <header className="ep-topbar">
          <div>
            <span>Uplinea</span>
            <strong>{currentItem.label}</strong>
          </div>
          <div className="ep-topbar-actions">
            {pathname === "/" ? (
              <strong className="ep-screen-label">02 — HOJE (DEPOIS DE PREPARAR)</strong>
            ) : null}
            {!forceDemoMode ? <AuthControls /> : null}
            <button type="button" aria-label="Procurar">
              <Search size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              aria-pressed={isDark}
              onClick={() => setTheme((value) => (value === "dark" ? "light" : "dark"))}
            >
              {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            </button>
            <button type="button" aria-label="Notificações">
              <Bell size={18} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="ep-main">{children}</main>
      </div>
    </div>
  );
}

function ShellSessionNavIndicator({
  forceDemoMode,
  target,
}: {
  forceDemoMode: boolean;
  target: "/" | "/sessions";
}) {
  if (hasPersistenceConfig) {
    return <PersistenceAwareShellSessionNavIndicator forceDemoMode={forceDemoMode} target={target} />;
  }

  return <DemoShellSessionNavIndicator target={target} />;
}

function PersistenceAwareSessionCta({ forceDemoMode }: { forceDemoMode: boolean }) {
  const auth = usePersistenceAuth();

  if (!forceDemoMode || auth.kind === "ready") {
    return <PersistedSessionCta />;
  }

  return <DemoSessionCta />;
}

function PersistenceAwareShellSessionNavIndicator({
  forceDemoMode,
  target,
}: {
  forceDemoMode: boolean;
  target: "/" | "/sessions";
}) {
  const auth = usePersistenceAuth();

  if (!forceDemoMode || auth.kind === "ready") {
    return <PersistedShellSessionNavIndicator target={target} />;
  }

  return <DemoShellSessionNavIndicator target={target} />;
}

function getDemoSessionCtaFallback(): { status: "idle" | "active" | "pendingReview" | "reviewed"; startedAt?: number } {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(demoSessionCtaStorageKey) ?? "{}") as {
      status?: string;
      startedAt?: number;
    };

    if (parsed.status === "reviewed") return { status: "reviewed" };
  } catch {
    // Ignore corrupt QA preview state.
  }

  return { status: "idle" };
}

function readDemoSessionShellState(): { status: "idle" | "active" | "pendingReview" | "reviewed"; startedAt?: number } {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(demoSessionsStorageKey) ?? "null") as {
      activeSession?: { startedAt?: number } | null;
      pendingReviewSession?: unknown | null;
      rows?: Array<{ date?: string; dateIso?: string; status?: string }>;
    } | null;

    if (parsed && Array.isArray(parsed.rows)) {
      if (parsed.activeSession?.startedAt) return { status: "active", startedAt: parsed.activeSession.startedAt };
      if (parsed.pendingReviewSession) return { status: "pendingReview" };

      const hasReviewedToday = parsed.rows.some(
        (row) => row.status === "reviewed" && (row.dateIso === todayIsoDate || row.date === todayIsoDate || row.date === "Hoje"),
      );

      return { status: hasReviewedToday ? "reviewed" : "idle" };
    }
  } catch {
    // Ignore corrupt unified demo state and fall back to legacy CTA state.
  }

  return getDemoSessionCtaFallback();
}

function DemoShellSessionNavIndicator({ target }: { target: "/" | "/sessions" }) {
  const [state, setState] = useState<"idle" | "active" | "pendingReview" | "reviewed">("idle");

  useEffect(() => {
    function readDemoState() {
      setState(readDemoSessionShellState().status);
    }

    readDemoState();
    window.addEventListener(demoSessionCtaEvent, readDemoState);
    window.addEventListener("storage", readDemoState);
    return () => {
      window.removeEventListener(demoSessionCtaEvent, readDemoState);
      window.removeEventListener("storage", readDemoState);
    };
  }, []);

  return <SessionNavIndicator state={state} target={target} />;
}

function PersistedShellSessionNavIndicator({ target }: { target: "/" | "/sessions" }) {
  const auth = usePersistenceAuth();
  const canUsePersistence = auth.kind === "ready";
  const sessions = useQuery(api.pokerSession.list, canUsePersistence ? {} : "skip");
  const activeSession = sessions?.find((session) => session.status === "active") ?? null;
  const pendingReviewSession = sessions?.find((session) => session.status === "reviewPending") ?? null;
  const reviewedTodaySession = sessions?.find((session) => session.status === "reviewed" && session.date === todayIsoDate);
  const state = activeSession ? "active" : pendingReviewSession ? "pendingReview" : reviewedTodaySession ? "reviewed" : "idle";

  return <SessionNavIndicator state={state} target={target} />;
}

function SessionNavIndicator({
  state,
  target,
}: {
  state: "idle" | "active" | "pendingReview" | "reviewed";
  target: "/" | "/sessions";
}) {
  if (state === "idle") return null;

  const isPrimaryTarget =
    (target === "/sessions" && (state === "active" || state === "pendingReview")) ||
    (target === "/" && state === "reviewed");

  const label =
    state === "active"
      ? "sessão ativa"
      : state === "pendingReview"
        ? "review pendente"
        : "sessão revista";

  return (
    <span
      aria-label={label}
      className={`ep-nav-state-dot ${state}${isPrimaryTarget ? " primary" : ""}`}
      title={label}
    />
  );
}

function LoginScreen() {
  return (
    <main className="ep-auth-screen">
      <section className="ep-auth-panel" aria-labelledby="auth-title">
        <Image
          className="ep-auth-logo ep-auth-logo-light"
          src="/uplinea/logo-horizontal.svg"
          width={172}
          height={61}
          alt="Uplinea"
          priority
          style={{ width: "172px", height: "auto" }}
        />
        <Image
          className="ep-auth-logo ep-auth-logo-dark"
          src="/uplinea/logo-horizontal-white.svg"
          width={172}
          height={61}
          alt="Uplinea"
          priority
          style={{ width: "172px", height: "auto" }}
        />
        <div>
          <span className="ep-auth-eyebrow">Uplinea</span>
          <h1 id="auth-title">Entra para preparar a tua semana</h1>
          <p>
            Plano semanal, execução diária, sessões, reviews e Coach ficam ligados à tua conta.
          </p>
        </div>
        <SignInButton mode="modal">
          <button className="ep-auth-primary" type="button">
            Entrar
          </button>
        </SignInButton>
      </section>
      <aside className="ep-auth-context" aria-label="Contexto da app">
        <span>Contexto usado pelo Coach</span>
        <strong>Plano semanal + sessões + reviews</strong>
        <p>Nada é aplicado sem confirmação. Tu manténs controlo sobre o plano.</p>
      </aside>
    </main>
  );
}

function AuthRecoveryScreen() {
  return (
    <main className="ep-auth-screen">
      <section className="ep-auth-panel" aria-labelledby="auth-recovery-title">
        <Image
          className="ep-auth-logo ep-auth-logo-light"
          src="/uplinea/logo-horizontal.svg"
          width={172}
          height={61}
          alt="Uplinea"
          priority
          style={{ width: "172px", height: "auto" }}
        />
        <Image
          className="ep-auth-logo ep-auth-logo-dark"
          src="/uplinea/logo-horizontal-white.svg"
          width={172}
          height={61}
          alt="Uplinea"
          priority
          style={{ width: "172px", height: "auto" }}
        />
        <div>
          <span className="ep-auth-eyebrow">Uplinea</span>
          <h1 id="auth-recovery-title">Não conseguimos confirmar a sessão</h1>
          <p>
            A entrada demorou demasiado tempo. Recarrega a página; se continuar igual, limpa a sessão local e entra novamente.
          </p>
        </div>
        <button className="ep-auth-primary" type="button" onClick={() => window.location.reload()}>
          Recarregar
        </button>
        <button
          className="ep-auth-button"
          type="button"
          onClick={() => {
            window.localStorage.clear();
            window.sessionStorage.clear();
            window.location.assign("/");
          }}
        >
          Limpar sessão local
        </button>
      </section>
      <aside className="ep-auth-context" aria-label="Diagnóstico da entrada">
        <span>Diagnóstico</span>
        <strong>Clerk não terminou o arranque</strong>
        <p>A app já não fica presa num loading infinito; mostra este ecrã de recuperação.</p>
      </aside>
    </main>
  );
}

function AuthControls() {
  if (!hasClerkConfig) return null;

  return <ClerkAuthControls />;
}

function ClerkAuthControls() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (isLoaded && isSignedIn) {
    const accountLabel = user.firstName ?? user.primaryEmailAddress?.emailAddress ?? "Conta";

    return (
      <div className="ep-account-menu" aria-label="Conta">
        <span>Sessão ativa</span>
        <strong>{accountLabel}</strong>
        <UserButton />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button className="ep-auth-button" type="button">
        Entrar
      </button>
    </SignInButton>
  );
}

function PersistedSessionCta() {
  const auth = usePersistenceAuth();
  const router = useRouter();
  const canUsePersistence = auth.kind === "ready";
  const sessions = useQuery(api.pokerSession.list, canUsePersistence ? {} : "skip");
  const weeklyPlan = useQuery(api.weeklyPlan.getCurrent, canUsePersistence ? { today: todayIsoDate } : "skip");
  const startSession = useMutation(api.pokerSession.start);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const activeSession = sessions?.find((session) => session.status === "active") ?? null;
  const pendingReviewSession = sessions?.find((session) => session.status === "reviewPending") ?? null;
  const safeWeeklyPlan = weeklyPlan ?? { currentPlan: null, currentBlocks: [], weekStartDate: todayIsoDate };
  const activePlan = safeWeeklyPlan.currentPlan?.status === "active" ? safeWeeklyPlan.currentPlan : null;
  const days = activePlan
    ? buildPlanDaysFromStoredBlocks({
        blocks: safeWeeklyPlan.currentBlocks,
        today: todayIsoDate,
        weekStartDate: safeWeeklyPlan.weekStartDate,
      })
    : [];
  const grindBlocks = days.find((day) => day.isToday)?.blocks.filter((block) => block.type === "Grind") ?? [];

  return (
    <>
      <SessionCta
        activeSession={activeSession ?? null}
        hasPendingReview={Boolean(pendingReviewSession)}
        onIdleClick={() => setStartModalOpen(true)}
      />
      {startModalOpen && !activeSession && !pendingReviewSession ? (
        <SidebarStartSessionModal
          grindBlocks={grindBlocks}
          onClose={() => setStartModalOpen(false)}
          onStart={async (payload) => {
            await startSession({
              date: todayIsoDate,
              weeklyPlanId: activePlan?._id,
              weeklyPlanBlockId: payload.weeklyPlanBlockId,
              sessionFocus: payload.sessionFocus,
              weeklyFocus: activePlan?.focus ?? "Sem plano semanal ativo.",
              blockLabel: payload.blockLabel,
              maxTables: payload.maxTables,
              energy: payload.energy ?? 0,
              focusScore: payload.focusScore ?? 0,
              tilt: payload.tilt,
              microIntention: payload.microIntention,
              replaceActive: payload.replaceActive,
            });
            setStartModalOpen(false);
            router.push("/sessions");
          }}
        />
      ) : null}
    </>
  );
}

function DemoSessionCta() {
  const router = useRouter();
  const [state, setState] = useState<{ status: "idle" | "active" | "pendingReview" | "reviewed"; startedAt?: number }>({
    status: "idle",
  });
  const [startModalOpen, setStartModalOpen] = useState(false);

  useEffect(() => {
    function readDemoState() {
      setState(readDemoSessionShellState());
    }

    readDemoState();
    window.addEventListener(demoSessionCtaEvent, readDemoState);
    window.addEventListener("storage", readDemoState);
    return () => {
      window.removeEventListener(demoSessionCtaEvent, readDemoState);
      window.removeEventListener("storage", readDemoState);
    };
  }, []);

  return (
    <>
      <SessionCta
        activeSession={state.status === "active" && state.startedAt ? { startedAt: state.startedAt } : null}
        hasPendingReview={state.status === "pendingReview"}
        onIdleClick={() => setStartModalOpen(true)}
      />
      {startModalOpen ? (
        <SidebarStartSessionModal
          grindBlocks={[{ id: "demo-grind", type: "Grind", title: "Sessão MTT — manhã", target: "10 torneios", status: "Planeado" }]}
          onClose={() => setStartModalOpen(false)}
          onStart={async (payload) => {
            const startedAt = Date.now();
            const sessionId = `demo-session-${startedAt}`;
            const nextState = { status: "active" as const, startedAt };
            const nextActiveSession = {
              _id: sessionId,
              date: todayIsoDate,
              sessionFocus: payload.sessionFocus,
              weeklyFocus: "Sem plano semanal ativo.",
              blockLabel: payload.blockLabel,
              status: "active",
              maxTables: payload.maxTables,
              currentTables: payload.maxTables,
              energy: payload.energy ?? 0,
              focusScore: payload.focusScore ?? 0,
              tilt: payload.tilt,
              handsToReview: 0,
              microIntention: payload.microIntention,
              isPaused: false,
              startedAt,
            };
            const nextEvents = [
              {
                type: "started",
                title: "Sessão iniciada",
                detail: `Foco · ${payload.sessionFocus}`,
                createdAt: startedAt,
              },
            ];
            const nextRows = [
              {
                _id: sessionId,
                dateIso: todayIsoDate,
                date: "Hoje",
                focus: payload.sessionFocus,
                tournaments: 0,
                duration: "0m",
                quality: 0,
                tiltPeak: payload.tilt,
                hands: 0,
                status: "active",
              },
            ];

            window.localStorage.setItem(
              demoSessionsStorageKey,
              JSON.stringify({ activeSession: nextActiveSession, events: nextEvents, pendingReviewSession: null, rows: nextRows }),
            );
            window.localStorage.setItem(demoSessionCtaStorageKey, JSON.stringify(nextState));
            window.dispatchEvent(new Event(demoSessionCtaEvent));
            setState(nextState);
            setStartModalOpen(false);
            router.push("/sessions");
          }}
        />
      ) : null}
    </>
  );
}

function SessionCta({
  activeSession,
  hasPendingReview = false,
  onIdleClick,
}: {
  activeSession: { startedAt: number } | null;
  hasPendingReview?: boolean;
  onIdleClick: () => void;
}) {
  const ctaState = activeSession ? "active" : hasPendingReview ? "pendingReview" : "idle";
  const label =
    activeSession
      ? `Voltar à sessão · ${formatSessionDuration(activeSession.startedAt)}`
      : ctaState === "pendingReview"
        ? "Terminar e rever"
        : "Iniciar sessão";

  const className =
    ctaState === "idle" ? "ep-session-cta" : `ep-session-cta ${ctaState === "active" ? "active-session" : "review-pending"}`;

  if (ctaState === "idle") {
    return (
      <button className={className} type="button" onClick={onIdleClick}>
        <Play size={16} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  const href = ctaState === "pendingReview" ? "/sessions?reviewSession=1" : "/sessions";

  return (
    <Link className={className} href={href}>
      <Play size={16} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function formatSessionDuration(startedAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - startedAt) / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
}
