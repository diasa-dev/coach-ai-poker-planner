"use client";

import { Check, Edit3, MoreHorizontal, Sparkles, X } from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  buildPlanDaysFromStoredBlocks,
  formatWeekRange,
  getTodayIsoDate,
  initialPlanDays,
  initialWeeklyFocus,
  type PlanBlock,
  type PlanBlockStatus,
  type PlanBlockType,
} from "@/lib/planning/weekly-plan";
import { hasPersistenceConfig } from "@/lib/runtime-config";

type CommitmentStatus = "planned" | "done" | "adjusted" | "not-done";
type CommitmentKind = PlanBlockType | "Foco" | "Revisão";
type TodaySource = "demo" | "active" | "no-active-plan";

type Commitment = {
  id: string;
  persistedId?: Id<"dailyCommitments">;
  sourceWeeklyPlanBlockId?: Id<"weeklyPlanBlocks">;
  kind: CommitmentKind;
  text: string;
  estimate: string;
  status: CommitmentStatus;
  reason?: string;
};

const statusLabels: Record<CommitmentStatus, string> = {
  planned: "Planeado",
  done: "Feito",
  adjusted: "Ajustado",
  "not-done": "Não feito",
};

const initialCommitmentsFallback: Commitment[] = [
  {
    id: "review-hands",
    kind: "Revisão",
    text: "Rever 5 mãos marcadas da sessão de ontem (ICM, river difícil)",
    estimate: "30m",
    status: "planned",
  },
  {
    id: "icm-focus",
    kind: "Foco",
    text: "Manter disciplina em ICM até bolha — sem pagar river sem motivo",
    estimate: "sessão da noite",
    status: "planned",
  },
  {
    id: "open-ranges",
    kind: "Estudo",
    text: "25m de estudo de open ranges antes da sessão da manhã",
    estimate: "25m",
    status: "planned",
  },
];

const reasonOptions = [
  "Energia baixa",
  "Falta de tempo",
  "Tilt/stress",
  "Imprevisto",
  "Plano irrealista",
  "Prioridade mudou",
  "Sem motivo claro",
];
const todayIsoDate = getTodayIsoDate();

function getDemoTodayBlocks() {
  return initialPlanDays.find((day) => day.isToday)?.blocks ?? [];
}

function statusClass(status: CommitmentStatus | PlanBlockStatus) {
  if (status === "done" || status === "Feito") return "done";
  if (status === "adjusted" || status === "Ajustado") return "adjusted";
  if (status === "not-done" || status === "Não feito") return "not-done";
  return "planned";
}

function commitmentStatusToPlanBlockStatus(status: CommitmentStatus): PlanBlockStatus {
  if (status === "done") return "Feito";
  if (status === "adjusted") return "Ajustado";
  if (status === "not-done") return "Não feito";
  return "Planeado";
}

function kindClass(kind: CommitmentKind | PlanBlockType) {
  return kind.toLowerCase().replace("ã", "a").replace("ç", "c");
}

function blockLabel(type: PlanBlockType) {
  return type === "Desporto" ? "Sport" : type;
}

export function TodayExecution() {
  if (!hasPersistenceConfig) {
    return (
      <TodayWorkspace
        source="demo"
        sourceMessage="Clerk ou Convex ainda não estão configurados. Today está a usar dados mock."
        todayBlocks={getDemoTodayBlocks()}
        weeklyFocus={initialWeeklyFocus}
        weekLabel="Semana demo"
      />
    );
  }

  return <PersistedTodayExecution />;
}

