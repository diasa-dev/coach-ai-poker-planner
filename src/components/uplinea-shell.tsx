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
import { useConvexAuth, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { api } from "../../convex/_generated/api";
import { hasClerkConfig, hasPersistenceConfig } from "@/lib/runtime-config";

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
  const { isLoaded, isSignedIn } = useUser();

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

  return <UplineaShellFrame>{children}</UplineaShellFrame>;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UplineaShell({ children }: { children: ReactNode }) {
  if (hasClerkConfig) {
    return <AuthenticatedUplineaShell>{children}</AuthenticatedUplineaShell>;
  }

  return <UplineaShellFrame>{children}</UplineaShellFrame>;
}

function UplineaShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentItem =
    navItems.find((item) => isActivePath(pathname, item.href)) ??
    (pathname.startsWith("/settings")
      ? { href: "/settings", label: "Definições", icon: Settings }
      : navItems[0]);

  return (
    <div className="ep-shell">
      <aside className="ep-sidebar" aria-label="Navegação principal">
        <Link className="ep-brand" href="/" aria-label="Ir para Hoje">
          <Image
            src="/uplinea/logo-horizontal-white.svg"
            width={184}
            height={60}
            alt="Uplinea"
            priority
          />
        </Link>

        {hasPersistenceConfig ? <PersistedSessionCta /> : <SessionCta activeSession={null} />}

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
          <span>JM</span>
          <div>
            <strong>João M.</strong>
            <small>Pro · MTT</small>
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
            <AuthControls />
            <button type="button" aria-label="Procurar">
              <Search size={18} aria-hidden="true" />
            </button>
            <button type="button" aria-label="Tema">
              <Moon size={18} aria-hidden="true" />
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
          src="/uplinea/logo-horizontal.svg"
          width={172}
          height={56}
          alt="Uplinea"
          priority
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
  const { isAuthenticated } = useConvexAuth();
  const activeSession = useQuery(api.pokerSession.getActive, isAuthenticated ? {} : "skip");

  return <SessionCta activeSession={activeSession ?? null} />;
}

function SessionCta({ activeSession }: { activeSession: { startedAt: number } | null }) {
  return (
    <Link className={activeSession ? "ep-session-cta active-session" : "ep-session-cta"} href="/sessions">
      <Play size={16} aria-hidden="true" />
      <span>{activeSession ? `Sessão ativa · ${formatSessionDuration(activeSession.startedAt)}` : "Iniciar sessão"}</span>
    </Link>
  );
}

function formatSessionDuration(startedAt: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - startedAt) / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
}
