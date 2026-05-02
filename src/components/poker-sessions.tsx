"use client";

import {
  Activity,
  ArrowRight,
  Check,
  Flag,
  Hand,
  Lock,
  Pause,
  Play,
  Search,
  Sparkles,
  Square,
} from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  buildPlanDaysFromStoredBlocks,
  getTodayIsoDate,
  type PlanBlock,
} from "@/lib/planning/weekly-plan";
import styles from "./poker-sessions.module.css";

type SessionStatus = "active" | "reviewPending" | "reviewed";
type Modal = "start" | "checkup" | "hand" | "review" | null;
type EventType = "started" | "checkup" | "hand" | "note" | "microIntention" | "paused" | "resumed" | "finished";

type SessionView = {
  _id?: Id<"pokerSessions">;
  date: string;
  sessionFocus: string;
  weeklyFocus: string;
  blockLabel?: string;
  status: SessionStatus;
  maxTables: number;
  currentTables: number;
  energy: number;
  focusScore: number;
  tilt: number;
  handsToReview: number;
  microIntention?: string;
  isPaused: boolean;
  startedAt: number;
};

type SessionEventView = {
  _id?: Id<"pokerSessionEvents">;
  type: EventType;
  title: string;
  detail: string;
  createdAt: number;
};

const hasPersistenceConfig = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CONVEX_URL,
);
const todayIsoDate = getTodayIsoDate();

const demoStartedAt = Date.now() - 84 * 60 * 1000;
const handTemplates = ["ICM", "Pote grande", "Bluff catch", "All-in marginal", "River difícil", "Exploit / read", "Erro emocional"];
const microSuggestions = ["Não pagar river sem motivo", "Folda marginais em UTG", "Respira entre mesas", "Não abrir mais mesas", "Pausa às 16:00"];
const statusCopy: Record<SessionStatus, string> = {
  active: "Em curso",
  reviewPending: "Review pendente",
  reviewed: "Revista",
};

const demoSession: SessionView = {
  _id: "demo-session" as Id<"pokerSessions">,
  date: todayIsoDate,
  sessionFocus: "Disciplina em ICM até bolha",
  weeklyFocus: "Executar com disciplina, não com volume.",
  blockLabel: "Grind · Sessão MTT — manhã (2h)",
  status: "active",
  maxTables: 6,
  currentTables: 6,
  energy: 4,
  focusScore: 4,
  tilt: 2,
  handsToReview: 3,
  microIntention: "Não pagar river sem motivo claro.",
  isPaused: false,
  startedAt: demoStartedAt,
};

const demoEvents: SessionEventView[] = [
  { type: "checkup", title: "Quick check-up", detail: "Energia 4 · Foco 4 · Tilt 1 · 6 mesas", createdAt: Date.now() - 52 * 60 * 1000 },
  { type: "hand", title: "Mão para rever — ICM", detail: "Stack 12bb · UTG · QQ · open shove", createdAt: Date.now() - 66 * 60 * 1000 },
  { type: "note", title: "Nota — distração", detail: "Pausa de 2 min para água", createdAt: Date.now() - 88 * 60 * 1000 },
  { type: "microIntention", title: "Micro-intenção", detail: "Não pagar river sem motivo", createdAt: Date.now() - 102 * 60 * 1000 },
  { type: "started", title: "Sessão iniciada", detail: "Foco · Disciplina em ICM até bolha", createdAt: demoStartedAt },
];

export function PokerSessions() {
  if (!hasPersistenceConfig) return <PokerSessionsDemo />;
  return <PersistedPokerSessions />;
}