function PersistedTodayExecution() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const weeklyPlan = useQuery(
    api.weeklyPlan.getCurrent,
    isAuthenticated ? { today: todayIsoDate } : "skip",
  );
  const preparedDay = useQuery(
    api.dailyPlan.getPreparedDay,
    isAuthenticated ? { date: todayIsoDate } : "skip",
  );
  const prepareDay = useMutation(api.dailyPlan.prepareDay);
  const updateDailyCommitment = useMutation(api.dailyPlan.updateDailyCommitment);
  const closePreparedDay = useMutation(api.dailyPlan.closePreparedDay);

  if (
    isLoading ||
    (isAuthenticated && (weeklyPlan === undefined || preparedDay === undefined))
  ) {
    return (
      <section className="ep-page today-page today-print-match">
        <div className="wp-demo-banner">A carregar plano de hoje...</div>
      </section>
    );
  }

  if (!isAuthenticated || !weeklyPlan) {
    return (
      <TodayWorkspace
        source="demo"
        sourceMessage="Sessão não iniciada. Today está a usar dados mock até entrares."
        todayBlocks={getDemoTodayBlocks()}
        weeklyFocus={initialWeeklyFocus}
        weekLabel="Semana demo"
      />
    );
  }

  if (!preparedDay) {
    return null;
  }

  const activePlan = weeklyPlan.currentPlan?.status === "active" ? weeklyPlan.currentPlan : null;
  const activeDays = activePlan
    ? buildPlanDaysFromStoredBlocks({
        blocks: weeklyPlan.currentBlocks,
        today: todayIsoDate,
        weekStartDate: weeklyPlan.weekStartDate,
      })
    : [];
  const todayBlocks = activeDays.find((day) => day.isToday)?.blocks ?? [];
  const preparedCommitments = preparedDay.commitments.map((commitment) => ({
    id: commitment._id,
    persistedId: commitment._id,
    sourceWeeklyPlanBlockId: commitment.sourceWeeklyPlanBlockId,
    kind: commitment.kind as CommitmentKind,
    text: commitment.title,
    estimate: commitment.estimate,
    status: fromStoredCommitmentStatus(commitment.status),
    reason: commitment.reason,
  }));

  return (
    <TodayWorkspace
      key={`${weeklyPlan.weekStartDate}:${activePlan?._id ?? "no-active"}:${activePlan?.updatedAt ?? 0}:${todayBlocks.length}:${preparedDay.dailyPlan?._id ?? "unprepared"}:${preparedDay.dailyPlan?.updatedAt ?? 0}:${preparedCommitments.length}`}
      dailyPlanStatus={preparedDay.dailyPlan?.status}
      initialCommitments={preparedCommitments}
      onCloseDay={
        preparedDay.dailyPlan
          ? async () => {
              await closePreparedDay({ id: preparedDay.dailyPlan._id });
            }
          : undefined
      }
      onPrepareDay={async (commitments) => {
        if (!activePlan) return [];

        const result = await prepareDay({
          date: todayIsoDate,
          weeklyPlanId: activePlan._id,
          commitments: commitments.map((commitment, order) => ({
            sourceWeeklyPlanBlockId: commitment.sourceWeeklyPlanBlockId,
            kind: commitment.kind,
            title: commitment.text,
            estimate: commitment.estimate,
            order,
          })),
        });

        return result.commitments.map((commitment) => ({
          id: commitment._id,
          persistedId: commitment._id,
          sourceWeeklyPlanBlockId: commitment.sourceWeeklyPlanBlockId,
          kind: commitment.kind as CommitmentKind,
          text: commitment.title,
          estimate: commitment.estimate,
          status: fromStoredCommitmentStatus(commitment.status),
          reason: commitment.reason,
        }));
      }}
      onUpdateCommitment={async (commitment, status, reason) => {
        if (!commitment.persistedId) return;

        await updateDailyCommitment({
          id: commitment.persistedId,
          status: toStoredCommitmentStatus(status),
          reason,
        });
      }}
      source={activePlan ? "active" : "no-active-plan"}
      sourceMessage={
        activePlan
          ? "Today está a usar o plano semanal ativo."
          : "Ainda não há plano semanal ativo. Ativa um plano em Plano semanal para ligar a execução de hoje."
      }
      todayBlocks={activePlan ? todayBlocks : []}
      weeklyFocus={activePlan?.focus ?? "Sem plano semanal ativo."}
      weekLabel={activePlan ? formatWeekRange(weeklyPlan.weekStartDate) : "Sem plano ativo"}
    />
  );
}

