"use client";

import {
  ArrowUp,
  Check,
  CircleDot,
  Clock3,
  CircleHelp,
  Edit3,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  getTodayIsoDate,
  type StoredBlockType,
} from "@/lib/planning/weekly-plan";
import { hasPersistenceConfig } from "@/lib/runtime-config";

type ReviewStatus = "available" | "draft" | "completed" | "skipped";

type CoachContext = {
  isDemo: boolean;
  weeklyPlanState: string;
  weeklyPlanScope: string;
  monthlyGoalsState: string;
  studyLogState: string;
  studyWeeklyMinutes: number;
  studyMonthlyMinutes: number;
  studyAverageQuality: number;
  studyTopType?: string;
  studyPaceState: "missing-target" | "no-logs" | "below" | "on" | "complete";
  sessionsState: string;
  reviewState: string;
  reviewStatus: ReviewStatus;
  reviewedSessions: number;
  pendingSessionReviews: number;
  handsToReview: number;
  averageDecisionQuality: number;
  averageFinalTilt: number;
  adjustmentNextWeek: string;
  wins: string;
  leaks: string;
  nextActions: string[];
};

type CoachProposal = {
  title: string;
  scope: string;
  items: CoachProposalItem[];
};

type CoachProposalItem = {
  dayIndex: number;
  dayLabel: string;
  time: string;
  type: StoredBlockType;
  typeLabel: string;
  topic: string;
  targetLabel: string;
  detail: string;
};

type CoachPlanBlock = {
  dayIndex: number;
  type: StoredBlockType;
  title: string;
  targetLabel?: string;
  source?: "coachProposal";
  status: "planned";
  order: number;
};

type CoachPlanChange = {
  action: "addBlock";
  block: CoachPlanBlock;
  source: "coachProposal";
};

type CoachPlanApplyPayload = {
  proposalTitle: string;
  changes: CoachPlanChange[];
};

type CoachApplyResult = {
  applied: boolean;
  applicationId?: Id<"coachProposalApplications">;
  message?: string;
  undoExpiresAt?: number;
};

type CoachShellProps = {
  context: CoachContext;
  hasActiveApplication?: boolean;
  activeUndoExpiresAt?: number;
  onApplyProposal?: (payload: CoachPlanApplyPayload) => Promise<CoachApplyResult>;
  onUndoProposal?: () => Promise<CoachApplyResult>;
};

const dayOptions = [
  { dayIndex: 1, label: "Segunda" },
  { dayIndex: 2, label: "Terça" },
  { dayIndex: 3, label: "Quarta" },
  { dayIndex: 4, label: "Quinta" },
  { dayIndex: 5, label: "Sexta" },
  { dayIndex: 6, label: "Sábado" },
  { dayIndex: 0, label: "Domingo" },
];

const typeOptions: Array<{ value: StoredBlockType; label: string }> = [
  { value: "study", label: "Estudo" },
  { value: "review", label: "Review" },
  { value: "grind", label: "Grind" },
  { value: "sport", label: "Desporto" },
  { value: "rest", label: "Descanso" },
  { value: "admin", label: "Admin" },
];

const fallbackApplyResult: CoachApplyResult = {
  applied: true,
  message: "Alteração aplicada ao plano",
};
const fallbackUndoWindowMs = 30_000;

type ProposalStage = "summary" | "review" | "edit" | "confirm" | "applied";

const todayIsoDate = getTodayIsoDate();

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

const currentMonth = getCurrentMonth();

const promptChips = [
  "Ajusta esta semana",
  "Analisa o ritmo do mês",
  "Sugere uma sessão de estudo",
  "Analisa as últimas sessões",
  "Estou perdido - o que devo fazer hoje?",
];

