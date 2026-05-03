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
import { hasPersistenceConfig } from "@/lib/runtime-config";
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
  tournamentsPlayed?: number;
  decisionQuality?: number;
  finalFocus?: number;
  finalEnergy?: number;
  finalTilt?: number;
  goodDecision?: string;
  mainLeak?: string;
  nextAction?: string;
  startedAt: number;
  endedAt?: number;
};

type SessionRow = {
  _id?: Id<"pokerSessions">;
  date: string;
  focus: string;
  tournaments: number;
  duration: string;
  quality: number;
  tiltPeak: number;
  hands: number;
  status: SessionStatus;
};

type SessionEventView = {
  _id?: Id<"pokerSessionEvents">;
  type: EventType;
  title: string;
  detail: string;
  createdAt: number;
};

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

const demoPendingReviewSession: SessionView = {
  ...demoSession,
  status: "reviewPending",
  endedAt: Date.now() - 12 * 60 * 1000,
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
  const confirmReview = useMutation(api.pokerSession.confirmReview);
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
    tournaments: session.tournamentsPlayed ?? 0,
    duration: formatElapsed(session.startedAt, session.endedAt),
    quality: session.decisionQuality ?? 0,
    tiltPeak: session.finalTilt ?? session.tilt,
    hands: session.handsToReview,
    status: session.status as SessionStatus,
  }));
  const pendingReviewSession = sessions.find((session) => session.status === "reviewPending") ?? null;

  return (
    <SessionsWorkspace
      activeSession={activeSession as SessionView | null}
      events={(events ?? []) as SessionEventView[]}
      grindBlocks={grindBlocks}
      onAddEvent={async (sessionId, event) => {
        await addEvent({ sessionId, ...event });
      }}
      onConfirmReview={async (sessionId, review) => {
        await confirmReview({ sessionId, ...review });
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
      pendingReviewSession={pendingReviewSession as SessionView | null}
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
      onConfirmReview={async () => undefined}
      onFinishSession={async () => undefined}
      onStartSession={async () => undefined}
      onTogglePause={async () => undefined}
      pendingReviewSession={demoPendingReviewSession}
      rows={[
        {
          _id: demoPendingReviewSession._id,
          date: "Hoje",
          focus: demoSession.sessionFocus,
          tournaments: 42,
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
  onConfirmReview,
  onFinishSession,
  onStartSession,
  onTogglePause,
  pendingReviewSession,
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
  onConfirmReview: (
    sessionId: Id<"pokerSessions">,
    review: {
      tournamentsPlayed: number;
      decisionQuality: number;
      finalFocus: number;
      finalEnergy: number;
      finalTilt: number;
      goodDecision?: string;
      mainLeak?: string;
      nextAction?: string;
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
  pendingReviewSession: SessionView | null;
  rows: SessionRow[];
}) {
  const [modal, setModal] = useState<Modal>(null);
  const [view, setView] = useState<"history" | "active">(activeSession ? "active" : "history");
  const [demoActiveSession, setDemoActiveSession] = useState<SessionView | null>(null);
  const [demoPendingReviewSession, setDemoPendingReviewSession] = useState<SessionView | null>(pendingReviewSession);
  const [demoRows, setDemoRows] = useState<SessionRow[]>(rows);
  const [startFocus, setStartFocus] = useState("Disciplina em ICM até bolha");
  const [selectedBlockId, setSelectedBlockId] = useState(grindBlocks[0]?.id ?? "none");
  const [maxTables, setMaxTables] = useState(6);
  const [energy, setEnergy] = useState(4);
  const [focusScore, setFocusScore] = useState(4);
  const [tilt, setTilt] = useState(1);
  const [microIntention, setMicroIntention] = useState("");
  const [tournamentsPlayed, setTournamentsPlayed] = useState(0);
  const [decisionQuality, setDecisionQuality] = useState(4);
  const [finalFocus, setFinalFocus] = useState(4);
  const [finalEnergy, setFinalEnergy] = useState(3);
  const [finalTilt, setFinalTilt] = useState(1);
  const [goodDecision, setGoodDecision] = useState("");
  const [mainLeak, setMainLeak] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [reviewSession, setReviewSession] = useState<SessionView | null>(null);
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBlock = grindBlocks.find((block) => block.id === selectedBlockId);
  const effectivePendingReviewSession = demoMode ? demoPendingReviewSession : pendingReviewSession;
  const effectiveRows = demoMode ? demoRows : rows;
  const visibleActiveSession = activeSession ?? demoActiveSession;
  const summary = useMemo(
    () => ({
      sessions: effectiveRows.length,
      averageQuality: getAverageQuality(effectiveRows),
      averageFinalTilt: getAverageFinalTilt(effectiveRows),
      hands: effectiveRows.reduce((total, row) => total + row.hands, 0),
      pendingReviews: effectiveRows.filter((row) => row.status === "reviewPending").length,
      reviewedSessions: effectiveRows.filter((row) => row.status === "reviewed").length,
      tournaments: effectiveRows.reduce((total, row) => total + row.tournaments, 0),
    }),
    [effectiveRows],
  );
  const sessionInsight = getSessionInsight(summary);

  async function submitStartSession() {
    await runSessionAction(async () => {
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
      if (demoMode) {
        setDemoActiveSession({
          ...demoSession,
          sessionFocus: startFocus,
          blockLabel: selectedBlock ? `Grind · ${selectedBlock.title}${selectedBlock.target ? ` (${selectedBlock.target})` : ""}` : undefined,
          maxTables,
          currentTables: maxTables,
          energy,
          focusScore,
          tilt,
          microIntention: microIntention.trim() || undefined,
          startedAt: Date.now(),
          endedAt: undefined,
          status: "active",
        });
      }
      setModal(null);
      setView("active");
    });
  }

  function openReviewModal(session: SessionView) {
    setActionError("");
    setReviewSession(session);
    setTournamentsPlayed(session.tournamentsPlayed ?? 0);
    setDecisionQuality(session.decisionQuality ?? 4);
    setFinalFocus(session.finalFocus ?? session.focusScore);
    setFinalEnergy(session.finalEnergy ?? session.energy);
    setFinalTilt(session.finalTilt ?? session.tilt);
    setGoodDecision(session.goodDecision ?? "");
    setMainLeak(session.mainLeak ?? "");
    setNextAction(session.nextAction ?? "");
    setModal("review");
  }

  async function runSessionAction(action: () => Promise<void>) {
    setActionError("");
    setIsSubmitting(true);

    try {
      await action();
    } catch (error) {
      setActionError(getActionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="ep-page">
      {banner ? <div className="wp-demo-banner">{banner}</div> : null}

      {visibleActiveSession && view === "active" ? (
        <ActiveSession
          events={events}
          onCapture={setModal}
          onFinish={() => openReviewModal(visibleActiveSession)}
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
          ) : effectivePendingReviewSession ? (
            <article className={styles.statusCard}>
              <div>
                <span>Review pendente</span>
                <h2>{effectivePendingReviewSession.sessionFocus}</h2>
                <p>{formatElapsed(effectivePendingReviewSession.startedAt, effectivePendingReviewSession.endedAt)} · {effectivePendingReviewSession.handsToReview} mãos marcadas</p>
              </div>
              <button className="ep-button primary" type="button" onClick={() => openReviewModal(effectivePendingReviewSession)}>
                Terminar review
              </button>
            </article>
          ) : null}

          <div className={styles.sessionLayout}>
            <SessionsTable
              rows={effectiveRows}
              onOpenActive={() => setView("active")}
              onOpenReview={(sessionId) => {
                if (effectivePendingReviewSession?._id === sessionId) {
                  openReviewModal(effectivePendingReviewSession);
                }
              }}
            />
            <aside className={styles.sideStack}>
              <SummaryPanel summary={summary} />
              <article className={styles.coachPanel}>
                <Sparkles size={17} aria-hidden="true" />
                <div>
                  <span>Coach AI</span>
                  <p>{sessionInsight}</p>
                  <small>contexto · reviews + mãos marcadas</small>
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
            <button className="ep-button primary" type="button" disabled={isSubmitting} onClick={submitStartSession}>
              <Play size={15} aria-hidden="true" />
              {isSubmitting ? "A iniciar..." : "Iniciar sessão"}
            </button>
          </div>
          {actionError ? <p className={styles.actionError}>{actionError}</p> : null}
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

      {reviewSession?._id && modal === "review" ? (
        <ModalFrame title="Terminar sessão" onClose={() => setModal(null)}>
          <p className={styles.modalCopy}>Fecha com os sinais mínimos que vão alimentar a review semanal e o Coach.</p>
          <div className={styles.formGrid}>
            <label>
              Duração
              <input disabled value={formatElapsed(reviewSession.startedAt, reviewSession.endedAt)} />
            </label>
            <label>
              Mãos marcadas
              <input disabled value={reviewSession.handsToReview} />
            </label>
            <label>
              Torneios jogados
              <input
                inputMode="numeric"
                min={0}
                value={tournamentsPlayed}
                onChange={(event) => setTournamentsPlayed(Number(event.target.value) || 0)}
              />
            </label>
            <label>
              Qualidade decisão
              <select value={decisionQuality} onChange={(event) => setDecisionQuality(Number(event.target.value))}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value}/5</option>
                ))}
              </select>
            </label>
          </div>
          <section className={styles.initialStateBox}>
            <header>
              <span>Estado final</span>
              <small>obrigatório</small>
            </header>
            <div className={styles.ratingGrid}>
              <Rating label="Energia" min={1} value={finalEnergy} onChange={setFinalEnergy} />
              <Rating label="Foco" min={1} value={finalFocus} onChange={setFinalFocus} />
              <Rating label="Tilt" min={1} tone="tilt" value={finalTilt} onChange={setFinalTilt} />
            </div>
          </section>
          <div className={styles.formGrid}>
            <label className={styles.fullField}>
              Boa decisão
              <textarea
                placeholder="Opcional: algo que queres repetir"
                value={goodDecision}
                onChange={(event) => setGoodDecision(event.target.value)}
              />
            </label>
            <label className={styles.fullField}>
              Principal leak
              <textarea
                placeholder="Opcional: padrão ou erro principal"
                value={mainLeak}
                onChange={(event) => setMainLeak(event.target.value)}
              />
            </label>
            <label className={styles.fullField}>
              Próxima ação
              <textarea
                placeholder="Opcional: rever bloco, estudar spot, reduzir mesas..."
                value={nextAction}
                onChange={(event) => setNextAction(event.target.value)}
              />
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
              className="ep-button secondary"
              disabled={isSubmitting}
              type="button"
              onClick={() => {
                void runSessionAction(async () => {
                  if (reviewSession.status === "active") {
                    await onFinishSession(reviewSession._id!);
                  }
                  if (demoMode) {
                    const nextSession = {
                      ...reviewSession,
                      status: "reviewPending" as const,
                      endedAt: reviewSession.endedAt ?? Date.now(),
                    };
                    setDemoActiveSession(null);
                    setDemoPendingReviewSession(nextSession);
                    setDemoRows((current) =>
                      upsertSessionRow(
                        current,
                        buildSessionRow(nextSession, {
                          tournaments: tournamentsPlayed,
                          quality: 0,
                          tiltPeak: finalTilt,
                        }),
                      ),
                    );
                  }
                  setModal(null);
                  setReviewSession(null);
                  setView("history");
                });
              }}
            >
              {isSubmitting ? "A guardar..." : "Guardar rascunho"}
            </button>
            <button
              className="ep-button primary"
              disabled={isSubmitting}
              type="button"
              onClick={() => {
                void runSessionAction(async () => {
                  await onConfirmReview(reviewSession._id!, {
                    tournamentsPlayed,
                    decisionQuality,
                    finalFocus,
                    finalEnergy,
                    finalTilt,
                    goodDecision: goodDecision.trim() || undefined,
                    mainLeak: mainLeak.trim() || undefined,
                    nextAction: nextAction.trim() || undefined,
                  });
                  if (demoMode) {
                    const reviewedSession = {
                      ...reviewSession,
                      status: "reviewed" as const,
                      endedAt: reviewSession.endedAt ?? Date.now(),
                      tournamentsPlayed,
                      decisionQuality,
                      finalFocus,
                      finalEnergy,
                      finalTilt,
                      goodDecision: goodDecision.trim() || undefined,
                      mainLeak: mainLeak.trim() || undefined,
                      nextAction: nextAction.trim() || undefined,
                    };
                    setDemoActiveSession(null);
                    setDemoPendingReviewSession((current) =>
                      current?._id === reviewedSession._id ? null : current,
                    );
                    setDemoRows((current) =>
                      upsertSessionRow(
                        current,
                        buildSessionRow(reviewedSession, {
                          tournaments: tournamentsPlayed,
                          quality: decisionQuality,
                          tiltPeak: finalTilt,
                        }),
                      ),
                    );
                  }
                  setModal(null);
                  setReviewSession(null);
                  setView("history");
                });
              }}
            >
              <Check size={14} aria-hidden="true" />
              {isSubmitting ? "A confirmar..." : "Confirmar review"}
            </button>
          </div>
          {actionError ? <p className={styles.actionError}>{actionError}</p> : null}
        </ModalFrame>
      ) : null}
    </section>
  );
}

function buildSessionRow(
  session: SessionView,
  overrides: {
    tournaments: number;
    quality: number;
    tiltPeak: number;
  },
): SessionRow {
  return {
    _id: session._id,
    date: session.date === todayIsoDate ? "Hoje" : formatShortDate(session.startedAt),
    focus: session.sessionFocus,
    tournaments: overrides.tournaments,
    duration: formatElapsed(session.startedAt, session.endedAt),
    quality: overrides.quality,
    tiltPeak: overrides.tiltPeak,
    hands: session.handsToReview,
    status: session.status,
  };
}

function upsertSessionRow(rows: SessionRow[], nextRow: SessionRow) {
  const existingIndex = rows.findIndex((row) => row._id === nextRow._id);

  if (existingIndex === -1) {
    return [nextRow, ...rows];
  }

  return rows.map((row, index) => (index === existingIndex ? nextRow : row));
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
  onOpenReview,
  rows,
}: {
  onOpenActive: () => void;
  onOpenReview: (sessionId: Id<"pokerSessions">) => void;
  rows: SessionRow[];
}) {
  return (
    <article className={styles.historyPanel}>
      <header className={styles.tableHeader}>
        <span>Data</span>
        <span>Foco</span>
        <span>Torneios</span>
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
              onClick={() => {
                if (row.status === "active") onOpenActive();
                if (row.status === "reviewPending" && row._id) onOpenReview(row._id);
              }}
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

function SummaryPanel({
  summary,
}: {
  summary: {
    sessions: number;
    averageQuality: number;
    averageFinalTilt: number;
    hands: number;
    pendingReviews: number;
    reviewedSessions: number;
    tournaments: number;
  };
}) {
  return (
    <article className={styles.summaryPanel}>
      <span>Resumo leve</span>
      <dl>
        <div>
          <dt>Sessões</dt>
          <dd>{summary.sessions}</dd>
        </div>
        <div>
          <dt>Revistas</dt>
          <dd>{summary.reviewedSessions}</dd>
        </div>
        <div>
          <dt>Reviews pendentes</dt>
          <dd>{summary.pendingReviews}</dd>
        </div>
        <div>
          <dt>Torneios</dt>
          <dd>{summary.tournaments || "-"}</dd>
        </div>
        <div>
          <dt>Qualidade média</dt>
          <dd>{summary.averageQuality ? `${summary.averageQuality}/5` : "-"}</dd>
        </div>
        <div>
          <dt>Tilt final médio</dt>
          <dd>{summary.averageFinalTilt ? `${summary.averageFinalTilt}/5` : "-"}</dd>
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

function getAverageFinalTilt(rows: { status: SessionStatus; tiltPeak: number }[]) {
  const reviewedRows = rows.filter((row) => row.status === "reviewed");
  if (!reviewedRows.length) return 0;
  return Math.round((reviewedRows.reduce((total, row) => total + row.tiltPeak, 0) / reviewedRows.length) * 10) / 10;
}

function getSessionInsight(summary: {
  averageFinalTilt: number;
  hands: number;
  pendingReviews: number;
  reviewedSessions: number;
}) {
  if (summary.pendingReviews > 0) {
    return `${summary.pendingReviews} review${summary.pendingReviews > 1 ? "s" : ""} pendente${summary.pendingReviews > 1 ? "s" : ""}. Fecha antes de tirar conclusões da semana.`;
  }

  if (summary.hands >= 5) {
    return "Há várias mãos marcadas. Faz sentido reservar um bloco curto de revisão antes da próxima sessão.";
  }

  if (summary.reviewedSessions > 0 && summary.averageFinalTilt >= 3) {
    return "Tilt final médio elevado nas sessões revistas. Mantém atenção à energia e ao número de mesas.";
  }

  if (summary.reviewedSessions > 0) {
    return "Reviews confirmadas já dão contexto útil para padrões de qualidade, tilt e próximas ações.";
  }

  return "Mãos marcadas, check-ups e notas rápidas entram como contexto para análise futura.";
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

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("Could not find public function")) {
    return "As funções Convex ainda não estão atualizadas. Corre `npx convex dev --once` e tenta outra vez.";
  }

  return "Não foi possível guardar agora. Tenta novamente.";
}