function TodayWorkspace({
  dailyPlanStatus,
  initialCommitments,
  onCloseDay,
  onPrepareDay,
  onUpdateCommitment,
  source,
  sourceMessage,
  todayBlocks,
  weeklyFocus,
  weekLabel,
}: {
  dailyPlanStatus?: "prepared" | "closed";
  initialCommitments?: Commitment[];
  onCloseDay?: () => Promise<void>;
  onPrepareDay?: (commitments: Commitment[]) => Promise<Commitment[]>;
  onUpdateCommitment?: (
    commitment: Commitment,
    status: CommitmentStatus,
    reason?: string,
  ) => Promise<void>;
  source: TodaySource;
  sourceMessage: string;
  todayBlocks: PlanBlock[];
  weeklyFocus: string;
  weekLabel: string;
}) {
  const defaultCommitments = initialCommitments ?? (source === "demo" ? initialCommitmentsFallback : []);
  const [commitments, setCommitments] = useState(defaultCommitments);
  const [prepareOpen, setPrepareOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [updatingCommitmentIds, setUpdatingCommitmentIds] = useState<string[]>([]);
  const [selectedCommitments, setSelectedCommitments] = useState(() =>
    getCommitmentOptions(source, todayBlocks).map((commitment) => commitment.id),
  );

  const commitmentOptions = useMemo(
    () => getCommitmentOptions(source, todayBlocks),
    [source, todayBlocks],
  );
  const displayedTodayBlocks = useMemo(
    () =>
      todayBlocks.map((block) => {
        const linkedCommitment = commitments.find(
          (commitment) => commitment.sourceWeeklyPlanBlockId === block.id,
        );

        return linkedCommitment
          ? { ...block, status: commitmentStatusToPlanBlockStatus(linkedCommitment.status) }
          : block;
      }),
    [commitments, todayBlocks],
  );
  const completedCommitments = commitments.filter((commitment) => commitment.status === "done").length;
  const doneBlocks = displayedTodayBlocks.filter((block) => block.status === "Feito").length;

  async function updateCommitment(id: string, status: CommitmentStatus) {
    const currentCommitment = commitments.find((item) => item.id === id);
    const reason =
      status === "adjusted" || status === "not-done"
        ? currentCommitment?.reason ?? "Energia baixa"
        : undefined;

    const previousCommitments = commitments;

    setCommitments((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              reason: status === "adjusted" || status === "not-done" ? item.reason ?? "Energia baixa" : undefined,
            }
          : item,
      ),
    );

    if (currentCommitment && onUpdateCommitment) {
      setUpdatingCommitmentIds((items) => [...items.filter((item) => item !== id), id]);

      try {
        await onUpdateCommitment(currentCommitment, status, reason);
      } catch (error) {
        console.error(error);
        setCommitments(previousCommitments);
      } finally {
        setUpdatingCommitmentIds((items) => items.filter((item) => item !== id));
      }
    }
  }

  async function updateReason(id: string, reason: string) {
    setCommitments((items) => items.map((item) => (item.id === id ? { ...item, reason } : item)));
    const currentCommitment = commitments.find((item) => item.id === id);

    if (currentCommitment && onUpdateCommitment) {
      await onUpdateCommitment(currentCommitment, currentCommitment.status, reason);
    }
  }

  async function confirmPrepareDay(extraTitle?: string) {
    const selected = commitmentOptions.filter((commitment) => selectedCommitments.includes(commitment.id));
    const customCommitment = extraTitle?.trim()
      ? {
          id: `custom-${Date.now()}`,
          kind: "Foco" as const,
          text: extraTitle.trim(),
          estimate: "opcional",
          status: "planned" as const,
        }
      : null;
    const nextCommitments = [
      ...(selected.length ? selected : commitmentOptions.slice(0, 1)),
      ...(customCommitment ? [customCommitment] : []),
    ].slice(0, 3);
    const savedCommitments = onPrepareDay ? await onPrepareDay(nextCommitments) : nextCommitments;

    setCommitments(savedCommitments.length ? savedCommitments : nextCommitments);
    setPrepareOpen(false);
  }

  return (
    <section className="ep-page today-page today-print-match">
      {source === "active" ? null : <TodayModeBanner message={sourceMessage} source={source} />}
      <div className="ep-page-header today-head">
        <div>
          <span>{getTodayHeaderLabel(weekLabel)}</span>
          <h1>Bom dia, João.</h1>
          <p>
            Foco da semana · <strong>{weeklyFocus}</strong>
          </p>
        </div>
        <div className="today-head-actions">
          <Link className="ep-button secondary" href="/weekly">
            <Edit3 size={14} aria-hidden="true" />
            Editar foco
          </Link>
          <button className="ep-button primary" type="button" onClick={() => setPrepareOpen(true)}>
            <Check size={14} aria-hidden="true" />
            {dailyPlanStatus === "closed" ? "Editar dia" : "Preparar dia"}
          </button>
        </div>
      </div>

      <div className="today-layout">
        <main className="today-main">
          <CommitmentsCard
            commitments={commitments}
            completed={completedCommitments}
            dailyPlanStatus={dailyPlanStatus}
            onPrepare={() => setPrepareOpen(true)}
            onReasonChange={updateReason}
            onStatusChange={updateCommitment}
            updatingCommitmentIds={updatingCommitmentIds}
          />
          <PlannedBlocksCard blocks={displayedTodayBlocks} doneBlocks={doneBlocks} source={source} />
          <AttentionCard source={source} />
        </main>

        <aside className="today-side">
          <WeeklyProgressCard />
          <CoachCard />
          <button className="today-close-button" type="button" onClick={() => setCloseOpen(true)}>
            <Check size={14} aria-hidden="true" />
            {dailyPlanStatus === "closed" ? "Dia fechado" : "Fechar dia"}
          </button>
        </aside>
      </div>

      {prepareOpen ? (
        <PrepareDayDialog
          onClose={() => setPrepareOpen(false)}
          onConfirm={confirmPrepareDay}
          options={commitmentOptions}
          selectedCommitments={selectedCommitments}
          setSelectedCommitments={setSelectedCommitments}
        />
      ) : null}

      {closeOpen ? (
        <CloseDayDialog
          commitments={commitments}
          onClose={() => setCloseOpen(false)}
          onSave={async () => {
            if (onCloseDay) await onCloseDay();
            setCloseOpen(false);
          }}
          onReasonChange={updateReason}
          onStatusChange={updateCommitment}
        />
      ) : null}
    </section>
  );
}

