"use client";

import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  MessageSquareText,
  BookCheck,
  RotateCcw,
  Sparkles,
  Spade,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  buildPlanDaysFromStoredBlocks,
  formatPlanMinutes,
  getTodayIsoDate,
  initialPlanDays,
  parsePlanTarget,
  type PlanBlock,
  type PlanBlockType,
  type PlanDay,
} from "@/lib/planning/weekly-plan";
import { hasPersistenceConfig } from "@/lib/runtime-config";
import styles from "./review-section.module.css";

type ReviewStatus = "available" | "draft" | "completed" | "skipped";
type CategoryId = "grind" | "study" | "review" | "sport";
type BlockStatus = "planned" | "done" | "adjusted" | "notDone";

type CategorySummary = {
  id: CategoryId;
  label: string;
  planned: string;
  done: string;
  adjusted: number;
  missed: number;
  completion: number;
  icon: LucideIcon;
  details: {
    id: string;
    status: BlockStatus;
    title: string;
    meta: string;
    reason?: string;
  }[];
};

type PendingSessionReview = {
  id: string;
  date: string;
  focus: string;
  meta: string;
  hands: number;
};

type SessionReviewContext = {
  pendingReviews: PendingSessionReview[];
  reviewedSessions: number;
  averageDecisionQuality: number;
  averageFinalTilt: number;
  averageFinalEnergy: number;
  averageFinalFocus: number;
  handsToReview: number;
  nextActions: string[];
};

type WeeklyReviewForm = {
  status: ReviewStatus;
  ratings: {
    execution: number;
    energy: number;
    focus: number;
    quality: number;
  };
  reflection: {
    wins: string;
    leaks: string;
    reasons: string[];
    next: string;
  };
};

const todayIsoDate = getTodayIsoDate();

const reasonOptions = [
  "Pouca energia",
  "Falta de tempo",
  "Tilt/stress",
  "Imprevisto",
  "Plano irrealista",
  "Prioridade mudou",
  "Sem motivo claro",
];

const pendingSessionReviews: PendingSessionReview[] = [
  {
    id: "session-14-may",
    date: "14 Mai",
    focus: "Disciplina em ICM até bolha",
    meta: "6 torneios · 2h 04m",
    hands: 3,
  },
  {
    id: "session-13-may",
    date: "13 Mai",
    focus: "Não jogar em autopilot",
    meta: "8 torneios · 3h 12m",
    hands: 2,
  },
];

const demoSessionReviewContext: SessionReviewContext = {
  pendingReviews: pendingSessionReviews,
  reviewedSessions: 3,
  averageDecisionQuality: 4,
  averageFinalTilt: 2,
  averageFinalEnergy: 3,
  averageFinalFocus: 4,
  handsToReview: 5,
  nextActions: ["Fazer review antes da sessão de domingo.", "Reduzir mesas se energia ficar em 2/5."],
};

const demoWeeklyReviewForm: WeeklyReviewForm = {
  status: "available",
  ratings: {
    execution: 4,
    energy: 3,
    focus: 4,
    quality: 4,
  },
  reflection: {
    wins: "Mantive tilt baixo nas sessões longas e cumpri o foco de ICM na maioria das decisões difíceis.",
    leaks: "Estudo caiu sempre que a manhã atrasou. Review ficou comprimida antes das sessões da noite.",
    reasons: ["Pouca energia", "Falta de tempo", "Plano irrealista"],
    next: "Fazer review antes da sessão de domingo.",
  },
};

const demoCategorySummary = buildCategorySummary(initialPlanDays);

const statusCopy: Record<BlockStatus, string> = {
  planned: "Planeado",
  done: "Feito",
  adjusted: "Ajustado",
  notDone: "Não feito",
};

export function ReviewSection() {
  if (!hasPersistenceConfig) {
    return (
      <ReviewWorkspace
      initialReview={demoWeeklyReviewForm}
      planSummary={demoCategorySummary}
      sessionReviewContext={demoSessionReviewContext}
    />
    );
  }

  return <PersistedReviewSection />;
}