function PersistedPokerSessions() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const weeklyPlan = useQuery(api.weeklyPlan.getCurrent, isAuthenticated ? { today: todayIsoDate } : "skip");
  const activeSession = useQuery(api.pokerSession.getActive, isAuthenticated ? {} : "skip");
  const sessions = useQuery(api.pokerSession.list, isAuthenticated ? {} : "skip");
  const events = useQuery(
    api.pokerSession.listEvents,
    isAuthenticated && activeSession ? { sessionId: activeSession._id } : "skip",
  );
  const startSession = useMutation(api.pokerSession.start);
  const addEvent = useMutation(api.pokerSession.addEvent);
  const togglePause = useMutation(api.pokerSession.togglePause);
  const finishSession = useMutation(api.pokerSession.finish);

  if (isLoading || (isAuthenticated && (weeklyPlan === undefined || activeSession === undefined || sessions === undefined))) {
    return (
      <section className="ep-page">
        <div className="wp-demo-banner">A carregar sessões...</div>
      </section>
    );
  }

  if (!isAuthenticated || !weeklyPlan || !sessions) {
    return <PokerSessionsDemo banner="Sessão não iniciada. Sessões estão em modo demo/mock até entrares." />;
  }

  const activePlan = weeklyPlan.currentPlan?.status === "active" ? weeklyPlan.currentPlan : null;
  const days = activePlan
    ? buildPlanDaysFromStoredBlocks({
        blocks: weeklyPlan.currentBlocks,
        today: todayIsoDate,
        weekStartDate: weeklyPlan.weekStartDate,
      })
    : [];
  const grindBlocks = days.find((day) => day.isToday)?.blocks.filter((block) => block.type === "Grind") ?? [];
  const sessionRows = sessions.map((session) => ({
    _id: session._id,
    date: session.date === todayIsoDate ? "Hoje" : formatShortDate(session.startedAt),
    focus: session.sessionFocus,
    tournaments: session.currentTables,
    duration: formatElapsed(session.startedAt, session.endedAt),
    quality: session.status === "reviewed" ? 4 : 0,
    tiltPeak: session.tilt,
    hands: session.handsToReview,
    status: session.status as SessionStatus,
  }));

  return (
    <SessionsWorkspace
      activeSession={activeSession as SessionView | null}
      events={(events ?? []) as SessionEventView[]}
      grindBlocks={grindBlocks}
      onAddEvent={async (sessionId, event) => {
        await addEvent({ sessionId, ...event });
      }}
      onFinishSession={async (sessionId) => {
        await finishSession({ sessionId });
      }}
      onStartSession={async (payload) => {
        await startSession({
          date: todayIsoDate,
          weeklyPlanId: activePlan?._id,
          weeklyPlanBlockId: payload.weeklyPlanBlockId,
          sessionFocus: payload.sessionFocus,
          weeklyFocus: activePlan?.focus ?? "Sem plano semanal ativo.",
          blockLabel: payload.blockLabel,
          maxTables: payload.maxTables,
          energy: payload.energy,
          focusScore: payload.focusScore,
          tilt: payload.tilt,
          microIntention: payload.microIntention,
        });
      }}
      onTogglePause={async (sessionId) => {
        await togglePause({ sessionId });
      }}
      rows={sessionRows}
    />
  );
}

function PokerSessionsDemo({ banner }: { banner?: string }) {
  return (
    <SessionsWorkspace
      activeSession={null}
      events={demoEvents}
      grindBlocks={[{ id: "demo-grind", type: "Grind", title: "Sessão MTT — manhã", target: "2h", status: "Planeado" }]}
      banner={banner ?? "Modo demo/mock. Entra para guardar sessões e eventos no Convex."}
      demoMode
      onAddEvent={async () => undefined}
      onFinishSession={async () => undefined}
      onStartSession={async () => undefined}
      onTogglePause={async () => undefined}
      rows={[
        {
          date: "Hoje",
          focus: demoSession.sessionFocus,
          tournaments: 6,
          duration: "1h 24m",
          quality: 0,
          tiltPeak: 2,
          hands: 3,
          status: "reviewPending" as const,
        },
      ]}
    />
  );
}