const demoCoachContext: CoachContext = {
  isDemo: true,
  weeklyPlanState: "Ativo",
  weeklyPlanScope: "Plano da semana demo",
  monthlyGoalsState: "Demo",
  studyLogState: "1h55 registadas · abaixo do ritmo",
  studyWeeklyMinutes: 115,
  studyMonthlyMinutes: 410,
  studyAverageQuality: 4,
  studyTopType: "Solver",
  studyPaceState: "below",
  sessionsState: "3 sessões usadas",
  reviewState: "Rascunho demo",
  reviewStatus: "draft",
  reviewedSessions: 3,
  pendingSessionReviews: 2,
  handsToReview: 5,
  averageDecisionQuality: 4,
  averageFinalTilt: 2,
  adjustmentNextWeek: "Fazer review antes da sessão de domingo.",
  wins: "Tilt baixo nas sessões longas.",
  leaks: "Estudo caiu quando a manhã atrasou.",
  nextActions: ["Fazer review antes da sessão de domingo.", "Reduzir mesas se energia ficar em 2/5."],
};

export function CoachWorkspace() {
  if (!hasPersistenceConfig) {
    return <CoachShell context={demoCoachContext} />;
  }

  return <PersistedCoachWorkspace />;
}

function PersistedCoachWorkspace() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const weeklyPlan = useQuery(api.weeklyPlan.getCurrent, isAuthenticated ? { today: todayIsoDate } : "skip");
  const monthlyTargets = useQuery(api.monthlyTarget.listForMonth, isAuthenticated ? { month: currentMonth } : "skip");
  const studyContext = useQuery(
    api.studySession.getCurrent,
    isAuthenticated ? { today: todayIsoDate, month: currentMonth } : "skip",
  );
  const sessions = useQuery(api.pokerSession.list, isAuthenticated ? {} : "skip");
  const weeklyReview = useQuery(
    api.weeklyReview.getByWeek,
    isAuthenticated && weeklyPlan ? { weekStartDate: weeklyPlan.weekStartDate } : "skip",
  );
  const activeApplication = useQuery(
    api.coachProposal.getActive,
    isAuthenticated && weeklyPlan?.currentPlan ? { weeklyPlanId: weeklyPlan.currentPlan._id } : "skip",
  );
  const applyCoachProposal = useMutation(api.coachProposal.apply);
  const undoCoachProposal = useMutation(api.coachProposal.undo);
  const [applicationId, setApplicationId] = useState<Id<"coachProposalApplications"> | null>(null);

  const isFetching =
    isLoading ||
    (isAuthenticated &&
      (weeklyPlan === undefined ||
        monthlyTargets === undefined ||
        studyContext === undefined ||
        sessions === undefined ||
        weeklyReview === undefined));

  const context = useMemo<CoachContext>(() => {
    if (!isAuthenticated || !weeklyPlan || !monthlyTargets || !studyContext || !sessions || weeklyReview === undefined) {
      return {
        ...demoCoachContext,
        isDemo: true,
        weeklyPlanState: isFetching ? "A carregar" : "Demo",
        weeklyPlanScope: isFetching ? "Plano da semana a carregar" : "Plano da semana demo",
        monthlyGoalsState: isFetching ? "A carregar" : "Demo",
        studyLogState: isFetching ? "A carregar" : demoCoachContext.studyLogState,
        sessionsState: isFetching ? "A carregar" : "Demo",
        reviewState: isFetching ? "A carregar" : "Demo",
      };
    }

    const reviewedSessions = sessions.filter((session) => session.status === "reviewed");
    const pendingSessionReviews = sessions.filter((session) => session.status === "reviewPending");
    const recentSessions = sessions.slice(0, 3);
    const reviewStatus = weeklyReview?.status ?? "available";
    const studyTarget = monthlyTargets.find((target) => target.category === "study");
    const studyPaceState = getStudyPaceState(studyTarget?.currentValue ?? 0, studyTarget?.targetValue ?? 0);

    return {
      isDemo: false,
      weeklyPlanState: weeklyPlan.currentPlan ? "Ativo" : "Sem plano ativo",
      weeklyPlanScope: formatWeekScope(weeklyPlan.weekStartDate),
      monthlyGoalsState: getMonthlyGoalsState(monthlyTargets.length),
      studyLogState: getStudyLogState(studyContext.weeklySummary.minutes, studyPaceState),
      studyWeeklyMinutes: studyContext.weeklySummary.minutes,
      studyMonthlyMinutes: studyContext.monthlySummary.minutes,
      studyAverageQuality: studyContext.weeklySummary.averageQuality,
      studyTopType: studyContext.weeklySummary.topStudyType,
      studyPaceState,
      sessionsState: recentSessions.length ? `${recentSessions.length} sessões usadas` : "Sem sessões",
      reviewState: getReviewStateCopy(reviewStatus),
      reviewStatus,
      reviewedSessions: reviewedSessions.length,
      pendingSessionReviews: pendingSessionReviews.length,
      handsToReview: sessions.reduce((total, session) => total + session.handsToReview, 0),
      averageDecisionQuality: average(reviewedSessions.map((session) => session.decisionQuality)),
      averageFinalTilt: average(reviewedSessions.map((session) => session.finalTilt)),
      adjustmentNextWeek: weeklyReview?.adjustmentNextWeek ?? "",
      wins: weeklyReview?.wins ?? "",
      leaks: weeklyReview?.leaks ?? "",
      nextActions: reviewedSessions
        .map((session) => session.nextAction?.trim())
        .filter((value): value is string => Boolean(value))
        .slice(0, 2),
    };
  }, [isAuthenticated, isFetching, monthlyTargets, sessions, studyContext, weeklyPlan, weeklyReview]);

  const currentPlan = weeklyPlan?.currentPlan ?? null;
  const activeApplicationId = applicationId ?? activeApplication?._id ?? null;

  return (
    <CoachShell
      context={context}
      hasActiveApplication={Boolean(activeApplication)}
      activeUndoExpiresAt={activeApplication?.undoExpiresAt}
      onApplyProposal={
        isAuthenticated && weeklyPlan && !currentPlan
          ? async () => ({
              applied: false,
              message: "Cria ou ativa um plano semanal antes de aplicar propostas do Coach.",
            })
          : isAuthenticated && weeklyPlan && currentPlan
          ? async (payload) => {
              const result = await applyCoachProposal({
                weeklyPlanId: currentPlan._id,
                proposalTitle: payload.proposalTitle,
                changes: payload.changes,
              });
              setApplicationId(result.applicationId);

              return {
                applied: true,
                applicationId: result.applicationId,
                undoExpiresAt: result.undoExpiresAt,
              };
            }
          : undefined
      }
      onUndoProposal={
        isAuthenticated && activeApplicationId
          ? async () => {
              await undoCoachProposal({ applicationId: activeApplicationId });
              setApplicationId(null);

              return {
                applied: true,
                message: "Alteração anulada",
              };
            }
          : undefined
      }
    />
  );
}