function TodayModeBanner({ message, source }: { message: string; source: TodaySource }) {
  return (
    <div className={source === "active" ? "wp-demo-banner is-real" : "wp-demo-banner"}>
      <div>
        <strong>
          {source === "active"
            ? "Plano ativo ligado"
            : source === "no-active-plan"
              ? "Sem plano semanal ativo"
              : "Modo demo/mock"}
        </strong>
        <span>{message}</span>
      </div>
      {source === "no-active-plan" ? (
        <Link className="ep-button secondary" href="/weekly">
          Ir para Plano semanal
        </Link>
      ) : null}
    </div>
  );
}

function getCommitmentOptions(source: TodaySource, todayBlocks: PlanBlock[]) {
  if (source === "demo") return initialCommitmentsFallback;

  return todayBlocks.map<Commitment>((block) => ({
    id: `block-${block.id}`,
    sourceWeeklyPlanBlockId: block.id as Id<"weeklyPlanBlocks">,
    kind: block.type,
    text: block.title,
    estimate: block.target ?? "sem alvo",
    status: "planned",
  }));
}

function fromStoredCommitmentStatus(status: "planned" | "done" | "adjusted" | "notDone"): CommitmentStatus {
  return status === "notDone" ? "not-done" : status;
}

function toStoredCommitmentStatus(status: CommitmentStatus) {
  return status === "not-done" ? "notDone" : status;
}

function getTodayHeaderLabel(weekLabel: string) {
  const formatter = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    weekday: "long",
    timeZone: "UTC",
  });
  const formatted = formatter.format(new Date(`${todayIsoDate}T00:00:00.000Z`));

  return `${formatted} · ${weekLabel}`.toUpperCase();
}