function PersistedReviewSection() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const weeklyPlan = useQuery(api.weeklyPlan.getCurrent, isAuthenticated ? { today: todayIsoDate } : "skip");
  const sessions = useQuery(api.pokerSession.list, isAuthenticated ? {} : "skip");
  const weeklyReview = useQuery(
    api.weeklyReview.getByWeek,
    isAuthenticated && weeklyPlan ? { weekStartDate: weeklyPlan.weekStartDate } : "skip",
  );
  const saveWeeklyReview = useMutation(api.weeklyReview.save);
  const planSummary = useMemo(() => {
    if (!isAuthenticated || !weeklyPlan?.currentPlan) return demoCategorySummary;

    return buildCategorySummary(
      buildPlanDaysFromStoredBlocks({
        blocks: weeklyPlan.currentBlocks,
        today: todayIsoDate,
        weekStartDate: weeklyPlan.weekStartDate,
      }),
    );
  }, [isAuthenticated, weeklyPlan]);

  const sessionReviewContext = useMemo(() => {
    if (!isAuthenticated || !sessions) return demoSessionReviewContext;

    const reviewed = sessions.filter((session) => session.status === "reviewed");
    const pending = sessions.filter((session) => session.status === "reviewPending");

    return {
      pendingReviews: pending.map((session) => ({
        id: session._id,
        date: session.date,
        focus: session.sessionFocus,
        meta: `${session.tournamentsPlayed ?? 0} torneios · ${formatElapsed(session.startedAt, session.endedAt)}`,
        hands: session.handsToReview,
      })),
      reviewedSessions: reviewed.length,
      averageDecisionQuality: average(reviewed.map((session) => session.decisionQuality)),
      averageFinalTilt: average(reviewed.map((session) => session.finalTilt)),
      averageFinalEnergy: average(reviewed.map((session) => session.finalEnergy)),
      averageFinalFocus: average(reviewed.map((session) => session.finalFocus)),
      handsToReview: sessions.reduce((total, session) => total + session.handsToReview, 0),
      nextActions: reviewed
        .map((session) => session.nextAction?.trim())
        .filter((value): value is string => Boolean(value))
        .slice(0, 2),
    };
  }, [isAuthenticated, sessions]);

  if (
    isLoading ||
    (isAuthenticated && (weeklyPlan === undefined || sessions === undefined || weeklyReview === undefined))
  ) {
    return (
      <section className="ep-page">
        <div className="wp-demo-banner">A carregar contexto da revisão...</div>
      </section>
    );
  }

  const initialReview: WeeklyReviewForm = weeklyReview
    ? {
        status: weeklyReview.status === "draft" ? "draft" : weeklyReview.status,
        ratings: {
          execution: weeklyReview.executionRating,
          energy: weeklyReview.energyRating,
          focus: weeklyReview.focusRating,
          quality: weeklyReview.qualityRating,
        },
        reflection: {
          wins: weeklyReview.wins,
          leaks: weeklyReview.leaks,
          reasons: weeklyReview.reasons,
          next: weeklyReview.adjustmentNextWeek,
        },
      }
    : {
        ...demoWeeklyReviewForm,
        reflection: {
          ...demoWeeklyReviewForm.reflection,
          reasons: getPlanReasons(planSummary) || demoWeeklyReviewForm.reflection.reasons,
        },
      };

  return (
    <ReviewWorkspace
      key={`${weeklyPlan?.weekStartDate ?? "demo"}:${weeklyReview?.updatedAt ?? 0}`}
      initialReview={initialReview}
      onSaveReview={
        isAuthenticated && weeklyPlan
          ? async (review) => {
              await saveWeeklyReview({
                weekStartDate: weeklyPlan.weekStartDate,
                weeklyPlanId: weeklyPlan.currentPlan?._id as Id<"weeklyPlans"> | undefined,
                status: toStoredReviewStatus(review.status),
                executionRating: review.ratings.execution,
                energyRating: review.ratings.energy,
                focusRating: review.ratings.focus,
                qualityRating: review.ratings.quality,
                wins: review.reflection.wins,
                leaks: review.reflection.leaks,
                reasons: review.reflection.reasons,
                adjustmentNextWeek: review.reflection.next,
                reviewedSessionCount: sessionReviewContext.reviewedSessions,
                pendingSessionReviewCount: sessionReviewContext.pendingReviews.length,
                handsToReviewCount: sessionReviewContext.handsToReview,
              });
            }
          : undefined
      }
      planSummary={planSummary}
      sessionReviewContext={sessionReviewContext}
    />
  );
}