function CoachShell({
  context,
  hasActiveApplication = false,
  activeUndoExpiresAt,
  onApplyProposal,
  onUndoProposal,
}: CoachShellProps) {
  const [proposal, setProposal] = useState(() => buildEditableProposal(context));
  const [proposalStage, setProposalStage] = useState<ProposalStage>("summary");
  const [actionError, setActionError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [localUndoExpiresAt, setLocalUndoExpiresAt] = useState<number | undefined>();
  const [now, setNow] = useState(() => Date.now());
  const currentProposalStage: ProposalStage = hasActiveApplication ? "applied" : proposalStage;
  const undoExpiresAt = activeUndoExpiresAt ?? localUndoExpiresAt;
  const undoRemainingMs = undoExpiresAt ? Math.max(0, undoExpiresAt - now) : fallbackUndoWindowMs;
  const undoRemainingSeconds = Math.ceil(undoRemainingMs / 1000);
  const undoExpired = Boolean(undoExpiresAt && undoRemainingMs <= 0);
  const contextSources = [
    { label: "Plano semanal", state: context.weeklyPlanState },
    { label: "Objetivos mensais", state: context.monthlyGoalsState },
    ...(context.studyWeeklyMinutes || context.studyMonthlyMinutes
      ? [{ label: "Registo de estudo", state: context.studyLogState }]
      : []),
    { label: "3 últimas sessões", state: context.sessionsState },
    { label: "Revisão semanal", state: context.reviewState },
  ];

  function updateProposalItem(index: number, patch: Partial<CoachProposalItem>) {
    setProposal((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? normalizeProposalItem({ ...item, ...patch }) : item,
      ),
    }));
  }

  function removeProposalItem(index: number) {
    setProposal((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function resetProposal() {
    setProposal(buildEditableProposal(context));
    setProposalStage("summary");
    setLocalUndoExpiresAt(undefined);
    setActionError("");
  }

  async function applyProposal() {
    setActionError("");

    if (!proposal.items.length) {
      setActionError("Mantém pelo menos uma alteração antes de aplicar.");
      return;
    }

    setIsApplying(true);

    try {
      const result = await (onApplyProposal?.(buildApplyPayload(proposal)) ?? Promise.resolve(fallbackApplyResult));

      if (!result.applied) {
        setActionError(result.message ?? "Não foi possível aplicar a proposta.");
        return;
      }

      setNow(Date.now());
      setLocalUndoExpiresAt(result.undoExpiresAt ?? Date.now() + fallbackUndoWindowMs);
      setProposalStage("applied");
    } catch (error) {
      setActionError(getActionErrorMessage(error));
    } finally {
      setIsApplying(false);
    }
  }

  async function undoProposal() {
    setActionError("");
    setIsApplying(true);

    try {
      const result = await (onUndoProposal?.() ?? Promise.resolve(fallbackApplyResult));

      if (!result.applied) {
        setActionError(result.message ?? "Não foi possível anular a alteração.");
        return;
      }

      setLocalUndoExpiresAt(undefined);
      setProposalStage("review");
    } catch (error) {
      setActionError(getActionErrorMessage(error));
    } finally {
      setIsApplying(false);
    }
  }

  useEffect(() => {
    if (currentProposalStage !== "applied" || !undoExpiresAt || undoExpired) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [currentProposalStage, undoExpired, undoExpiresAt]);

  return (
    <section className="ep-coach-page" aria-labelledby="coach-title">
      <header className="ep-coach-header">
        <div>
          <span className="ep-coach-eyebrow">Coach AI</span>
          <h1 id="coach-title">Coach</h1>
          <p>Direto, calmo, prático. Nunca aplica alterações sem o teu OK.</p>
        </div>
      </header>

      <div className="ep-coach-shell">
        <main className="ep-coach-chat" aria-label="Conversa com Coach AI">
          <article className="ep-coach-message user">
            <div className="ep-coach-avatar">
              <Edit3 size={14} aria-hidden="true" />
            </div>
            <div>
              <p>Estudo está abaixo do ritmo. O que faço esta semana?</p>
              <time>Hoje · 10:24</time>
            </div>
          </article>

          <article className="ep-coach-message coach">
            <div className="ep-coach-avatar">
              <Sparkles size={15} aria-hidden="true" />
            </div>
            <div>
              <p>{getCoachReply(context)}</p>
            </div>
          </article>

          {currentProposalStage === "applied" ? (
            <article className="ep-coach-applied" aria-label="Alteração aplicada">
              <span>
                <Check size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>Alteração aplicada ao plano</strong>
                <small>
                  {undoExpired
                    ? `${getProposalScope(proposal)} · Undo expirado`
                    : `${getProposalScope(proposal)} · podes anular durante ${undoRemainingSeconds}s`}
                </small>
              </div>
              <button type="button" disabled={isApplying || undoExpired} onClick={() => void undoProposal()}>
                {isApplying ? "A anular..." : undoExpired ? "Undo expirado" : `Anular (${undoRemainingSeconds}s)`}
              </button>
            </article>
          ) : (
            <article className={`ep-coach-proposal ${currentProposalStage === "summary" ? "compact" : ""}`} aria-label="Proposta do Coach">
              <div className="ep-coach-proposal-head">
                <span className="ep-coach-pill">Proposta</span>
                <h2>{getProposalTitle(proposal)}</h2>
                <p>{getProposalScope(proposal)}</p>
              </div>

              {currentProposalStage === "summary" ? (
                <>
                  <p className="ep-coach-proposal-copy">
                    {formatChangeCount(proposal.items.length)} ao plano. Nada é aplicado até confirmares.
                  </p>
                  <div className="ep-coach-actions">
                    <button className="ep-coach-button text" type="button" onClick={resetProposal}>
                      Ignorar
                    </button>
                    <button className="ep-coach-button ghost" type="button" onClick={() => setProposalStage("review")}>
                      <Search size={17} aria-hidden="true" />
                      Rever proposta
                    </button>
                  </div>
                </>
              ) : null}

              {currentProposalStage === "review" || currentProposalStage === "edit" ? (
                <>
                  <div className="ep-coach-proposal-list">
                    {proposal.items.map((item, index) => (
                      <div className="ep-coach-proposal-row" key={`proposal-item-${index}`}>
                        <span>
                          <Plus size={17} aria-hidden="true" />
                        </span>
                        <div>
                          {currentProposalStage === "edit" ? (
                            <div className="ep-coach-structured-edit" aria-label={`Editar bloco ${index + 1}`}>
                              <label>
                                Dia
                                <select
                                  value={item.dayIndex}
                                  onChange={(event) => {
                                    const nextDay = getDayOption(Number(event.target.value));
                                    updateProposalItem(index, {
                                      dayIndex: nextDay.dayIndex,
                                      dayLabel: nextDay.label,
                                    });
                                  }}
                                >
                                  {dayOptions.map((option) => (
                                    <option key={option.dayIndex} value={option.dayIndex}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Hora
                                <input
                                  aria-label={`Hora do bloco ${index + 1}`}
                                  value={item.time}
                                  onChange={(event) => updateProposalItem(index, { time: event.target.value })}
                                />
                              </label>
                              <label>
                                Tipo
                                <select
                                  value={item.type}
                                  onChange={(event) => {
                                    const nextType = getTypeOption(event.target.value as StoredBlockType);
                                    updateProposalItem(index, {
                                      type: nextType.value,
                                      typeLabel: nextType.label,
                                    });
                                  }}
                                >
                                  {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Tema
                                <input
                                  aria-label={`Tema do bloco ${index + 1}`}
                                  value={item.topic}
                                  onChange={(event) => updateProposalItem(index, { topic: event.target.value })}
                                />
                              </label>
                            </div>
                          ) : (
                            <strong>{formatProposalItemTitle(item)}</strong>
                          )}
                          <small>{item.detail}</small>
                        </div>
                        {currentProposalStage === "edit" ? (
                          <button
                            aria-label={`Eliminar bloco ${index + 1}`}
                            className="ep-coach-remove"
                            type="button"
                            onClick={() => removeProposalItem(index)}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="ep-coach-proposal-footer">
                    <div className="ep-coach-confirm-box">
                      <Lock size={15} aria-hidden="true" />
                      <span>Não é aplicado até confirmares.</span>
                    </div>
                    <div className="ep-coach-actions">
                      <button className="ep-coach-button text" type="button" onClick={resetProposal}>
                        Ignorar
                      </button>
                      {currentProposalStage === "edit" ? (
                        <button className="ep-coach-button dark" type="button" onClick={() => setProposalStage("review")}>
                          <Edit3 size={17} aria-hidden="true" />
                          Concluir edição
                        </button>
                      ) : (
                        <button className="ep-coach-button ghost" type="button" onClick={() => setProposalStage("edit")}>
                          <Edit3 size={17} aria-hidden="true" />
                          Editar
                        </button>
                      )}
                      <button
                        className="ep-coach-button primary"
                        disabled={!proposal.items.length}
                        type="button"
                        onClick={() => setProposalStage("confirm")}
                      >
                        <Check size={16} aria-hidden="true" />
                        Aplicar alteração
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {currentProposalStage === "confirm" ? (
                <div className="ep-coach-submit-row">
                  <span>
                    <CircleHelp size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Aplicar {formatChangeCount(proposal.items.length)} ao plano?</strong>
                    <small>Vais poder anular durante 30 segundos depois de aplicar.</small>
                  </div>
                  <button className="ep-coach-button ghost" type="button" onClick={() => setProposalStage("review")}>
                    Cancelar
                  </button>
                  <button className="ep-coach-button primary" disabled={isApplying} type="button" onClick={() => void applyProposal()}>
                    <Check size={16} aria-hidden="true" />
                    {isApplying ? "A aplicar..." : "Sim, aplicar"}
                  </button>
                </div>
              ) : null}
              {actionError ? <p className="ep-coach-action-error">{actionError}</p> : null}
            </article>
          )}

          <section className="ep-coach-composer" aria-label="Perguntar ao Coach">
            <textarea placeholder="Pergunta ao Coach..." rows={3} />
            <div className="ep-coach-composer-footer">
              <div className="ep-coach-context-line">
                <span />
                Contexto: plano semanal + registo de estudo + revisão semanal + sessões recentes
              </div>
              <button className="ep-coach-send" type="button" aria-label="Enviar pergunta">
                <ArrowUp size={16} aria-hidden="true" />
              </button>
            </div>
          </section>

          <div className="ep-coach-prompts" aria-label="Prompts sugeridos">
            {promptChips.map((prompt) => (
              <button key={prompt} type="button">
                {prompt}
              </button>
            ))}
          </div>
        </main>

        <aside className="ep-coach-side" aria-label="Contexto usado pelo Coach">
          <section className="ep-coach-panel">
            <div className="ep-coach-panel-head">
              <span>Contexto usado</span>
              <Sparkles size={16} aria-hidden="true" />
            </div>
            <div className="ep-coach-source-list">
              {contextSources.map((source) => (
                <div className="ep-coach-source" key={source.label}>
                  <strong>{source.label}</strong>
                  <small>{source.state}</small>
                </div>
              ))}
            </div>
            <p>
              Resultado financeiro não incluído. O Coach só usa esse dado com permissão
              explícita em cada sessão.
            </p>
          </section>

          <section className="ep-coach-panel quiet ep-coach-review-panel">
            <div className="ep-coach-panel-head">
              <span>Sinais da revisão</span>
              <Clock3 size={16} aria-hidden="true" />
            </div>
            <div className="ep-coach-signal-grid">
              <Signal label="Sessões revistas" value={String(context.reviewedSessions)} />
              <Signal label="Reviews pendentes" value={String(context.pendingSessionReviews)} />
              <Signal label="Mãos a rever" value={String(context.handsToReview)} />
              <Signal label="Tilt final médio" value={formatRating(context.averageFinalTilt)} />
              <Signal label="Qualidade média" value={formatRating(context.averageDecisionQuality)} />
            </div>
            <ul>
              <li>
                <CircleDot size={14} aria-hidden="true" />
                {context.adjustmentNextWeek || "Ainda não há ajuste guardado na revisão semanal."}
              </li>
              <li>
                <CircleDot size={14} aria-hidden="true" />
                {context.leaks || "Sem leaks registados nesta revisão."}
              </li>
            </ul>
          </section>

          <section className="ep-coach-panel quiet">
            <div className="ep-coach-panel-head">
              <span>Sinais de estudo</span>
              <Clock3 size={16} aria-hidden="true" />
            </div>
            <div className="ep-coach-signal-grid">
              <Signal label="Estudo esta semana" value={formatMinutes(context.studyWeeklyMinutes)} />
              <Signal label="Estudo este mês" value={formatMinutes(context.studyMonthlyMinutes)} />
              <Signal label="Qualidade média" value={formatRating(context.studyAverageQuality)} />
              <Signal label="Tipo frequente" value={context.studyTopType ? getStudyTypeLabel(context.studyTopType) : "-"} />
            </div>
            <ul>
              <li>
                <CircleDot size={14} aria-hidden="true" />
                {getStudyPaceCopy(context.studyPaceState)}
              </li>
            </ul>
          </section>

          <section className="ep-coach-panel quiet">
            <div className="ep-coach-panel-head">
              <span>Limites</span>
              <Lock size={16} aria-hidden="true" />
            </div>
            <ul className="ep-coach-boundaries">
              <li>Não faz análise técnica de mãos.</li>
              <li>Não sugere shove, call, fold ou sizing.</li>
              <li>Não aplica alterações sem confirmação.</li>
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="ep-coach-signal">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildApplyPayload(proposal: CoachProposal): CoachPlanApplyPayload {
  return {
    proposalTitle: getProposalTitle(proposal),
    changes: proposal.items.map((item) => ({
      action: "addBlock",
      source: "coachProposal",
      block: {
        dayIndex: item.dayIndex,
        type: item.type,
        title: `${item.time.trim()} · ${item.topic.trim()}`,
        targetLabel: item.targetLabel,
        source: "coachProposal",
        status: "planned",
        order: 0,
      },
    })),
  };
}

function formatProposalItemTitle(item: CoachProposalItem) {
  return `${item.dayLabel} · ${item.time} · ${item.typeLabel} · ${item.topic}`;
}

function formatChangeCount(count: number) {
  return `${count} ${count === 1 ? "alteração" : "alterações"}`;
}

function getProposalTitle(proposal: CoachProposal) {
  if (proposal.items.length === 3) return proposal.title;
  if (proposal.items.length === 1) return "1 bloco selecionado";

  return `${proposal.items.length} blocos selecionados`;
}

function getProposalScope(proposal: CoachProposal) {
  return `${proposal.scope} (${formatChangeCount(proposal.items.length)})`;
}

function normalizeProposalItem(item: CoachProposalItem): CoachProposalItem {
  const day = getDayOption(item.dayIndex);
  const type = getTypeOption(item.type);

  return {
    ...item,
    dayIndex: day.dayIndex,
    dayLabel: day.label,
    time: item.time.trim() || "09:00",
    type: type.value,
    typeLabel: type.label,
    topic: item.topic.trim() || "Bloco sem tema",
    targetLabel: item.targetLabel.trim() || "30m",
  };
}

function getStudyPaceState(currentValue: number, targetValue: number): CoachContext["studyPaceState"] {
  if (!targetValue) return "missing-target";
  if (currentValue <= 0) return "no-logs";
  if (currentValue >= targetValue) return "complete";

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const expectedProgress = now.getDate() / daysInMonth;
  const progress = currentValue / targetValue;

  return progress < expectedProgress - 0.08 ? "below" : "on";
}

function getStudyLogState(weeklyMinutes: number, paceState: CoachContext["studyPaceState"]) {
  if (!weeklyMinutes) return "Sem registos esta semana";

  return `${formatMinutes(weeklyMinutes)} registados · ${getStudyPaceShortLabel(paceState)}`;
}

function getStudyPaceShortLabel(paceState: CoachContext["studyPaceState"]) {
  if (paceState === "below") return "abaixo do ritmo";
  if (paceState === "on") return "dentro do ritmo";
  if (paceState === "complete") return "objetivo completo";
  if (paceState === "no-logs") return "sem ritmo";
  return "sem meta";
}

function getStudyPaceCopy(paceState: CoachContext["studyPaceState"]) {
  if (paceState === "below") return "O registo de estudo está abaixo do ritmo mensal. A proposta deve recuperar com blocos curtos.";
  if (paceState === "on") return "O registo de estudo está dentro do ritmo. Mantém blocos leves, sem inflacionar a semana.";
  if (paceState === "complete") return "Objetivo mensal de estudo já está completo. Não é preciso adicionar volume por defeito.";
  if (paceState === "no-logs") return "Há meta de estudo, mas ainda não há registos. Começa com um bloco pequeno e confirmado.";
  return "Sem meta mensal de estudo. O Coach usa só os registos existentes como contexto.";
}

function getCoachReply(context: CoachContext) {
  if (context.studyPaceState === "below" || context.studyPaceState === "no-logs") {
    return `O registo de estudo mostra ${getStudyPaceShortLabel(context.studyPaceState)}. Em vez de inventar um plano grande, proponho blocos curtos antes das sessões e deixo tudo para confirmação.`;
  }

  return `O registo de estudo está ${getStudyPaceShortLabel(context.studyPaceState)}. A proposta mantém estudo leve e protege o plano atual, sem adicionar complexidade.`;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (!hours) return `${remaining}m`;
  if (!remaining) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

function getStudyTypeLabel(value: string) {
  const labels: Record<string, string> = {
    Drills: "Drills",
    "Hand review": "Revisão de mãos",
    "Tournament review": "Revisão de torneios",
    Solver: "Solver",
    "Individual lesson": "Aula individual",
    "Group lesson": "Aula de grupo",
    "Video/course": "Vídeo/curso",
    "Group study": "Estudo em grupo",
    "Theory/concepts": "Teoria/conceitos",
    Other: "Outro",
  };

  return labels[value] ?? value;
}

function getDayOption(dayIndex: number) {
  return dayOptions.find((option) => option.dayIndex === dayIndex) ?? dayOptions[0];
}

function getTypeOption(type: StoredBlockType) {
  return typeOptions.find((option) => option.value === type) ?? typeOptions[0];
}

function buildEditableProposal(context: CoachContext): CoachProposal {
  const topic = context.studyTopType ? getStudyTypeLabel(context.studyTopType) : "Estudo focado";
  const needsStudyRecovery = context.studyPaceState === "below" || context.studyPaceState === "no-logs";
  const items: CoachProposalItem[] = [
    {
      dayIndex: 4,
      dayLabel: "Quinta",
      time: "09:00",
      type: "study",
      typeLabel: "Estudo",
      topic,
      targetLabel: "30m",
      detail: needsStudyRecovery
        ? "Registo de estudo indica ritmo fraco; proteger antes do Grind manhã"
        : "Manter o estudo curto antes do Grind manhã",
    },
    {
      dayIndex: 5,
      dayLabel: "Sexta",
      time: "09:00",
      type: "study",
      typeLabel: "Estudo",
      topic: "Open ranges",
      targetLabel: "30m",
      detail: context.nextActions[0] || "Bloco leve para manter consistência",
    },
  ];

  if (needsStudyRecovery) {
    items.push({
      dayIndex: 6,
      dayLabel: "Sábado",
      time: "09:00",
      type: "study",
      typeLabel: "Estudo",
      topic: "Bluff catch",
      targetLabel: "30m",
      detail:
        context.pendingSessionReviews > 0
          ? `${context.pendingSessionReviews} reviews pendentes antes do Grind manhã`
          : "30m antes do Grind manhã",
    });
  }

  return {
    title: needsStudyRecovery ? "3 blocos curtos para recuperar estudo" : "2 blocos para manter estudo no ritmo",
    scope: context.weeklyPlanScope,
    items,
  };
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Não foi possível aplicar a proposta.";
}

function getReviewStateCopy(status: ReviewStatus) {
  if (status === "completed") return "Concluída";
  if (status === "draft") return "Rascunho";
  if (status === "skipped") return "Saltada";
  return "Em falta";
}

function getMonthlyGoalsState(targetCount: number) {
  if (targetCount === 0) return "Sem objetivos definidos";
  if (targetCount === 1) return "1 objetivo definido";
  return `${targetCount} objetivos definidos`;
}

function formatWeekScope(weekStartDate: string) {
  const startDate = parseIsoDate(weekStartDate);
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  return `Plano ${formatShortDate(startDate)}-${formatShortDate(endDate)}`;
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function average(values: Array<number | undefined>) {
  const validValues = values.filter((value): value is number => typeof value === "number");
  if (!validValues.length) return 0;

  return Math.round(validValues.reduce((total, value) => total + value, 0) / validValues.length);
}

function formatRating(value: number) {
  return value ? `${value}/5` : "-";
}
