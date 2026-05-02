"use client";

import { Check, Edit3, MoreHorizontal, Play, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useMemo, useState } from "react";
import {
  initialPlanDays,
  initialWeeklyFocus,
  type PlanBlock,
  type PlanBlockStatus,
  type PlanBlockType,
} from "@/lib/planning/weekly-plan";

type CommitmentStatus = "planned" | "done" | "adjusted" | "not-done";
type CommitmentKind = "Revisão" | "Foco" | "Estudo";
type PlanChoice = "follow" | "adjust" | "reduce";

type Commitment = {
  id: string;
  kind: CommitmentKind;
  text: string;
  estimate: string;
  status: CommitmentStatus;
  reason?: string;
};

const initialCommitments: Commitment[] = [
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

function getTodayBlocks() {
  return initialPlanDays.find((day) => day.isToday)?.blocks ?? [];
}

function statusClass(status: CommitmentStatus | PlanBlockStatus) {
  if (status === "done" || status === "Feito") return "done";
  if (status === "adjusted" || status === "Ajustado") return "adjusted";
  if (status === "not-done" || status === "Não feito") return "not-done";
  return "planned";
}

function kindClass(kind: CommitmentKind | PlanBlockType) {
  return kind.toLowerCase().replace("ã", "a").replace("ç", "c");
}

function blockLabel(type: PlanBlockType) {
  return type === "Desporto" ? "Sport" : type;
}

export function TodayExecution() {
  const todayBlocks = useMemo(getTodayBlocks, []);
  const [commitments, setCommitments] = useState(initialCommitments);
  const [prepareOpen, setPrepareOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [planChoice, setPlanChoice] = useState<PlanChoice>("follow");
  const [selectedCommitments, setSelectedCommitments] = useState(() =>
    initialCommitments.map((commitment) => commitment.id),
  );

  const completedCommitments = commitments.filter((commitment) => commitment.status === "done").length;
  const doneBlocks = todayBlocks.filter((block) => block.status === "Feito").length;

  function updateCommitment(id: string, status: CommitmentStatus) {
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
  }

  function updateReason(id: string, reason: string) {
    setCommitments((items) => items.map((item) => (item.id === id ? { ...item, reason } : item)));
  }

  function confirmPrepareDay() {
    const selected = initialCommitments.filter((commitment) => selectedCommitments.includes(commitment.id));
    setCommitments(selected.length ? selected.slice(0, 3) : initialCommitments.slice(0, 1));
    setPrepareOpen(false);
  }

  return (
    <section className="ep-page today-page today-print-match">
      <div className="ep-page-header today-head">
        <div>
          <span>Quinta · 14 Maio · Semana 18</span>
          <h1>Bom dia, João.</h1>
          <p>
            Foco da semana · <strong>{initialWeeklyFocus}</strong>
          </p>
        </div>
        <div className="today-head-actions">
          <button className="ep-button secondary" type="button" onClick={() => setPrepareOpen(true)}>
            <Edit3 size={14} aria-hidden="true" />
            Ajustar dia
          </button>
          <Link className="ep-button primary" href="/sessions">
            <Play size={14} aria-hidden="true" />
            Iniciar sessão
          </Link>
        </div>
      </div>

      <div className="today-layout">
        <main className="today-main">
          <CommitmentsCard
            commitments={commitments}
            completed={completedCommitments}
            onReasonChange={updateReason}
            onStatusChange={updateCommitment}
          />
          <PlannedBlocksCard blocks={todayBlocks} doneBlocks={doneBlocks} />
        </main>

        <aside className="today-side">
          <WeeklyProgressCard />
          <CoachCard />
          <button className="today-close-button" type="button" onClick={() => setCloseOpen(true)}>
            <Check size={14} aria-hidden="true" />
            Fechar dia
          </button>
        </aside>
      </div>

      {prepareOpen ? (
        <PrepareDayDialog
          onClose={() => setPrepareOpen(false)}
          onConfirm={confirmPrepareDay}
          planChoice={planChoice}
          selectedCommitments={selectedCommitments}
          setPlanChoice={setPlanChoice}
          setSelectedCommitments={setSelectedCommitments}
        />
      ) : null}

      {closeOpen ? (
        <CloseDayDialog
          commitments={commitments}
          onClose={() => setCloseOpen(false)}
          onReasonChange={updateReason}
          onStatusChange={updateCommitment}
        />
      ) : null}
    </section>
  );
}

function CommitmentsCard({
  commitments,
  completed,
  onReasonChange,
  onStatusChange,
}: {
  commitments: Commitment[];
  completed: number;
  onReasonChange: (id: string, reason: string) => void;
  onStatusChange: (id: string, status: CommitmentStatus) => void;
}) {
  return (
    <article className="today-panel today-commitments-card">
      <header className="today-card-head">
        <div>
          <span className="today-card-icon">⊙</span>
          <h2>Compromissos de hoje</h2>
        </div>
        <small>{completed} / {commitments.length} feitos</small>
      </header>
      <p>Escolhidos esta manhã. O que ficar por fazer ao final do dia entra na revisão de amanhã.</p>
      <div className="today-commitment-list">
        {commitments.map((commitment) => (
          <div className={`today-commitment ${statusClass(commitment.status)}`} key={commitment.id}>
            <div className="today-commitment-kind">
              <span className={`today-chip ${kindClass(commitment.kind)}`}>{commitment.kind}</span>
              <small>{commitment.estimate}</small>
            </div>
            <div className="today-commitment-body">
              <strong>{commitment.text}</strong>
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
        ))}
      </div>
    </article>
  );
}

function PlannedBlocksCard({ blocks, doneBlocks }: { blocks: PlanBlock[]; doneBlocks: number }) {
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
        {blocks.map((block) => (
          <div className={`today-block-row ${kindClass(block.type)} st-${statusClass(block.status)}`} key={block.id}>
            <span>{blockLabel(block.type)}</span>
            <strong>{block.title}</strong>
            <small>{block.target ?? "—"}</small>
            <i>{block.status}</i>
            <button type="button" aria-label={`Mais ações para ${block.title}`}>
              <MoreHorizontal size={15} aria-hidden="true" />
            </button>
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
  planChoice,
  selectedCommitments,
  setPlanChoice,
  setSelectedCommitments,
}: {
  onClose: () => void;
  onConfirm: () => void;
  planChoice: PlanChoice;
  selectedCommitments: string[];
  setPlanChoice: (choice: PlanChoice) => void;
  setSelectedCommitments: (items: string[]) => void;
}) {
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
        <div className="today-state-grid">
          {["Sono 7h", "Energia 3/5", "Foco 4/5", "Stress 2/5"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="today-choice-group" aria-label="Escolha do plano">
          <button className={planChoice === "follow" ? "active" : undefined} type="button" onClick={() => setPlanChoice("follow")}>
            Seguir plano
          </button>
          <button className={planChoice === "adjust" ? "active" : undefined} type="button" onClick={() => setPlanChoice("adjust")}>
            Ajustar plano
          </button>
          <button className={planChoice === "reduce" ? "active" : undefined} type="button" onClick={() => setPlanChoice("reduce")}>
            Reduzir plano
          </button>
        </div>
        {planChoice === "reduce" ? <div className="today-reduce-prompt">Qual é o mínimo que ainda torna o dia útil?</div> : null}
        <div className="today-pick-list">
          <span>Escolhe 1 a 3 compromissos</span>
          {initialCommitments.map((commitment) => (
            <label className={selectedCommitments.includes(commitment.id) ? "selected" : undefined} key={commitment.id}>
              <input
                checked={selectedCommitments.includes(commitment.id)}
                onChange={() => toggleCommitment(commitment.id)}
                type="checkbox"
              />
              <div>
                <strong>{commitment.text}</strong>
                <small>
                  {commitment.kind} · {commitment.estimate}
                </small>
              </div>
            </label>
          ))}
        </div>
      </div>
      <div className="today-dialog-foot">
        <button className="ep-button secondary" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="ep-button primary" type="button" onClick={onConfirm}>
          <Check size={14} aria-hidden="true" />
          Começar dia
        </button>
      </div>
    </DialogFrame>
  );
}

function CloseDayDialog({
  commitments,
  onClose,
  onReasonChange,
  onStatusChange,
}: {
  commitments: Commitment[];
  onClose: () => void;
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
                <button type="button" onClick={() => onStatusChange(commitment.id, "done")}>
                  Feito
                </button>
                <button type="button" onClick={() => onStatusChange(commitment.id, "adjusted")}>
                  Ajustado
                </button>
                <button type="button" onClick={() => onStatusChange(commitment.id, "not-done")}>
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
        <button className="ep-button primary" type="button" onClick={onClose}>
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