function ReviewWorkspace({
  initialReview,
  onSaveReview,
  planSummary,
  sessionReviewContext,
}: {
  initialReview: WeeklyReviewForm;
  onSaveReview?: (review: WeeklyReviewForm) => Promise<void>;
  planSummary: CategorySummary[];
  sessionReviewContext: SessionReviewContext;
}) {
  const [status, setStatus] = useState<ReviewStatus>(initialReview.status);
  const [expanded, setExpanded] = useState<CategoryId | null>("study");
  const [sessionContextOpen, setSessionContextOpen] = useState(true);
  const [ratings, setRatings] = useState(initialReview.ratings);
  const [reflection, setReflection] = useState(initialReview.reflection);

  const coachUnlocked = status === "completed";

  const adjustedCount = planSummary.reduce((total, item) => total + item.adjusted, 0);
  const missedCount = planSummary.reduce((total, item) => total + item.missed, 0);
  const availableReasonOptions = mergeUnique([
    ...reasonOptions,
    ...getPlanReasonList(planSummary),
    ...reflection.reasons,
  ]);

  function updateRating(key: keyof typeof ratings, value: number) {
    setRatings((current) => ({ ...current, [key]: value }));
    if (status === "available") setStatus("draft");
  }

  function updateReflection(key: "wins" | "leaks" | "next", value: string) {
    setReflection((current) => ({ ...current, [key]: value }));
    if (status === "available") setStatus("draft");
  }

  function toggleReason(reason: string) {
    setReflection((current) => ({
      ...current,
      reasons: current.reasons.includes(reason)
        ? current.reasons.filter((item) => item !== reason)
        : [...current.reasons, reason],
    }));
    if (status === "available") setStatus("draft");
  }

  async function persistReview(nextStatus: ReviewStatus) {
    const nextReview = {
      status: nextStatus,
      ratings,
      reflection,
    };

    await onSaveReview?.(nextReview);
    setStatus(nextStatus);
  }

  return (
    <section className="ep-page">
      <div className="ep-page-header">
        <div>
          <span>Semana 18 · 12-18 Maio</span>
          <h1>Revisão</h1>
          <p>Recomendada, não obrigatória. Fecha a semana sem bloquear a próxima.</p>
        </div>
        <div className="ep-page-actions">
          {status !== "completed" ? (
            <button className="ep-button secondary" type="button" onClick={() => void persistReview("skipped")}>
              <X size={14} aria-hidden="true" />
              Saltar por agora
            </button>
          ) : null}
          <Link className="ep-button primary" href="/weekly">
            <ArrowRight size={14} aria-hidden="true" />
            Preparar próxima semana
          </Link>
        </div>
      </div>

      <ReviewStateBanner status={status} onResume={() => setStatus("draft")} />

      <div className={styles.reviewLayout}>
        <main className={styles.mainColumn}>
          <section className={styles.contextPanel}>
            <button
              aria-expanded={sessionContextOpen}
              className={styles.panelToggle}
              type="button"
              onClick={() => setSessionContextOpen((value) => !value)}
            >
              <span>
                <Clock3 size={16} aria-hidden="true" />
                Reviews de sessão pendentes
              </span>
              <strong>{sessionReviewContext.pendingReviews.length}</strong>
              <ChevronDown size={16} aria-hidden="true" />
            </button>

            {sessionContextOpen ? (
              <div className={styles.pendingList}>
                <p>Podem melhorar o contexto da revisão semanal, mas não são obrigatórias agora.</p>
                {sessionReviewContext.pendingReviews.map((session) => (
                  <article className={styles.pendingRow} key={session.id}>
                    <div>
                      <span>{session.date}</span>
                      <strong>{session.focus}</strong>
                      <small>
                        {session.meta} · {session.hands} mãos a rever
                      </small>
                    </div>
                    <Link className="ep-button secondary" href="/sessions">
                      Terminar review
                    </Link>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className={styles.panel}>
            <PanelHead
              eyebrow="Sessões revistas"
              icon={<Spade size={17} aria-hidden="true" />}
              title="Sinais das sessões"
            />

            <div className={styles.sessionSignalsGrid}>
              <Metric label="Sessões revistas" value={String(sessionReviewContext.reviewedSessions)} />
              <Metric
                label="Qualidade média"
                value={sessionReviewContext.averageDecisionQuality ? `${sessionReviewContext.averageDecisionQuality}/5` : "-"}
              />
              <Metric
                label="Tilt final médio"
                value={sessionReviewContext.averageFinalTilt ? `${sessionReviewContext.averageFinalTilt}/5` : "-"}
              />
              <Metric
                label="Energia final média"
                value={sessionReviewContext.averageFinalEnergy ? `${sessionReviewContext.averageFinalEnergy}/5` : "-"}
              />
              <Metric
                label="Foco final médio"
                value={sessionReviewContext.averageFinalFocus ? `${sessionReviewContext.averageFinalFocus}/5` : "-"}
              />
              <Metric label="Mãos a rever" value={String(sessionReviewContext.handsToReview)} />
            </div>

            <article className={styles.sessionAdjustmentCard}>
              <strong>{getSessionSignalCopy(sessionReviewContext)}</strong>
              <p>Usa estes sinais só para escolher um ajuste concreto. Não substituem a tua reflexão.</p>
              {sessionReviewContext.nextActions.length ? (
                <ul>
                  {sessionReviewContext.nextActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          </section>

          <section className={styles.panel}>
            <PanelHead
              eyebrow="Espelho da semana"
              icon={<FileText size={17} aria-hidden="true" />}
              title="Plano vs execução"
            />

            <div className={styles.summaryGrid}>
              {planSummary.map((category) => (
                <CategoryRow
                  category={category}
                  expanded={expanded === category.id}
                  key={category.id}
                  onToggle={() => setExpanded((current) => (current === category.id ? null : category.id))}
                />
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <PanelHead
              eyebrow="Primeiro tu, depois o Coach"
              icon={<MessageSquareText size={17} aria-hidden="true" />}
              title="A tua reflexão"
            />

            <div className={styles.ratingGrid}>
              <RatingControl
                label="Execução"
                value={ratings.execution}
                onChange={(value) => updateRating("execution", value)}
              />
              <RatingControl
                label="Energia"
                value={ratings.energy}
                onChange={(value) => updateRating("energy", value)}
              />
              <RatingControl label="Foco" value={ratings.focus} onChange={(value) => updateRating("focus", value)} />
              <RatingControl
                label="Qualidade"
                value={ratings.quality}
                onChange={(value) => updateRating("quality", value)}
              />
            </div>

            <div className={styles.formGrid}>
              <label>
                Principais wins
                <textarea
                  value={reflection.wins}
                  onChange={(event) => updateReflection("wins", event.target.value)}
                />
              </label>
              <label>
                Principais leaks/problemas
                <textarea
                  value={reflection.leaks}
                  onChange={(event) => updateReflection("leaks", event.target.value)}
                />
              </label>
            </div>

            <div className={styles.reasonBox}>
              <span>Motivos para blocos falhados ou ajustados</span>
              <div>
                {availableReasonOptions.map((reason) => (
                  <button
                    className={reflection.reasons.includes(reason) ? styles.reasonSelected : undefined}
                    key={reason}
                    type="button"
                    onClick={() => toggleReason(reason)}
                  >
                    {reflection.reasons.includes(reason) ? <Check size={13} aria-hidden="true" /> : null}
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <label className={styles.fullField}>
              Ajuste para a próxima semana
              <textarea value={reflection.next} onChange={(event) => updateReflection("next", event.target.value)} />
            </label>

            <div className={styles.reviewActions}>
              <button className="ep-button secondary" type="button" onClick={() => void persistReview("draft")}>
                Guardar rascunho
              </button>
              <button className="ep-button primary" type="button" onClick={() => void persistReview("completed")}>
                <Check size={14} aria-hidden="true" />
                Guardar revisão
              </button>
            </div>
          </section>

          <section className={coachUnlocked ? styles.coachPanel : styles.coachPanelLocked}>
            <PanelHead
              eyebrow={coachUnlocked ? "Contexto usado · plano semanal + execução + sessões" : "Aparece depois da tua reflexão"}
              icon={<Sparkles size={17} aria-hidden="true" />}
              title="Sugestão do Coach"
            />
            {coachUnlocked ? (
              <>
                <p>
                  O padrão principal não é falta de vontade: é estudo e review a ficarem depois da sessão. Para a
                  próxima semana, coloca o bloco de estudo antes do primeiro grind e deixa um bloco curto de review
                  separado do fim da noite.
                </p>
                <article className={styles.proposalCard}>
                  <div>
                    <strong>Mover Estudo para antes da sessão · simplificar Sport</strong>
                    <small>Proposta para a próxima semana · 3 ajustes</small>
                  </div>
                  <ul>
                    <li>Estudo 30m antes do Grind em 3 dias.</li>
                    <li>Review curto depois da sessão de terça, não no fim da semana.</li>
                    <li>Sport: 2 blocos de 25m em vez de 3 blocos longos.</li>
                  </ul>
                  <div className={styles.proposalActions}>
                    <button className="ep-button secondary" type="button">
                      Ignorar
                    </button>
                    <button className="ep-button primary" type="button">
                      Ver proposta
                    </button>
                  </div>
                </article>
              </>
            ) : (
              <p>Conclui a tua reflexão primeiro. O Coach responde depois com base no que escreveste.</p>
            )}
          </section>
        </main>

        <aside className={styles.sideColumn}>
          <article className={styles.sideCard}>
            <span>Resumo leve</span>
            <dl>
              <Metric label="Execução" value={`${ratings.execution}/5`} />
              <Metric label="Energia" value={`${ratings.energy}/5`} />
              <Metric label="Ajustados" value={String(adjustedCount)} />
              <Metric label="Não feitos" value={String(missedCount)} />
            </dl>
          </article>

          <article className={styles.sideCard}>
            <span>Próxima ação</span>
            <h2>Não precisas de fechar tudo agora.</h2>
            <p>A revisão melhora o contexto do plano, mas a próxima semana continua disponível mesmo se saltares.</p>
            <Link className="ep-button secondary" href="/weekly">
              Preparar próxima semana
            </Link>
          </article>

          <article className={styles.sideCoach}>
            <Sparkles size={17} aria-hidden="true" />
            <div>
              <span>Coach AI</span>
              <p>Sem relatório pesado. Uma sugestão prática depois da tua reflexão.</p>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function ReviewStateBanner({ onResume, status }: { onResume: () => void; status: ReviewStatus }) {
  if (status === "completed") {
    return (
      <article className={styles.stateBannerDone}>
        <Check size={18} aria-hidden="true" />
        <div>
          <strong>Revisão guardada.</strong>
          <p>A sugestão do Coach já pode usar a tua reflexão para orientar a próxima semana.</p>
        </div>
      </article>
    );
  }

  if (status === "skipped") {
    return (
      <article className={styles.stateBannerSkipped}>
        <X size={18} aria-hidden="true" />
        <div>
          <strong>Revisão saltada por agora.</strong>
          <p>Podes voltar mais tarde. A próxima semana não fica bloqueada.</p>
        </div>
        <button className="ep-button secondary" type="button" onClick={onResume}>
          Retomar revisão
        </button>
      </article>
    );
  }

  return (
    <article className={styles.stateBanner}>
      <BookCheck size={18} aria-hidden="true" />
      <div>
        <strong>{status === "draft" ? "Rascunho em curso." : "Revisão semanal disponível."}</strong>
        <p>A revisão ajuda a preparar a próxima semana, mas não bloqueia o plano.</p>
      </div>
    </article>
  );
}

function PanelHead({ eyebrow, icon, title }: { eyebrow: string; icon: ReactNode; title: string }) {
  return (
    <header className={styles.panelHead}>
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div>{icon}</div>
    </header>
  );
}

function CategoryRow({
  category,
  expanded,
  onToggle,
}: {
  category: CategorySummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = category.icon;

  return (
    <article className={`${styles.categoryRow} ${styles[category.id]}`}>
      <button aria-expanded={expanded} className={styles.categoryButton} type="button" onClick={onToggle}>
        <span className={styles.categoryIcon}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <span className={styles.categoryMain}>
          <strong>{category.label}</strong>
          <small>
            {category.done} feito · {category.planned} planeado
          </small>
        </span>
        <span className={styles.categoryStats}>
          <em>{category.completion}%</em>
          <small>
            {category.adjusted} ajust. · {category.missed} não feito
          </small>
        </span>
        <span className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${category.completion}%` }} />
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {expanded ? (
        <div className={styles.categoryDetails}>
          {category.details.map((detail) => (
            <div className={styles.detailRow} key={detail.id}>
              <span className={`${styles.statusPill} ${styles[detail.status]}`}>{statusCopy[detail.status]}</span>
              <div>
                <strong>{detail.title}</strong>
                <small>
                  {detail.meta}
                  {detail.reason ? ` · ${detail.reason}` : ""}
                </small>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function RatingControl({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className={styles.ratingControl}>
      <span>{label}</span>
      <div>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            aria-pressed={value === rating}
            className={value === rating ? styles.ratingSelected : undefined}
            key={`${label}-${rating}`}
            type="button"
            onClick={() => onChange(rating)}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function buildCategorySummary(days: PlanDay[]): CategorySummary[] {
  const categories: Array<{
    id: CategoryId;
    icon: LucideIcon;
    label: string;
    type: PlanBlockType;
  }> = [
    { id: "grind", icon: Spade, label: "Grind", type: "Grind" },
    { id: "study", icon: Target, label: "Estudo", type: "Estudo" },
    { id: "review", icon: BookCheck, label: "Review", type: "Review" },
    { id: "sport", icon: RotateCcw, label: "Sport", type: "Desporto" },
  ];

  return categories.map((category) => {
    const blocks = days.flatMap((day) =>
      day.blocks
        .filter((block) => block.type === category.type)
        .map((block) => ({ block, day })),
    );
    const adjusted = blocks.filter(({ block }) => block.status === "Ajustado").length;
    const missed = blocks.filter(({ block }) => block.status === "Não feito").length;
    const doneBlocks = blocks.filter(({ block }) => block.status === "Feito");
    const closedBlocks = blocks.filter(
      ({ block }) => block.status === "Feito" || block.status === "Ajustado",
    ).length;
    const totalBlocks = blocks.length;

    return {
      id: category.id,
      label: category.label,
      planned: formatCategoryAmount(category.id, blocks.map(({ block }) => block)),
      done: formatCategoryAmount(category.id, doneBlocks.map(({ block }) => block)),
      adjusted,
      missed,
      completion: totalBlocks ? Math.round((closedBlocks / totalBlocks) * 100) : 0,
      icon: category.icon,
      details: blocks.map(({ block, day }) => ({
        id: block.id,
        status: toReviewBlockStatus(block.status),
        title: block.title,
        meta: `${day.label}${block.target ? ` · ${block.target}` : ""}`,
        reason: normalizeBlockReason(block.reason),
      })),
    };
  });
}

function getPlanReasons(planSummary: CategorySummary[]) {
  const reasons = getPlanReasonList(planSummary);
  return reasons.length ? reasons : null;
}

function getPlanReasonList(planSummary: CategorySummary[]) {
  return mergeUnique(
    planSummary.flatMap((category) =>
      category.details
        .filter((detail) => detail.status === "adjusted" || detail.status === "notDone")
        .map((detail) => detail.reason)
        .filter((reason): reason is string => Boolean(reason)),
    ),
  );
}

function normalizeBlockReason(reason?: string) {
  if (!reason) return undefined;

  const normalizedReason = reason.trim();
  const reasonMap: Record<string, string> = {
    "Energia baixa": "Pouca energia",
    "Falta de tempo": "Falta de tempo",
    "Tilt/stress": "Tilt/stress",
    Imprevisto: "Imprevisto",
    "Evento inesperado": "Imprevisto",
    "Plano irrealista": "Plano irrealista",
    "Prioridade mudou": "Prioridade mudou",
    "Sem motivo claro": "Sem motivo claro",
  };

  return reasonMap[normalizedReason] ?? normalizedReason;
}

function mergeUnique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatCategoryAmount(categoryId: CategoryId, blocks: PlanBlock[]) {
  if (categoryId === "grind") {
    return `${blocks.length} ${blocks.length === 1 ? "sessão" : "sessões"}`;
  }

  const minutes = blocks.reduce((total, block) => total + parsePlanTarget(block.target), 0);
  if (minutes > 0) return formatPlanMinutes(minutes);

  return `${blocks.length} ${blocks.length === 1 ? "bloco" : "blocos"}`;
}

function toReviewBlockStatus(status: PlanBlock["status"]): BlockStatus {
  if (status === "Feito") return "done";
  if (status === "Ajustado") return "adjusted";
  if (status === "Não feito") return "notDone";
  return "planned";
}

function average(values: Array<number | undefined>) {
  const numericValues = values.filter((value): value is number => typeof value === "number");
  if (!numericValues.length) return 0;
  return Math.round((numericValues.reduce((total, value) => total + value, 0) / numericValues.length) * 10) / 10;
}

function formatElapsed(startedAt: number, endedAt = Date.now()) {
  const minutes = Math.max(0, Math.floor((endedAt - startedAt) / 60000));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
}

function getSessionSignalCopy(context: SessionReviewContext) {
  if (context.pendingReviews.length > 0) {
    return "Há reviews de sessão pendentes. A revisão semanal pode avançar, mas o contexto fica mais fraco.";
  }

  if (context.handsToReview >= 5) {
    return "Há várias mãos marcadas. O ajuste da próxima semana deve reservar tempo real para review.";
  }

  if (context.reviewedSessions > 0 && context.averageFinalTilt >= 3) {
    return "O tilt final está alto nas sessões revistas. O ajuste deve proteger energia, mesas ou pausas.";
  }

  if (context.reviewedSessions > 0) {
    return "As sessões revistas já dão sinais suficientes para escolher um ajuste simples para a próxima semana.";
  }

  return "Ainda há pouco contexto de sessões revistas. Mantém o ajuste baseado na tua reflexão principal.";
}

function toStoredReviewStatus(status: ReviewStatus) {
  return status === "available" ? "draft" : status;
}
