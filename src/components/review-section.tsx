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
import Link from "next/link";
import { useState, type ReactNode } from "react";

import styles from "./review-section.module.css";

type ReviewStatus = "available" | "draft" | "completed" | "skipped";
type CategoryId = "grind" | "study" | "review" | "sport";
type BlockStatus = "done" | "adjusted" | "notDone";

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

const categorySummary: CategorySummary[] = [
  {
    id: "grind",
    label: "Grind",
    planned: "5 sessões",
    done: "4 sessões",
    adjusted: 1,
    missed: 0,
    completion: 82,
    icon: Spade,
    details: [
      { status: "done", title: "Sessão MTT — manhã", meta: "Qua · 2h" },
      { status: "done", title: "Sessão MTT — noite", meta: "Seg · Ter · Qui" },
      {
        status: "adjusted",
        title: "Sessão MTT — sábado",
        meta: "4h → 2h 30m",
        reason: "Energia caiu depois da sessão anterior.",
      },
    ],
  },
  {
    id: "study",
    label: "Estudo",
    planned: "5h",
    done: "3h 15m",
    adjusted: 1,
    missed: 1,
    completion: 65,
    icon: Target,
    details: [
      { status: "done", title: "ICM até bolha", meta: "2 blocos · 1h 30m" },
      {
        status: "adjusted",
        title: "Open ranges",
        meta: "45m → 25m",
        reason: "Manhã atrasou e a sessão começou mais cedo.",
      },
      {
        status: "notDone",
        title: "Bluff catch",
        meta: "45m",
        reason: "Fui direto para a sessão.",
      },
    ],
  },
  {
    id: "review",
    label: "Review",
    planned: "2 blocos",
    done: "1 bloco",
    adjusted: 1,
    missed: 0,
    completion: 58,
    icon: BookCheck,
    details: [
      { status: "done", title: "Revisão das mãos de terça", meta: "40m" },
      {
        status: "adjusted",
        title: "Revisão semanal de tendências",
        meta: "1h 15m → 30m",
        reason: "Reduzida para chegar a tempo da sessão da noite.",
      },
    ],
  },
  {
    id: "sport",
    label: "Sport",
    planned: "3 blocos",
    done: "2 blocos",
    adjusted: 0,
    missed: 1,
    completion: 67,
    icon: RotateCcw,
    details: [
      { status: "done", title: "Corrida — base", meta: "2 blocos · 1h 20m" },
      {
        status: "notDone",
        title: "Corrida — recovery",
        meta: "40m",
        reason: "Adiada três vezes.",
      },
    ],
  },
];

const statusCopy: Record<BlockStatus, string> = {
  done: "Feito",
  adjusted: "Ajustado",
  notDone: "Não feito",
};

export function ReviewSection() {
  const [status, setStatus] = useState<ReviewStatus>("available");
  const [expanded, setExpanded] = useState<CategoryId | null>("study");
  const [sessionContextOpen, setSessionContextOpen] = useState(true);
  const [ratings, setRatings] = useState({
    execution: 4,
    energy: 3,
    focus: 4,
    quality: 4,
  });
  const [reflection, setReflection] = useState({
    wins: "Mantive tilt baixo nas sessões longas e cumpri o foco de ICM na maioria das decisões difíceis.",
    leaks:
      "Estudo caiu sempre que a manhã atrasou. Review ficou comprimida antes das sessões da noite.",
    reasons: ["Pouca energia", "Falta de tempo", "Plano irrealista"],
    next:
      "Mover estudo para antes da primeira sessão e reduzir Sport para dois blocos curtos nesta semana.",
  });

  const coachUnlocked = status === "completed";

  const adjustedCount = categorySummary.reduce((total, item) => total + item.adjusted, 0);
  const missedCount = categorySummary.reduce((total, item) => total + item.missed, 0);

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

  function saveReview() {
    setStatus("completed");
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
            <button className="ep-button secondary" type="button" onClick={() => setStatus("skipped")}>
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
              <strong>{pendingSessionReviews.length}</strong>
              <ChevronDown size={16} aria-hidden="true" />
            </button>

            {sessionContextOpen ? (
              <div className={styles.pendingList}>
                <p>Podem melhorar o contexto da revisão semanal, mas não são obrigatórias agora.</p>
                {pendingSessionReviews.map((session) => (
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
              eyebrow="Espelho da semana"
              icon={<FileText size={17} aria-hidden="true" />}
              title="Plano vs execução"
            />

            <div className={styles.summaryGrid}>
              {categorySummary.map((category) => (
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
                {reasonOptions.map((reason) => (
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
              <button className="ep-button secondary" type="button" onClick={() => setStatus("draft")}>
                Guardar rascunho
              </button>
              <button className="ep-button primary" type="button" onClick={saveReview}>
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
            <div className={styles.detailRow} key={`${category.id}-${detail.title}`}>
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