function SessionsWorkspace({
  activeSession,
  banner,
  demoMode = false,
  events,
  grindBlocks,
  onAddEvent,
  onFinishSession,
  onStartSession,
  onTogglePause,
  rows,
}: {
  activeSession: SessionView | null;
  banner?: string;
  demoMode?: boolean;
  events: SessionEventView[];
  grindBlocks: PlanBlock[];
  onAddEvent: (
    sessionId: Id<"pokerSessions">,
    event: {
      type: EventType;
      title: string;
      detail: string;
      template?: string;
      note?: string;
      energy?: number;
      focusScore?: number;
      tilt?: number;
      tables?: number;
      microIntention?: string;
    },
  ) => Promise<void>;
  onFinishSession: (sessionId: Id<"pokerSessions">) => Promise<void>;
  onStartSession: (payload: {
    weeklyPlanBlockId?: Id<"weeklyPlanBlocks">;
    blockLabel?: string;
    sessionFocus: string;
    maxTables: number;
    energy: number;
    focusScore: number;
    tilt: number;
    microIntention?: string;
  }) => Promise<void>;
  onTogglePause: (sessionId: Id<"pokerSessions">) => Promise<void>;
  rows: {
    _id?: Id<"pokerSessions">;
    date: string;
    focus: string;
    tournaments: number;
    duration: string;
    quality: number;
    tiltPeak: number;
    hands: number;
    status: SessionStatus;
  }[];
}) {
  const [modal, setModal] = useState<Modal>(null);
  const [view, setView] = useState<"history" | "active">(activeSession ? "active" : "history");
  const [startFocus, setStartFocus] = useState("Disciplina em ICM até bolha");
  const [selectedBlockId, setSelectedBlockId] = useState(grindBlocks[0]?.id ?? "none");
  const [maxTables, setMaxTables] = useState(6);
  const [energy, setEnergy] = useState(4);
  const [focusScore, setFocusScore] = useState(4);
  const [tilt, setTilt] = useState(1);
  const [microIntention, setMicroIntention] = useState("");

  const selectedBlock = grindBlocks.find((block) => block.id === selectedBlockId);
  const visibleActiveSession = activeSession ?? (demoMode && view === "active" ? demoSession : null);
  const summary = useMemo(
    () => ({
      sessions: rows.length,
      averageQuality: getAverageQuality(rows),
      hands: rows.reduce((total, row) => total + row.hands, 0),
    }),
    [rows],
  );

  async function submitStartSession() {
    await onStartSession({
      weeklyPlanBlockId: selectedBlock?.id as Id<"weeklyPlanBlocks"> | undefined,
      blockLabel: selectedBlock ? `Grind · ${selectedBlock.title}${selectedBlock.target ? ` (${selectedBlock.target})` : ""}` : undefined,
      sessionFocus: startFocus,
      maxTables,
      energy,
      focusScore,
      tilt,
      microIntention,
    });
    setModal(null);
    setView("active");
  }

  return (
    <section className="ep-page">
      {banner ? <div className="wp-demo-banner">{banner}</div> : null}

      {visibleActiveSession && view === "active" ? (
        <ActiveSession
          events={events}
          onCapture={setModal}
          onFinish={() => setModal("review")}
          onQuickNote={async (text) => {
            if (!visibleActiveSession._id || !text.trim()) return;
            await onAddEvent(visibleActiveSession._id, {
              type: "note",
              title: "Nota rápida",
              detail: text.trim(),
              note: text.trim(),
            });
          }}
          onTogglePause={async () => {
            if (visibleActiveSession._id) await onTogglePause(visibleActiveSession._id);
          }}
          session={visibleActiveSession}
        />
      ) : (
        <>
          <div className="ep-page-header">
            <div>
              <span>Histórico</span>
              <h1>Sessões</h1>
              <p>Cada sessão alimenta o Coach com contexto real, sem transformar a app num tracker financeiro.</p>
            </div>
            <div className="ep-page-actions">
              <button className="ep-button secondary" type="button">
                <Search size={15} aria-hidden="true" />
                Filtrar
              </button>
              <button className="ep-button primary" type="button" onClick={() => setModal("start")}>
                <Play size={15} aria-hidden="true" />
                Iniciar sessão
              </button>
            </div>
          </div>

          {activeSession ? (
            <article className={styles.statusCard}>
              <div>
                <span>Sessão ativa</span>
                <h2>{activeSession.sessionFocus}</h2>
                <p>{formatStartedAt(activeSession.startedAt)} · {activeSession.blockLabel ?? "Sessão sem bloco"}</p>
              </div>
              <button className="ep-button primary" type="button" onClick={() => setView("active")}>
                Voltar à sessão
              </button>
            </article>
          ) : null}

          <div className={styles.sessionLayout}>
            <SessionsTable rows={rows} onOpenActive={() => setView("active")} />
            <aside className={styles.sideStack}>
              <SummaryPanel summary={summary} />
              <article className={styles.coachPanel}>
                <Sparkles size={17} aria-hidden="true" />
                <div>
                  <span>Coach AI</span>
                  <p>Mãos marcadas, check-ups e notas rápidas entram como contexto para análise futura.</p>
                  <small>contexto · sessões + eventos</small>
                </div>
              </article>
            </aside>
          </div>
        </>
      )}

      {modal === "start" ? (
        <ModalFrame title="Iniciar sessão" onClose={() => setModal(null)}>
          <div className={styles.formGrid}>
            <label className={styles.fullField}>
              Foco da sessão
              <input value={startFocus} onChange={(event) => setStartFocus(event.target.value)} />
            </label>
            <label>
              Bloco
              <select value={selectedBlockId} onChange={(event) => setSelectedBlockId(event.target.value)}>
                {grindBlocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    Grind · {block.title}{block.target ? ` (${block.target})` : ""}
                  </option>
                ))}
                <option value="none">Sem bloco associado</option>
              </select>
            </label>
            <label>
              Mesas
              <input value={maxTables} inputMode="numeric" onChange={(event) => setMaxTables(Number(event.target.value) || 1)} />
            </label>
          </div>
          <label className={styles.inlineField}>
            Micro-intenção
            <input
              placeholder='ex: "Não pagar river sem motivo"'
              value={microIntention}
              onChange={(event) => setMicroIntention(event.target.value)}
            />
          </label>
          <section className={styles.initialStateBox}>
            <header>
              <span>Estado inicial</span>
              <small>opcional</small>
            </header>
            <div className={styles.ratingGrid}>
              <Rating label="Energia" min={1} value={energy} onChange={setEnergy} />
              <Rating label="Foco" min={1} value={focusScore} onChange={setFocusScore} />
              <Rating label="Tilt" min={1} tone="tilt" value={tilt} onChange={setTilt} />
            </div>
          </section>
          <button className={styles.qualityRuleButton} type="button">
            + Adicionar regra de qualidade
          </button>
          <div className={styles.modalActions}>
            <button className="ep-button secondary" type="button" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="ep-button primary" type="button" onClick={submitStartSession}>
              <Play size={15} aria-hidden="true" />
              Iniciar sessão
            </button>
          </div>
        </ModalFrame>
      ) : null}

      {visibleActiveSession?._id && modal === "checkup" ? (
        <CheckupModal
          initialEnergy={visibleActiveSession.energy}
          initialFocus={visibleActiveSession.focusScore}
          initialTables={visibleActiveSession.currentTables}
          initialTilt={visibleActiveSession.tilt}
          onClose={() => setModal(null)}
          onSave={async (payload) => {
            await onAddEvent(visibleActiveSession._id!, {
              type: "checkup",
              title: "Quick check-up",
              detail: `Energia ${payload.energy} · Foco ${payload.focusScore} · Tilt ${payload.tilt} · ${payload.tables} mesas`,
              energy: payload.energy,
              focusScore: payload.focusScore,
              tilt: payload.tilt,
              tables: payload.tables,
              microIntention: payload.microIntention || undefined,
            });
            if (payload.microIntention) {
              await onAddEvent(visibleActiveSession._id!, {
                type: "microIntention",
                title: "Micro-intenção",
                detail: payload.microIntention,
                microIntention: payload.microIntention,
              });
            }
            setModal(null);
          }}
        />
      ) : null}

      {visibleActiveSession?._id && modal === "hand" ? (
        <HandModal
          onClose={() => setModal(null)}
          onSave={async ({ note, template }) => {
            await onAddEvent(visibleActiveSession._id!, {
              type: "hand",
              title: `Mão para rever — ${template}`,
              detail: note || "Sem nota adicional",
              template,
              note,
            });
            setModal(null);
          }}
        />
      ) : null}

      {visibleActiveSession?._id && modal === "review" ? (
        <ModalFrame title="Terminar sessão" onClose={() => setModal(null)}>
          <div className={styles.formGrid}>
            <label>
              Duração
              <input disabled value={formatElapsed(visibleActiveSession.startedAt)} />
            </label>
            <label>
              Mãos marcadas
              <input disabled value={visibleActiveSession.handsToReview} />
            </label>
            <label className={styles.fullField}>
              Resumo
              <textarea defaultValue="Sessão terminada. Review completa fica para a próxima slice." />
            </label>
          </div>
          <section className={styles.financialBox}>
            <Lock size={16} aria-hidden="true" />
            <div>
              <strong>Resultado financeiro · opcional</strong>
              <p>Ainda não é persistido nesta slice. Mantemos fora do contexto do Coach por agora.</p>
            </div>
          </section>
          <div className={styles.modalActions}>
            <button className="ep-button secondary" type="button" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button
              className="ep-button primary"
              type="button"
              onClick={async () => {
                await onFinishSession(visibleActiveSession._id!);
                setModal(null);
                setView("history");
              }}
            >
              <Square size={14} aria-hidden="true" />
              Terminar sessão
            </button>
          </div>
        </ModalFrame>
      ) : null}
    </section>
  );
}

