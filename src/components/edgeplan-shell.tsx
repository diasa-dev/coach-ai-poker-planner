"use client";

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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

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

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EdgePlanShell({ children }: { children: ReactNode }) {
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
            src="/edgeplan/logo-horizontal-white.svg"
            width={184}
            height={60}
            alt="EdgePlan"
            priority
          />
        </Link>

        <Link className="ep-session-cta" href="/sessions">
          <Play size={16} aria-hidden="true" />
          <span>Iniciar sessão</span>
        </Link>

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
            <span>EdgePlan</span>
            <strong>{currentItem.label}</strong>
          </div>
          <div className="ep-topbar-actions">
            {pathname === "/" ? (
              <strong className="ep-screen-label">02 — HOJE (DEPOIS DE PREPARAR)</strong>
            ) : null}
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
