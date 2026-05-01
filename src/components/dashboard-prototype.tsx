"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

type CommitmentTone = "default" | "accent" | "soft";
type DashboardTask = {
  id: string;
  convexId?: Id<"commitments">;
  title: string;
  detail: string;
  phase: string;
  tone: CommitmentTone;
  done: boolean;
};

const isAuthConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
const isDataConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL,
);

const todayKey = new Date().toISOString().slice(0, 10);

const initialTasks: DashboardTask[] = [
  {
    id: "review-icm",
    title: "Rever 20 mãos ICM",
    detail: "20 min · antes de abrir mesas",
    phase: "Preparar",
    tone: "default",
    done: true,
  },
  {
    id: "max-tables",
    title: "Definir mesas máximas",
    detail: "6 mesas enquanto estiver deep",
    phase: "Preparar",
    tone: "default",
    done: true,
  },
  {
    id: "main-events",
    title: "2 torneios online principais",
    detail: "sem late reg extra fora do plano",
    phase: "Jogar",
    tone: "accent",
    done: false,
  },
  {
    id: "mark-icm",
    title: "Marcar spots ICM",
    detail: "mínimo 5 mãos para revisão",
    phase: "Jogar",
    tone: "accent",
    done: true,
  },
  {
    id: "post-session-review",
    title: "Review pós-sessão",
    detail: "2 min · 1 decisão boa + 1 erro",
    phase: "Rever",
    tone: "soft",
    done: false,
  },
  {
    id: "sleep",
    title: "Dormir 7h+",
    detail: "sem sessão extra se energia cair",
    phase: "Recuperar",
    tone: "soft",
    done: true,
  },
];

const coachMessages = [
  {
    id: "coach-action",
    kind: "coach",
    time: "09:15",
    action: true,
    title: "Faz 20 minutos de ICM antes de abrir mesas.",
    body: "O teu maior leak recente aparece em decisões de call no late game. Hoje não precisas de mais tarefas; precisas de uma execução limpa.",
  },
  {
    id: "coach-checklist",
    kind: "coach",
    time: "09:17",
    body: "Checklist mental para hoje:",
    bullets: [
      "Qualidade de decisão > volume.",
      "Máximo 6 mesas enquanto estiveres deep.",
      "Marca mãos com pressão ICM, não só bad beats.",
    ],
  },
  {
    id: "user-priority",
    kind: "user",
    time: "09:18",
    body: "Prioridade confirmada: menos decisões automáticas em spots de pressão.",
  },
];

export function DashboardPrototype() {
  if (isDataConfigured) {
    return <PersistedDashboardPrototype />;
  }

  return <DashboardView />;
}

function PersistedDashboardPrototype() {
  const { isLoaded, isSignedIn } = useUser();
  const dailyPlan = useQuery(
    api.dailyPlan.getToday,
    isLoaded && isSignedIn ? { date: todayKey } : "skip",
  );
  const seedToday = useMutation(api.dailyPlan.seedToday);
  const toggleStoredCommitment = useMutation(api.dailyPlan.toggleCommitment);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || dailyPlan === undefined) return;

    if (!dailyPlan.checkIn || dailyPlan.commitments.length === 0) {
      void seedToday({ date: todayKey });
    }
  }, [dailyPlan, isLoaded, isSignedIn, seedToday]);

  if (isLoaded && isSignedIn && dailyPlan === undefined) {
    return <DashboardLoading />;
  }

  return (
    <DashboardView
      renderSync={(setScores, setTasks) => (
        <DailyPlanSync dailyPlan={dailyPlan} setScores={setScores} setTasks={setTasks} />
      )}
      onToggleStored={(task) => {
        if (!task.convexId) return false;

        void toggleStoredCommitment({
          id: task.convexId,
          done: !task.done,
        });
        return true;
      }}
    />
  );
}

function DashboardLoading() {
  return (
    <main className="loading-shell" aria-live="polite">
      <div>
        <strong>Coach AI</strong>
        <span>A carregar plano...</span>
      </div>
    </main>
  );
}