function ActiveSession({
  events,
  onCapture,
  onFinish,
  onQuickNote,
  onTogglePause,
  session,
}: {
  events: SessionEventView[];
  onCapture: (modal: Modal) => void;
  onFinish: () => void;
  onQuickNote: (text: string) => Promise<void>;
  onTogglePause: () => Promise<void>;
  session: SessionView;
}) {
  const [quickNote, setQuickNote] = useState("");

  async function saveQuickNote() {
    const value = quickNote.trim();
    if (!value) return;
    await onQuickNote(value);
    setQuickNote("");
  }

  return (
    <div className={styles.activePage}>
      <article className={styles.focusBanner}>
        <div>
          <span>Foco da semana · semana 18</span>
          <p>{session.weeklyFocus}</p>
          <h2>{session.sessionFocus}</h2>
          <small>{session.blockLabel ?? "Sessão sem bloco associado"}</small>
        </div>
        <div className={styles.timerBox}>
          <span>{session.isPaused ? "Em pausa" : "Em curso"}</span>
          <strong>{formatElapsed(session.startedAt)}</strong>
          <small>{formatStartedAt(session.startedAt)} · {session.currentTables} mesas</small>
        </div>
        <div className={styles.intentBox}>
          <Flag size={18} aria-hidden="true" />
          <div>
            <span>Micro-intenção atual</span>
            <strong>{session.microIntention || "Sem micro-intenção definida"}</strong>
          </div>
        </div>
      </article>

      <div className={styles.stateStrip}>
        <StateCell label="Energia" value={`${session.energy} / 5`} />
        <StateCell label="Foco" value={`${session.focusScore} / 5`} />
        <StateCell label="Tilt" value={`${session.tilt} / 5`} warning={session.tilt > 1 ? "acompanhar no break" : undefined} />
        <StateCell label="Mesas" value={String(session.currentTables)} />
        <StateCell label="Mãos a rever" value={`${session.handsToReview} · ver`} />
        <StateCell label="Último check-up" value={getLastCheckupLabel(events)} />
      </div>

      <div className={styles.activeLayout}>
        <article className={styles.capturePanel}>
          <div className={styles.panelHead}>
            <h2>Captura rápida</h2>
            <span>um clique · sem sair de jogo</span>
          </div>
          <div className={styles.captureGrid}>
            <CaptureButton icon={Activity} title="Check-up rápido" detail="Energia · Foco · Tilt · mesas" onClick={() => onCapture("checkup")} />
            <CaptureButton icon={Hand} title="Mão para rever" detail="Marca a mão e adiciona contexto" onClick={() => onCapture("hand")} />
            <CaptureButton icon={Flag} title="Micro-intenção" detail="Foco para a próxima hora" onClick={() => onCapture("checkup")} />
            <label className={styles.quickNoteCard}>
              <span>Nota rápida</span>
              <textarea
                onBlur={saveQuickNote}
                onChange={(event) => setQuickNote(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void saveQuickNote();
                }}
                placeholder="Autopilot, tilt, boa decisão..."
                value={quickNote}
              />
              <small>Guarda ao sair do campo. Cmd/Ctrl+Enter também guarda.</small>
            </label>
          </div>
        </article>

        <article className={styles.timelinePanel}>
          <div className={styles.panelHead}>
            <h2>Linha do tempo</h2>
            <span>últimos 5 eventos</span>
          </div>
          <ol>
            {events.slice(0, 5).map((event) => (
              <li key={`${event.createdAt}-${event.title}`}>
                <time>{formatTime(event.createdAt)}</time>
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.detail}</small>
                </div>
              </li>
            ))}
          </ol>
        </article>

        <aside className={styles.activeSide}>
          <article className={styles.passiveCoach}>
            <div>
              <Sparkles size={15} aria-hidden="true" />
              <span>Observação do Coach</span>
              <em>passivo</em>
            </div>
            <p>
              {session.tilt > 1
                ? "Tilt subiu no último check-up. Mantém-te no plano e evita abrir mais uma mesa nesta hora."
                : "Estado estável. Continua a registar sinais curtos durante os breaks."}
            </p>
            <small>contexto · check-ups da sessão</small>
          </article>
          <button className={`ep-button primary ${styles.actionButton}`} type="button" onClick={onFinish}>
            <Square size={14} aria-hidden="true" />
            Terminar sessão
          </button>
          <button className={`ep-button secondary ${styles.actionButton}`} type="button" onClick={() => void onTogglePause()}>
            <Pause size={14} aria-hidden="true" />
            {session.isPaused ? "Retomar" : "Pausa"}
          </button>
        </aside>
      </div>
    </div>
  );
}