function CommitmentsCard({
  commitments,
  completed,
  dailyPlanStatus,
  onPrepare,
  onReasonChange,
  onStatusChange,
  updatingCommitmentIds,
}: {
  commitments: Commitment[];
  completed: number;
  dailyPlanStatus?: "prepared" | "closed";
  onPrepare: () => void;
  onReasonChange: (id: string, reason: string) => void;
  onStatusChange: (id: string, status: CommitmentStatus) => void;
  updatingCommitmentIds: string[];
}) {
  const isPrepared = commitments.length > 0;

  return (
    <article className="today-panel today-commitments-card">
      <header className="today-card-head">
        <div>
          <span className="today-card-icon">⊙</span>
          <h2>Compromissos de hoje</h2>
        </div>
        {isPrepared ? (
          <small>
            {dailyPlanStatus === "closed" ? "Fechado" : `${completed} / ${commitments.length} feitos`}
          </small>
        ) : (
          <em>Por preparar</em>
        )}
      </header>
      {isPrepared ? (
        <>
          <p>Escolhidos esta manhã. O que ficar por fazer ao final do dia entra na revisão de amanhã.</p>
          <div className="today-commitment-list">
            {commitments.map((commitment) => (
              <div className={`today-commitment ${statusClass(commitment.status)}`} key={commitment.id}>
                <div className="today-commitment-kind">
                  <span className={`today-chip ${kindClass(commitment.kind)}`}>{commitment.kind}</span>
                  <small>{commitment.estimate}</small>
                </div>
                <div className="today-commitment-body">
                  <div className="today-commitment-title-row">
                    <strong>{commitment.text}</strong>
                    <span className={`today-status-pill ${statusClass(commitment.status)}`}>
                      {updatingCommitmentIds.includes(commitment.id) ? "A guardar..." : statusLabels[commitment.status]}
                    </span>
                  </div>
                  <div className="today-commitment-control-row">
                    <div className="today-commitment-actions">
                      <button
                        className={commitment.status === "done" ? "active" : undefined}
                        type="button"
                        onClick={() => onStatusChange(commitment.id, "done")}
                      >
                        <Check size={13} aria-hidden="true" />
                        Feito
                      </button>
                      <button
                        className={commitment.status === "adjusted" ? "active" : undefined}
                        type="button"
                        onClick={() => onStatusChange(commitment.id, "adjusted")}
                      >
                        <Edit3 size={12} aria-hidden="true" />
                        Ajustar
                      </button>
                      <button
                        className={commitment.status === "not-done" ? "active" : undefined}
                        type="button"
                        onClick={() => onStatusChange(commitment.id, "not-done")}
                      >
                        <X size={13} aria-hidden="true" />
                        Não feito
                      </button>
                    </div>
                    {commitment.status === "adjusted" || commitment.status === "not-done" ? (
                      <label className="today-reason">
                        Motivo opcional
                        <select value={commitment.reason} onChange={(event) => onReasonChange(commitment.id, event.target.value)}>
                          {reasonOptions.map((reason) => (
                            <option key={reason}>{reason}</option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="today-prepare-empty">
          <div className="today-prepare-visual" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p>Em 60 segundos, escolhe 1 a 3 ações práticas que tornam este dia bem executado.</p>
          <button className="ep-button primary" type="button" onClick={onPrepare}>
            <Check size={14} aria-hidden="true" />
            Preparar dia
          </button>
        </div>
      )}
    </article>
  );
}

function PlannedBlocksCard({
  blocks,
  doneBlocks,
  source,
}: {
  blocks: PlanBlock[];
  doneBlocks: number;
  source: TodaySource;
}) {
  return (
    <article className="today-panel today-blocks-card">
      <header className="today-card-head">
        <div>
          <span className="today-card-icon">▣</span>
          <h2>Blocos planeados</h2>
          <em>Contexto da semana</em>
        </div>
        <small>{doneBlocks} / {blocks.length} feitos</small>
      </header>
      <div className="today-block-list">
        {blocks.length ? (
          blocks.map((block) => (
            <div className={`today-block-row ${kindClass(block.type)} st-${statusClass(block.status)}`} key={block.id}>
              <span>
                {blockLabel(block.type)}
                {block.source === "coachProposal" ? <em className="ep-origin-badge">Coach</em> : null}
              </span>
              <strong>{block.title}</strong>
              <small>{block.target ?? "—"}</small>
              <i>{block.status}</i>
              <button type="button" aria-label={`Mais ações para ${block.title}`}>
                <MoreHorizontal size={15} aria-hidden="true" />
              </button>
            </div>
          ))
        ) : (
          <div className="today-empty-blocks">
            {source === "no-active-plan"
              ? "Ativa um plano semanal para veres aqui os blocos planeados de hoje."
              : "Não há blocos planeados para hoje."}
          </div>
        )}
      </div>
    </article>
  );
}

function AttentionCard({ source }: { source: TodaySource }) {
  const items =
    source === "demo"
      ? [
          { title: "Estudo abaixo do ritmo", detail: "3h15 de 5h previstas — adiciona 45 min antes da próxima sessão", action: "Resolver" },
          { title: "3 mãos pendentes para rever", detail: "Marcadas na sessão de ontem (ICM, bluff catch, river difícil)", action: "Rever" },
          { title: "Bloco “Corrida” não feito 3x", detail: "Padrão de adiamento — Coach pode propor reformulação", action: "Pedir ao Coach" },
        ]
      : [
          {
            title: "Atenção ligada a dados reais vem a seguir",
            detail: "Nesta slice, Today já usa o plano ativo. Sessões, mãos pendentes e ritmo mensal ainda não estão persistidos.",
            action: "Depois",
          },
        ];

  return (
    <article className="today-panel today-attention-card">
      <header className="today-card-head">
        <h2>Atenção</h2>
        <small>{items.length} {items.length === 1 ? "item" : "itens"}</small>
      </header>
      <div className="today-attention-list">
        {items.map((item) => (
          <div className="today-attention-item" key={item.title}>
            <span aria-hidden="true">!</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </div>
            <button type="button">{item.action}</button>
          </div>
        ))}
      </div>
    </article>
  );
}

function WeeklyProgressCard() {
  return (
    <article className="today-panel today-progress-card">
      <header className="today-card-head">
        <h2>Progresso semanal</h2>
        <small>semana 18</small>
      </header>
      <div className="today-progress-grid">
        <ProgressMetric label="Grind" sub="64% · no ritmo" value="9h / 14h" />
        <ProgressMetric label="Estudo" sub="-40m vs ritmo" value="3h 15m / 5h" warning />
        <ProgressMetric label="Revisão" sub="-15m vs ritmo" value="1h 10m / 2h" />
        <ProgressMetric label="Sport" sub="no ritmo" value="2h / 3h" />
      </div>
      <div className="today-month-progress">
        <span>Mês · Maio</span>
        <div>
          <strong>42h / 80h</strong>
          <small>52% · projeção 78h</small>
        </div>
        <progress value={52} max={100} />
      </div>
    </article>
  );
}

function ProgressMetric({
  label,
  sub,
  value,
  warning,
}: {
  label: string;
  sub: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="today-progress-metric">
      <span>{label}</span>
      <strong className={warning ? "warning" : undefined}>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}

function CoachCard() {
  return (
    <article className="today-panel today-coach-card">
      <header className="today-card-head">
        <div>
          <Sparkles size={18} aria-hidden="true" />
          <h2>Coach</h2>
        </div>
        <small>há 2 min</small>
      </header>
      <div className="today-coach-body">
        <span>✶</span>
        <p>
          Tens uma sessão pendente de revisão e estudo abaixo do ritmo. Antes da grind da noite, posso preparar uma
          proposta com 30 min de revisão e 25 min de ICM.
        </p>
      </div>
      <small className="today-coach-context">Contexto: plano da semana + 3 últimas sessões</small>
      <Link className="today-coach-link" href="/coach">
        Pedir ao Coach →
      </Link>
    </article>
  );
}

function PrepareDayDialog({
  onClose,
  onConfirm,
  options,
  selectedCommitments,
  setSelectedCommitments,
}: {
  onClose: () => void;
  onConfirm: (extraTitle?: string) => void;
  options: Commitment[];
  selectedCommitments: string[];
  setSelectedCommitments: (items: string[]) => void;
}) {
  const [extraCommitment, setExtraCommitment] = useState("");

  function toggleCommitment(id: string) {
    setSelectedCommitments(
      selectedCommitments.includes(id)
        ? selectedCommitments.filter((item) => item !== id)
        : [...selectedCommitments, id].slice(0, 3),
    );
  }

  return (
    <DialogFrame title="Preparar dia" onClose={onClose}>
      <div className="today-dialog-body">
        <p className="today-dialog-copy">
          Escolhe 1 a 3 ações que tornam este dia bem executado. Não é a tua agenda — é o que importa.
        </p>
        <div className="today-pick-list">
          {options.length ? (
            options.map((commitment) => (
              <label className={selectedCommitments.includes(commitment.id) ? "selected" : undefined} key={commitment.id}>
                <input
                  checked={selectedCommitments.includes(commitment.id)}
                  onChange={() => toggleCommitment(commitment.id)}
                  type="checkbox"
                />
                <div className="today-pick-body">
                  <span>
                    <em className={`today-chip ${kindClass(commitment.kind)}`}>{commitment.kind}</em>
                    <small>{commitment.estimate}</small>
                  </span>
                  <strong>{commitment.text}</strong>
                </div>
              </label>
            ))
          ) : (
            <div className="today-empty-blocks">
              Não há blocos planeados para transformar em compromissos hoje.
            </div>
          )}
        </div>
        <label className="today-extra-commitment">
          Adicionar compromisso (opcional)
          <input
            maxLength={90}
            onChange={(event) => setExtraCommitment(event.target.value)}
            placeholder="Texto curto, observável..."
            value={extraCommitment}
          />
        </label>
      </div>
      <div className="today-dialog-foot">
        <button className="ep-button secondary" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="ep-button primary" type="button" onClick={() => onConfirm(extraCommitment)}>
          <Check size={14} aria-hidden="true" />
          Confirmar dia
        </button>
      </div>
    </DialogFrame>
  );
}

function CloseDayDialog({
  commitments,
  onClose,
  onSave,
  onReasonChange,
  onStatusChange,
}: {
  commitments: Commitment[];
  onClose: () => void;
  onSave: () => void;
  onReasonChange: (id: string, reason: string) => void;
  onStatusChange: (id: string, status: CommitmentStatus) => void;
}) {
  return (
    <DialogFrame title="Fechar dia" onClose={onClose}>
      <div className="today-dialog-body">
        <p className="today-dialog-copy">Confirma o que ficou pendente. Motivos são opcionais e servem só para padrões futuros.</p>
        <div className="today-close-list">
          {commitments.map((commitment) => (
            <div key={commitment.id}>
              <strong>{commitment.text}</strong>
              <div className="today-close-actions">
                <button
                  className={commitment.status === "done" ? "active" : undefined}
                  type="button"
                  onClick={() => onStatusChange(commitment.id, "done")}
                >
                  Feito
                </button>
                <button
                  className={commitment.status === "adjusted" ? "active" : undefined}
                  type="button"
                  onClick={() => onStatusChange(commitment.id, "adjusted")}
                >
                  Ajustado
                </button>
                <button
                  className={commitment.status === "not-done" ? "active" : undefined}
                  type="button"
                  onClick={() => onStatusChange(commitment.id, "not-done")}
                >
                  Não feito
                </button>
              </div>
              <small className={`today-close-status ${statusClass(commitment.status)}`}>
                {statusLabels[commitment.status]}
              </small>
              {commitment.status === "adjusted" || commitment.status === "not-done" ? (
                <label className="today-reason">
                  Motivo opcional
                  <select value={commitment.reason} onChange={(event) => onReasonChange(commitment.id, event.target.value)}>
                    {reasonOptions.map((reason) => (
                      <option key={reason}>{reason}</option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ))}
        </div>
        <label className="today-note">
          Nota curta opcional
          <textarea placeholder="Uma frase sobre o dia..." />
        </label>
      </div>
      <div className="today-dialog-foot">
        <button className="ep-button secondary" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="ep-button primary" type="button" onClick={onSave}>
          <Check size={14} aria-hidden="true" />
          Guardar e fechar dia
        </button>
      </div>
    </DialogFrame>
  );
}

function DialogFrame({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <>
      <button className="today-scrim" type="button" aria-label="Fechar" onClick={onClose} />
      <section className="today-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        {children}
      </section>
    </>
  );
}
