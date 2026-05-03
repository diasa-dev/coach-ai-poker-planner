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
import { useMemo, useState } from "react";

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
  monthlyGoalsState: string;
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
};

type CoachShellProps = {
  context: CoachContext;
  hasActiveApplication?: boolean;
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

type ProposalStage = "summary" | "review" | "edit" | "confirm" | "applied";

const todayIsoDate = getTodayIsoDate();

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
  monthlyGoalsState: "Mock",
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
    (isAuthenticated && (weeklyPlan === undefined || sessions === undefined || weeklyReview === undefined));

  const context = useMemo<CoachContext>(() => {
    if (!isAuthenticated || !weeklyPlan || !sessions || weeklyReview === undefined) {
      return {
        ...demoCoachContext,
        isDemo: true,
        weeklyPlanState: isFetching ? "A carregar" : "Demo",
        sessionsState: isFetching ? "A carregar" : "Demo",
        reviewState: isFetching ? "A carregar" : "Demo",
      };
    }

    const reviewedSessions = sessions.filter((session) => session.status === "reviewed");
    const pendingSessionReviews = sessions.filter((session) => session.status === "reviewPending");
    const recentSessions = sessions.slice(0, 3);
    const reviewStatus = weeklyReview?.status ?? "available";

    return {
      isDemo: false,
      weeklyPlanState: weeklyPlan.currentPlan ? "Ativo" : "Sem plano ativo",
      monthlyGoalsState: "Mock",
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
  }, [isAuthenticated, isFetching, sessions, weeklyPlan, weeklyReview]);

  const currentPlan = weeklyPlan?.currentPlan ?? null;
  const activeApplicationId = applicationId ?? activeApplication?._id ?? null;

  return (
    <CoachShell
      context={context}
      hasActiveApplication={Boolean(activeApplication)}
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

function CoachShell({ context, hasActiveApplication = false, onApplyProposal, onUndoProposal }: CoachShellProps) {
  const [proposal, setProposal] = useState(() => buildEditableProposal(context));
  const [proposalStage, setProposalStage] = useState<ProposalStage>("summary");
  const [actionError, setActionError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const currentProposalStage: ProposalStage = hasActiveApplication ? "applied" : proposalStage;
  const contextSources = [
    { label: "Plano semanal", state: context.weeklyPlanState },
    { label: "Objetivos mensais", state: context.monthlyGoalsState },
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

      setProposalStage("review");
    } catch (error) {
      setActionError(getActionErrorMessage(error));
    } finally {
      setIsApplying(false);
    }
  }

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
              <p>
                Estás 1h 45m abaixo do ritmo da semana. Em vez de adicionar um bloco
                grande, tenho uma proposta com três blocos curtos antes das sessões da
                manhã. Mantém o volume de grind intacto.
              </p>
            </div>
          </article>

          {currentProposalStage === "applied" ? (
            <article className="ep-coach-applied" aria-label="Alteração aplicada">
              <span>
                <Check size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>Alteração aplicada ao plano</strong>
                <small>{getProposalScope(proposal)}</small>
              </div>
              <button type="button" disabled={isApplying} onClick={() => void undoProposal()}>
                {isApplying ? "A anular..." : "Anular (30s)"}
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
                Contexto: plano semanal + revisão semanal + sessões recentes
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
  return `Plano da semana 18 (${formatChangeCount(proposal.items.length)})`;
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

function getDayOption(dayIndex: number) {
  return dayOptions.find((option) => option.dayIndex === dayIndex) ?? dayOptions[0];
}

function getTypeOption(type: StoredBlockType) {
  return typeOptions.find((option) => option.value === type) ?? typeOptions[0];
}

function buildEditableProposal(context: CoachContext): CoachProposal {
  return {
    title: "3 blocos de 30 min antes da sessão da manhã",
    scope: "Plano da semana 18 (3 alterações)",
    items: [
      {
        dayIndex: 4,
        dayLabel: "Quinta",
        time: "09:00",
        type: "study",
        typeLabel: "Estudo",
        topic: "ICM",
        targetLabel: "30m",
        detail: context.adjustmentNextWeek || "30m antes do Grind manhã",
      },
      {
        dayIndex: 5,
        dayLabel: "Sexta",
        time: "09:00",
        type: "study",
        typeLabel: "Estudo",
        topic: "Open ranges",
        targetLabel: "30m",
        detail: context.nextActions[0] || "30m antes do Grind manhã",
      },
      {
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
      },
    ],
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

function average(values: Array<number | undefined>) {
  const validValues = values.filter((value): value is number => typeof value === "number");
  if (!validValues.length) return 0;

  return Math.round(validValues.reduce((total, value) => total + value, 0) / validValues.length);
}

function formatRating(value: number) {
  return value ? `${value}/5` : "-";
}