function SessionsTable({
  onOpenActive,
  rows,
}: {
  onOpenActive: () => void;
  rows: {
    date: string;
    focus: string;
    tournaments: number;
    duration: string;
    quality: number;
    tiltPeak: number;
    hands: number;
    status: SessionStatus;
  }[];
}) {
  return (
    <article className={styles.historyPanel}>
      <header className={styles.tableHeader}>
        <span>Data</span>
        <span>Foco</span>
        <span>Mesas</span>
        <span>Duração</span>
        <span>Qual.</span>
        <span>Tilt</span>
        <span>Estado</span>
        <span />
      </header>
      {rows.length ? (
        rows.map((row, index) => (
          <div className={styles.tableRow} key={`${row.date}-${row.focus}-${index}`}>
            <span className={styles.mono}>{row.date}</span>
            <strong>{row.focus}</strong>
            <span className={styles.mono}>{row.tournaments || "-"}</span>
            <span className={styles.mono}>{row.duration}</span>
            <span className={styles.mono}>{row.quality ? `${row.quality}/5` : "-"}</span>
            <span className={styles.mono}>{row.tiltPeak}/5</span>
            <span className={`${styles.statusPill} ${styles[row.status]}`}>{statusCopy[row.status]}</span>
            <button
              aria-label={`Abrir sessão de ${row.date}`}
              className={styles.iconButton}
              type="button"
              onClick={() => (row.status === "active" ? onOpenActive() : undefined)}
            >
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        ))
      ) : (
        <div className={styles.emptyRows}>Ainda não há sessões registadas.</div>
      )}
    </article>
  );
}

