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
import { usePathname } from "next/navigation";
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
const demoSessionCtaEvent = "uplinea-demo-session-state-change";
const qaPreviewStorageKey = "uplinea-local-qa-preview";
const qaPreviewParam = "qa-preview";
const todayIsoDate = getTodayIsoDate();

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

const navItems = [
  { href: "/", label: "Hoje", icon: Sun },
  { href: "/weekly", label: "Plano semanal", icon: CalendarDays },
  { href: "/annual", label: "Direção anual", icon: Compass },
  { href: "/monthly", label: "Objetivos mensais", icon: Target },
  { href: "/sessions", label: "Sessões", icon: Spade },
  { href: "/study", label: "Estudo", icon: BookOpen },
  { href: "/review", label: "Revisão", icon: MessageSquareText },
  { href: "/coach", label: "Coach AI", icon: Sparkles },
];

function AuthenticatedUplineaShell({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("uplinea-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme === "dark" || (!storedTheme && prefersDark) ? "dark" : "light";

    document.documentElement.dataset.theme = theme;
    document.body.classList.toggle("dark-mode", theme === "dark");
  }, []);

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
  const [localQaPreview, setLocalQaPreview] = useState(false);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      setLocalQaPreview(readLocalQaPreview(new URLSearchParams(window.location.search)));
    });
  }, []);

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
            style={{ width: "100%", height: "auto" }}
          />
        </Link>

        {hasPersistenceConfig && !forceDemoMode ? <PersistedSessionCta /> : <DemoSessionCta />}

        <nav className="ep-nav" aria-label="Navegação principal">
          {navItems.map((item) => {
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
                <span>{item.label}</span>
              </Link>
            );
          })}
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
  const canUsePersistence = auth.kind === "ready";
  const activeSession = useQuery(api.pokerSession.getActive, canUsePersistence ? {} : "skip");
  const pendingReviewSession = useQuery(api.pokerSession.getPendingReview, canUsePersistence ? {} : "skip");
  const weeklyPlan = useQuery(api.weeklyPlan.getCurrent, canUsePersistence ? { today: todayIsoDate } : "skip");
  const startSession = useMutation(api.pokerSession.start);
  const [startModalOpen, setStartModalOpen] = useState(false);
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
        onStartClick={() => setStartModalOpen(true)}
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
            });
            setStartModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function DemoSessionCta() {
  const [state, setState] = useState<{ status: "idle" | "active" | "pendingReview"; startedAt?: number }>({
    status: "idle",
  });
  const [startModalOpen, setStartModalOpen] = useState(false);

  useEffect(() => {
    function readDemoState() {
      const rawValue = window.localStorage.getItem(demoSessionCtaStorageKey);
      if (!rawValue) {
        setState({ status: "idle" });
        return;
      }

      try {
        const parsed = JSON.parse(rawValue) as { status?: string; startedAt?: number };
        if (parsed.status === "active" || parsed.status === "pendingReview" || parsed.status === "idle") {
          setState({ status: parsed.status, startedAt: parsed.startedAt });
        }
      } catch {
        setState({ status: "idle" });
      }
    }

    readDemoState();
    window.addEventListener(demoSessionCtaEvent, readDemoState);
    return () => window.removeEventListener(demoSessionCtaEvent, readDemoState);
  }, []);

  return (
    <>
      <SessionCta
        activeSession={state.status === "active" && state.startedAt ? { startedAt: state.startedAt } : null}
        hasPendingReview={state.status === "pendingReview"}
        onStartClick={() => setStartModalOpen(true)}
      />
      {startModalOpen && state.status === "idle" ? (
        <SidebarStartSessionModal
          grindBlocks={[{ id: "demo-grind", type: "Grind", title: "Sessão MTT — manhã", target: "2h", status: "Planeado" }]}
          onClose={() => setStartModalOpen(false)}
          onStart={async () => {
            const nextState = { status: "active" as const, startedAt: Date.now() };
            window.localStorage.setItem(demoSessionCtaStorageKey, JSON.stringify(nextState));
            window.dispatchEvent(new Event(demoSessionCtaEvent));
            setState(nextState);
            setStartModalOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function SessionCta({
  activeSession,
  hasPendingReview = false,
  onStartClick,
}: {
  activeSession: { startedAt: number } | null;
  hasPendingReview?: boolean;
  onStartClick?: () => void;
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

  if (ctaState === "idle" && onStartClick) {
    return (
      <button className={className} type="button" onClick={onStartClick}>
        <Play size={16} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link className={className} href="/sessions">
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