function DashboardView({
  onToggleStored,
  renderSync,
}: {
  onToggleStored?: (task: DashboardTask) => boolean;
  renderSync?: (
    setScores: Dispatch<
      SetStateAction<{
        sleep: number;
        energy: number;
        focus: number;
        stress: number;
      }>
    >,
    setTasks: Dispatch<SetStateAction<DashboardTask[]>>,
  ) => ReactNode;
}) {
  const [darkMode, setDarkMode] = useState(
    () => typeof window !== "undefined" && window.localStorage.getItem("theme") === "dark",
  );
  const [tasks, setTasks] = useState(initialTasks);
  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState(coachMessages);
  const [scores, setScores] = useState({
    sleep: 4,
    energy: 4,
    focus: 5,
    stress: 2,
  });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    window.localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const completedTasks = tasks.filter((task) => task.done).length;
  const taskProgress = (completedTasks / tasks.length) * 100;

  const readiness = useMemo(() => {
    const rawScore =
      ((scores.sleep + scores.energy + scores.focus + (6 - scores.stress)) / 20) * 100;
    return Math.round(rawScore);
  }, [scores]);
  const readinessLabel =
    readiness >= 80
      ? "Pronto para preparar"
      : readiness >= 65
        ? "Preparar com cautela"
        : "Rever antes de jogar";
  const readinessFactors = [
    ["Sono", scores.sleep],
    ["Energia", scores.energy],
    ["Foco", scores.focus],
    ["Stress", scores.stress],
  ] as const;

  function toggleTask(taskId: string) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);

    if (task && onToggleStored?.(task)) {
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedReply = reply.trim();
    if (!trimmedReply) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `user-${Date.now()}`,
        kind: "user",
        time: "agora",
        body: trimmedReply,
      },
      {
        id: `coach-${Date.now()}`,
        kind: "coach",
        time: "agora",
        body: "Boa. Vou transformar isso numa ação simples para o plano de hoje.",
        bullets: ["Escolhe quando vais executar.", "Define como vais medir se cumpriste."],
      },
    ]);
    setReply("");
  }

  return (
    <div className="app-shell">
      {renderSync?.(setScores, setTasks)}
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="brand">
          <div className="brand-mark">✦</div>
          <div>
            <strong>Coach AI</strong>
            <span>Planner do Jogador</span>
          </div>
        </div>

        <nav className="nav-list">
          <button className="nav-item active" type="button">
            <span>⌂</span>Início
          </button>
          <button className="nav-item placeholder" type="button" aria-disabled="true">
            <span>◎</span>Objetivos
          </button>
          <button className="nav-item placeholder" type="button" aria-disabled="true">
            <span>◷</span>Sessões
          </button>
          <button className="nav-item placeholder" type="button" aria-disabled="true">
            <span>✓</span>Revisão
          </button>
          <button className="nav-item placeholder" type="button" aria-disabled="true">
            <span>▥</span>Análises
          </button>
          <button className="nav-item placeholder" type="button" aria-disabled="true">
            <span>✎</span>Notas
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item muted" type="button">
            <span>⚙</span>Definições
          </button>
          <button className="nav-item muted" type="button">
            <span>?</span>Ajuda
          </button>
          <div className="profile">
            <div className="profile-avatar" aria-hidden="true">
              DS
            </div>
            <div>
              <strong>Diogo Silva</strong>
              <span>Profissional online</span>
            </div>
            <span className="profile-arrow">›</span>
          </div>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div>
            <h1>Bom dia, Diogo!</h1>
            <p>Quinta-feira, 30 de abril · foco em qualidade de decisão</p>
          </div>
          <div className="topbar-actions">
            <button
              className="theme-toggle"
              type="button"
              aria-label={darkMode ? "Ativar light mode" : "Ativar dark mode"}
              onClick={() => setDarkMode((current) => !current)}
            >
              <span className="theme-icon">{darkMode ? "☀" : "☾"}</span>
            </button>
            <div className="streak">
              <span>🔥</span>
              <strong>7</strong> dias de consistência
            </div>
            <button className="primary-button" type="button">
              ✦ Atualizar plano
            </button>
            <AuthControls />
          </div>
        </header>

        <section className="hero-grid">
          <article className="hero-card today-card">
            <div className="hero-copy">
              <span className="eyebrow">Prioridade #1</span>
              <h2>Tomar melhores decisões no late game.</h2>
              <p>
                O plano de hoje está reduzido ao essencial: preparar, jogar com
                intenção, rever rápido.
              </p>
            </div>
            <div className="readiness-meter" aria-label="Prontidão para sessão">
              <strong>{readiness}</strong>
              <span>Prontidão</span>
            </div>
          </article>

          <article className="metric-card">
            <span>Plano de hoje</span>
            <strong>
              {completedTasks}/{tasks.length}
            </strong>
            <small>ações essenciais</small>
          </article>
          <article className="metric-card">
            <span>Estudo semanal</span>
            <strong>7h 20m</strong>
            <small>61% da meta</small>
          </article>
          <article className="metric-card">
            <span>Volume MTT</span>
            <strong>18</strong>
            <small>torneios esta semana</small>
          </article>
          <article className="metric-card">
            <span>Revisão</span>
            <strong>42</strong>
            <small>mãos marcadas</small>
          </article>
        </section>

        <section className="layout-grid">
          <div className="left-column">
            <section className="panel commitments-panel">
              <div className="panel-heading">
                <div>
                  <h2>Compromissos de hoje</h2>
                  <p>Preparar · jogar · rever · recuperar</p>
                </div>
                <span className="count-pill">
                  {completedTasks}/{tasks.length} feito
                </span>
              </div>
              <div className="commitment-progress" aria-hidden="true">
                <span style={{ width: `${taskProgress}%` }} />
              </div>

              <div className="task-list">
                {tasks.map((task) => (
                  <label className="task-item" key={task.id}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="task-content">
                      <strong>{task.title}</strong>
                      <small>{task.detail}</small>
                    </span>
                    <span
                      className={[
                        "task-phase",
                        task.tone === "accent" ? "accent" : "",
                        task.tone === "soft" ? "soft" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {task.phase}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Objetivos em cascata</h2>
                <button className="link-button" type="button">
                  Editar
                </button>
              </div>
              <div className="goal-stack">
                <div>
                  <span>Ano</span>
                  <strong>Melhorar decisão e rotina profissional</strong>
                </div>
                <div>
                  <span>Trimestre</span>
                  <strong>Reduzir erros ICM em 20%</strong>
                </div>
                <div>
                  <span>Mês</span>
                  <strong>20h de estudo + 120 mãos revistas</strong>
                </div>
                <div>
                  <span>Semana</span>
                  <strong>5 blocos de estudo curtos</strong>
                </div>
                <div className="active">
                  <span>Hoje</span>
                  <strong>1 takeaway aplicado na sessão</strong>
                </div>
              </div>
            </section>

            <section className="panel">
              <div className="panel-heading">
                <h2>Plano se/então</h2>
                <button className="link-button" type="button">
                  + Novo
                </button>
              </div>
              <div className="if-plan">
                <span>Se eu perder um pote grande...</span>
                <strong>então faço 3 respirações, marco a mão e espero uma órbita.</strong>
              </div>
              <div className="if-plan">
                <span>Se sentir tilt acima de 3/5...</span>
                <strong>então reduzo mesas e ativo pausa de 5 min.</strong>
              </div>
            </section>
          </div>

          <section className="panel coach-panel">
            <div className="panel-heading">
              <div>
                <h2>✦ Coach AI</h2>
                <p>Foco, accountability e próxima ação</p>
              </div>
              <button className="icon-button" type="button" aria-label="Preferências do Coach">
                ☷
              </button>
            </div>

            <div className="coach-feed">
              {messages.map((message) => (
                <article
                  className={[
                    message.kind === "user" ? "user-message" : "coach-message",
                    "action" in message && message.action ? "action-message" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={message.id}
                >
                  <div className="message-header">
                    <strong>{message.kind === "user" ? "Tu" : "✦ Coach AI"}</strong>
                    <time>{message.time}</time>
                  </div>
                  {"action" in message && message.action ? (
                    <>
                      <span className="eyebrow">Próxima melhor ação</span>
                      <h3>{message.title}</h3>
                    </>
                  ) : null}
                  <p>{message.body}</p>
                  {"bullets" in message && message.bullets ? (
                    <ul>
                      {message.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                  {"action" in message && message.action ? (
                    <div className="quick-actions">
                      <button type="button">Começar bloco de estudo</button>
                      <button type="button">Ver mãos marcadas</button>
                      <button type="button">Ajustar plano</button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <form className="reply-box" onSubmit={handleReply}>
              <input
                type="text"
                placeholder="Responder ao Coach..."
                value={reply}
                onChange={(event) => setReply(event.target.value)}
              />
              <button className="primary-button" type="submit">
                Responder
              </button>
            </form>
          </section>

          <div className="right-column">
            <section className="panel session-card">
              <div className="panel-heading">
                <h2>Próxima sessão</h2>
                <button className="link-button" type="button">
                  Calendário
                </button>
              </div>
              <div className="session-header">
                <span className="time-pill">Hoje, 19:30</span>
                <span className="status-pill">Confirmada</span>
              </div>
              <h3>Online High Roller Series</h3>
              <p>$2.100 · Dia 2 · lobby online</p>
              <dl className="details-list">
                <div>
                  <dt>Plataforma</dt>
                  <dd>GGPoker</dd>
                </div>
                <div>
                  <dt>Mesas máx.</dt>
                  <dd>6</dd>
                </div>
                <div>
                  <dt>Late reg</dt>
                  <dd>Fechado</dd>
                </div>
                <div>
                  <dt>Foco</dt>
                  <dd>ICM calmo</dd>
                </div>
              </dl>
              <button className="primary-button full" type="button">
                Preparar sessão
              </button>
            </section>

            <section className="panel readiness-card">
              <div className="panel-heading">
                <h2>Prontidão para sessão</h2>
                <span className="count-pill">Resumo</span>
              </div>
              <div className="readiness-summary">
                <div>
                  <strong>{readiness}</strong>
                  <span>{readinessLabel}</span>
                </div>
                <p>O check-in completo fica no fluxo de preparação.</p>
              </div>
              <div className="readiness-factors" aria-label="Fatores de prontidão">
                {readinessFactors.map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}/5</strong>
                  </div>
                ))}
              </div>
              <button className="secondary-button full" type="button">
                Preparar sessão
              </button>
            </section>

            <section className="panel weekly-card">
              <div className="panel-heading">
                <h2>Review semanal</h2>
                <button className="link-button" type="button">
                  Abrir
                </button>
              </div>
              <p>
                <strong>Padrão:</strong> foco cai depois de 3h de sessão. O melhor ajuste
                é planear pausa obrigatória no segundo break.
              </p>
              <div className="progress-line">
                <span style={{ width: "72%" }} />
              </div>
              <small className="progress-label">72% alinhado com o plano</small>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function DailyPlanSync({
  dailyPlan,
  setScores,
  setTasks,
}: {
  dailyPlan:
    | {
        checkIn:
          | {
              sleep: number;
              energy: number;
              focus: number;
              stress: number;
            }
          | null;
        commitments: Doc<"commitments">[];
      }
    | undefined;
  setScores: Dispatch<
    SetStateAction<{
      sleep: number;
      energy: number;
      focus: number;
      stress: number;
    }>
  >;
  setTasks: Dispatch<SetStateAction<DashboardTask[]>>;
}) {
  useEffect(() => {
    if (!dailyPlan?.checkIn) return;

    setScores({
      sleep: dailyPlan.checkIn.sleep,
      energy: dailyPlan.checkIn.energy,
      focus: dailyPlan.checkIn.focus,
      stress: dailyPlan.checkIn.stress,
    });
  }, [dailyPlan?.checkIn, setScores]);

  useEffect(() => {
    if (!dailyPlan || dailyPlan.commitments.length === 0) return;

    setTasks(
      dailyPlan.commitments.map((commitment) => ({
        id: commitment._id,
        convexId: commitment._id,
        title: commitment.title,
        detail: commitment.detail,
        phase: commitment.phase,
        tone: commitment.tone,
        done: commitment.done,
      })),
    );
  }, [dailyPlan, setTasks]);

  return null;
}

function AuthControls() {
  if (!isAuthConfigured) {
    return <span className="auth-status">Modo demo</span>;
  }

  return <ClerkAuthControls />;
}

function ClerkAuthControls() {
  const { isLoaded, isSignedIn } = useUser();

  if (isLoaded && isSignedIn) {
    return (
      <div className="auth-controls">
        <div className="signed-in-menu" aria-label="Conta">
          <UserButton />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-controls">
      <SignInButton mode="modal">
        <button className="secondary-button auth-button" type="button">
          Entrar
        </button>
      </SignInButton>
    </div>
  );
}