function SummaryPanel({ summary }: { summary: { sessions: number; averageQuality: number; hands: number } }) {
  return (
    <article className={styles.summaryPanel}>
      <span>Resumo leve</span>
      <dl>
        <div>
          <dt>Sessões</dt>
          <dd>{summary.sessions}</dd>
        </div>
        <div>
          <dt>Qualidade média</dt>
          <dd>{summary.averageQuality}/5</dd>
        </div>
        <div>
          <dt>Mãos a rever</dt>
          <dd>{summary.hands}</dd>
        </div>
      </dl>
    </article>
  );
}

function CheckupModal({
  initialEnergy,
  initialFocus,
  initialTables,
  initialTilt,
  onClose,
  onSave,
}: {
  initialEnergy: number;
  initialFocus: number;
  initialTables: number;
  initialTilt: number;
  onClose: () => void;
  onSave: (payload: { energy: number; focusScore: number; tilt: number; tables: number; microIntention: string }) => Promise<void>;
}) {
  const [energy, setEnergy] = useState(initialEnergy);
  const [focusScore, setFocusScore] = useState(initialFocus);
  const [tilt, setTilt] = useState(initialTilt);
  const [tables, setTables] = useState(initialTables);
  const [microIntention, setMicroIntention] = useState("");

  return (
    <ModalFrame title="Quick check-up" onClose={onClose}>
      <p className={styles.modalCopy}>Demora 10 segundos. Não saias do jogo.</p>
      <div className={styles.ratingStack}>
        <Rating label="Energia" min={1} value={energy} onChange={setEnergy} />
        <Rating label="Foco" min={1} value={focusScore} onChange={setFocusScore} />
        <Rating label="Tilt" min={1} value={tilt} onChange={setTilt} />
      </div>
      <label className={styles.inlineField}>
        Mesas atuais
        <input value={tables} inputMode="numeric" onChange={(event) => setTables(Number(event.target.value) || 1)} />
      </label>
      <label className={styles.inlineField}>
        Micro-intenção para próxima hora
        <input value={microIntention} placeholder="Opcional" onChange={(event) => setMicroIntention(event.target.value)} />
      </label>
      <TemplatePicker options={microSuggestions} onSelect={setMicroIntention} />
      <div className={styles.modalActions}>
        <button className="ep-button secondary" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="ep-button primary" type="button" onClick={() => void onSave({ energy, focusScore, tilt, tables, microIntention })}>
          <Check size={14} aria-hidden="true" />
          Registar
        </button>
      </div>
    </ModalFrame>
  );
}

function HandModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (payload: { template: string; note: string }) => Promise<void>;
}) {
  const [template, setTemplate] = useState(handTemplates[0]);
  const [note, setNote] = useState("");

  return (
    <ModalFrame title="Marcar mão para rever" onClose={onClose}>
      <TemplatePicker label="Template" options={handTemplates} selected={template} onSelect={setTemplate} />
      <label className={styles.inlineField}>
        Nota opcional
        <textarea placeholder="Stack, posição, raciocínio rápido..." value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <div className={styles.modalActions}>
        <button className="ep-button secondary" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="ep-button primary" type="button" onClick={() => void onSave({ template, note })}>
          Marcar
        </button>
      </div>
    </ModalFrame>
  );
}

function CaptureButton({
  detail,
  icon: Icon,
  onClick,
  title,
}: {
  detail: string;
  icon: typeof Activity;
  onClick: () => void;
  title: string;
}) {
  return (
    <button className={styles.captureButton} type="button" onClick={onClick}>
      <span>
        <Icon size={19} aria-hidden="true" />
      </span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </button>
  );
}

function StateCell({ label, value, warning }: { label: string; value: string; warning?: string }) {
  return (
    <div className={warning ? styles.stateCellWarning : styles.stateCell}>
      <span>{label}</span>
      <strong>{value}</strong>
      {warning ? <small>{warning}</small> : null}
    </div>
  );
}

function ModalFrame({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className={styles.overlay} role="presentation">
      <section aria-label={title} aria-modal="true" className={styles.modal} role="dialog">
        <header>
          <h2>{title}</h2>
          <button aria-label="Fechar" type="button" onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function TemplatePicker({
  label,
  onSelect,
  options,
  selected,
}: {
  label?: string;
  onSelect: (value: string) => void;
  options: string[];
  selected?: string;
}) {
  return (
    <div className={styles.templatePicker}>
      {label ? <span>{label}</span> : null}
      <div>
        {options.map((option) => (
          <button
            className={selected === option ? styles.selectedTemplate : ""}
            key={option}
            type="button"
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Rating({
  label,
  min,
  onChange,
  tone,
  value,
}: {
  label: string;
  min: 1;
  onChange: (value: number) => void;
  tone?: "tilt";
  value: number;
}) {
  return (
    <div className={styles.rating}>
      <span>{label}</span>
      <div>
        {Array.from({ length: 5 }, (_, index) => index + min).map((item) => (
          <button
            className={item === value ? (tone === "tilt" ? styles.selectedTiltRating : styles.selectedRating) : ""}
            key={item}
            type="button"
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function getAverageQuality(rows: { quality: number }[]) {
  const reviewedRows = rows.filter((row) => row.quality > 0);
  if (!reviewedRows.length) return 0;
  return Math.round((reviewedRows.reduce((total, row) => total + row.quality, 0) / reviewedRows.length) * 10) / 10;
}

function formatElapsed(startedAt: number, endedAt = Date.now()) {
  const minutes = Math.max(0, Math.floor((endedAt - startedAt) / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
}

function formatShortDate(value: number) {
  return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(value));
}

function formatStartedAt(value: number) {
  return `iniciada às ${formatTime(value)}`;
}

function formatTime(value: number) {
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function getLastCheckupLabel(events: SessionEventView[]) {
  const checkup = events.find((event) => event.type === "checkup");
  if (!checkup) return "sem check-up";
  const minutes = Math.max(0, Math.floor((Date.now() - checkup.createdAt) / 60000));
  return minutes < 1 ? "agora" : `há ${minutes} min`;
}
