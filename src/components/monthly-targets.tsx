"use client";

import {
  AlertTriangle,
  ArrowRight,
  BookCheck,
  Check,
  Dumbbell,
  Edit3,
  Gauge,
  GraduationCap,
  Save,
  Spade,
  Target,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import styles from "./monthly-targets.module.css";

type CategoryId = "grind" | "study" | "review" | "sport";
type PaceStatus = "missing" | "none" | "behind" | "on" | "ahead" | "complete";

type TargetRow = {
  id: CategoryId;
  label: string;
  description: string;
  icon: typeof Spade;
  accent: string;
  primaryUnit: string;
  targetValue: number;
  currentValue: number;
  secondaryUnit?: string;
  secondaryTargetValue?: number;
  currentSecondaryValue?: number;
};

const annualDirection = {
  primary: "Construir uma rotina profissional sustentável sem compensar volume com cansaço.",
  priorities: ["Disciplina em ICM", "Estudo antes da grind", "Energia protegida"],
  constraints: "Domingo é dia crítico de volume. Sexta deve continuar leve.",
};

const initialTargets: TargetRow[] = [
  {
    id: "grind",
    label: "Grind",
    description: "Sessões MTT concluídas no mês.",
    icon: Spade,
    accent: "var(--ep-cat-grind)",
    primaryUnit: "sessões",
    targetValue: 16,
    currentValue: 8,
    secondaryUnit: "torneios",
    secondaryTargetValue: 240,
    currentSecondaryValue: 118,
  },
  {
    id: "study",
    label: "Estudo",
    description: "Tempo registado no log de estudo.",
    icon: GraduationCap,
    accent: "var(--ep-cat-study)",
    primaryUnit: "horas",
    targetValue: 6,
    currentValue: 3,
  },
  {
    id: "review",
    label: "Review",
    description: "Mãos revistas ou tempo dedicado a revisão.",
    icon: BookCheck,
    accent: "var(--ep-cat-review)",
    primaryUnit: "mãos",
    targetValue: 80,
    currentValue: 40,
  },
  {
    id: "sport",
    label: "Sport",
    description: "Sessões ou blocos de treino/recovery.",
    icon: Dumbbell,
    accent: "var(--ep-cat-sport)",
    primaryUnit: "sessões",
    targetValue: 4,
    currentValue: 1,
  },
];

const unitOptions: Record<CategoryId, string[]> = {
  grind: ["sessões"],
  study: ["horas", "minutos"],
  review: ["mãos", "horas", "minutos"],
  sport: ["sessões", "blocos", "horas", "minutos"],
};

const secondaryUnitOptions: Partial<Record<CategoryId, string[]>> = {
  grind: ["torneios"],
};

const paceLabels: Record<PaceStatus, string> = {
  missing: "Sem meta mensal",
  none: "Sem progresso",
  behind: "Abaixo do ritmo",
  on: "Dentro do ritmo",
  ahead: "Acima do ritmo",
  complete: "Completo",
};

function getPaceStatus(current: number, target: number): PaceStatus {
  if (!target) return "missing";
  if (current <= 0) return "none";
  if (current >= target) return "complete";

  const expectedProgress = 14 / 31;
  const progress = current / target;

  if (progress < expectedProgress - 0.08) return "behind";
  if (progress > expectedProgress + 0.12) return "ahead";
  return "on";
}

function formatValue(value: number, unit: string) {
  if (unit === "horas") return `${value}h`;
  if (unit === "minutos") return `${value}m`;
  return `${value} ${unit}`;
}

export function MonthlyTargets() {
  const [targets, setTargets] = useState(initialTargets);
  const [editingId, setEditingId] = useState<CategoryId | null>(null);
  const [showAnnualDirection, setShowAnnualDirection] = useState(true);
  const [hasAnnualDirection, setHasAnnualDirection] = useState(true);
  const [draft, setDraft] = useState<TargetRow | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("saved");

  const editingTarget = targets.find((target) => target.id === editingId) ?? null;

  const paceSummary = useMemo(
    () =>
      targets.map((target) => ({
        ...target,
        pace: getPaceStatus(target.currentValue, target.targetValue),
      })),
    [targets],
  );

  const startEditing = (target: TargetRow) => {
    setEditingId(target.id);
    setDraft({ ...target });
    setSaveState("idle");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(null);
    setSaveState("saved");
  };

  const saveDraft = () => {
    if (!draft || draft.targetValue <= 0) {
      setSaveState("error");
      return;
    }

    setTargets((current) => current.map((target) => (target.id === draft.id ? draft : target)));
    setEditingId(null);
    setDraft(null);
    setSaveState("saved");
  };

  const hasTargets = targets.some((target) => target.targetValue > 0);

  return (
    <section className="ep-page">
      <div className="ep-page-header">
        <div>
          <span>Maio · dia 14 de 31</span>
          <h1>Objetivos mensais</h1>
          <p>Define o ritmo do mês para orientar a semana e o dia.</p>
        </div>
        <div className="ep-page-actions">
          <button className="ep-button secondary" type="button" onClick={() => setHasAnnualDirection((value) => !value)}>
            {hasAnnualDirection ? "Ver estado sem direção anual" : "Repor direção anual"}
          </button>
          <button
            className="ep-button primary"
            type="button"
            onClick={() => startEditing(targets[0])}
          >
            {hasTargets ? "Editar objetivos" : "Definir objetivos"}
          </button>
        </div>
      </div>

      <article className={hasAnnualDirection ? styles.annualStrip : styles.annualStripMissing}>
        <div className={styles.annualHeader}>
          <div>
            <span>Direção anual</span>
            <h2>{hasAnnualDirection ? "Este mês deve aproximar-te disto:" : "Sem direção anual"}</h2>
          </div>
          <button
            aria-expanded={showAnnualDirection}
            className={styles.textButton}
            type="button"
            onClick={() => setShowAnnualDirection((value) => !value)}
          >
            {showAnnualDirection ? "Recolher" : "Ver contexto"}
          </button>
        </div>

        {showAnnualDirection ? (
          hasAnnualDirection ? (
            <>
              <p>{annualDirection.primary}</p>
              <div className={styles.priorityList} aria-label="Prioridades do ano">
                {annualDirection.priorities.map((priority) => (
                  <span key={priority}>{priority}</span>
                ))}
              </div>
              <small>{annualDirection.constraints}</small>
            </>
          ) : (
            <div className={styles.missingDirection}>
              <AlertTriangle size={18} aria-hidden="true" />
              <div>
                <strong>Ainda não definiste a direção anual.</strong>
                <p>Podes definir objetivos mensais agora, mas o plano terá menos contexto estratégico.</p>
              </div>
              <button className="ep-button secondary" type="button">
                Definir direção anual
              </button>
            </div>
          )
        ) : null}
      </article>

      {!hasTargets ? (
        <article className={styles.emptyState}>
          <Target size={22} aria-hidden="true" />
          <div>
            <h2>Ainda não tens objetivos para este mês.</h2>
            <p>Define metas simples para Grind, Estudo, Review e Sport. Isto vai dar contexto ao Hoje e ao Plano semanal.</p>
          </div>
          <button className="ep-button primary" type="button" onClick={() => startEditing(targets[0])}>
            Definir objetivos
          </button>
        </article>
      ) : null}

      <div className={styles.monthlyLayout}>
        <article className={styles.targetTable} aria-label="Objetivos mensais por categoria">
          <header className={styles.tableHeader}>
            <span>Categoria</span>
            <span>Progresso atual</span>
            <span>Objetivo</span>
            <span>Ritmo</span>
            <span aria-label="Ações" />
          </header>

          {paceSummary.map((target) => {
            const Icon = target.icon;
            const progress = Math.min(100, Math.round((target.currentValue / target.targetValue) * 100));

            return (
              <div className={styles.targetRow} key={target.id} style={{ "--accent": target.accent } as React.CSSProperties}>
                <div className={styles.categoryCell}>
                  <span className={styles.categoryIcon}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{target.label}</strong>
                    <small>{target.description}</small>
                  </div>
                </div>

                <div className={styles.progressCell}>
                  <strong>{formatValue(target.currentValue, target.primaryUnit)}</strong>
                  <div className={styles.progressTrack} aria-hidden="true">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  {target.currentSecondaryValue && target.secondaryTargetValue && target.secondaryUnit ? (
                    <small>
                      {target.currentSecondaryValue}/{target.secondaryTargetValue} {target.secondaryUnit}
                    </small>
                  ) : null}
                </div>

                <div className={styles.valueCell}>{formatValue(target.targetValue, target.primaryUnit)}</div>

                <div>
                  <span className={`${styles.pacePill} ${styles[target.pace]}`}>
                    {paceLabels[target.pace]}
                  </span>
                </div>

                <button className={styles.iconButton} type="button" onClick={() => startEditing(target)}>
                  <Edit3 size={15} aria-hidden="true" />
                  <span>Editar categoria</span>
                </button>
              </div>
            );
          })}
        </article>

        <aside className={styles.sideStack}>
          <article className={styles.editorPanel}>
            <div className={styles.panelHeading}>
              <div>
                <span>Editor</span>
                <h2>{editingTarget ? editingTarget.label : "Categoria"}</h2>
              </div>
              {editingTarget ? <span className={styles.activeDot}>A editar</span> : null}
            </div>

            {draft ? (
              <div className={styles.editorForm}>
                <label>
                  Unidade principal
                  <select
                    value={draft.primaryUnit}
                    onChange={(event) => setDraft({ ...draft, primaryUnit: event.target.value })}
                  >
                    {unitOptions[draft.id].map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Objetivo
                  <input
                    min="1"
                    type="number"
                    value={draft.targetValue}
                    onChange={(event) => setDraft({ ...draft, targetValue: Number(event.target.value) })}
                  />
                </label>

                {secondaryUnitOptions[draft.id] ? (
                  <div className={styles.secondaryFields}>
                    <label>
                      Unidade secundária
                      <select
                        value={draft.secondaryUnit ?? "torneios"}
                        onChange={(event) => setDraft({ ...draft, secondaryUnit: event.target.value })}
                      >
                        {secondaryUnitOptions[draft.id]?.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Objetivo secundário
                      <input
                        min="1"
                        type="number"
                        value={draft.secondaryTargetValue ?? ""}
                        onChange={(event) =>
                          setDraft({ ...draft, secondaryTargetValue: Number(event.target.value) })
                        }
                      />
                    </label>
                  </div>
                ) : null}

                {saveState === "error" ? (
                  <p className={styles.errorText}>Não foi possível guardar os objetivos. Tenta novamente.</p>
                ) : null}

                <div className={styles.editorActions}>
                  <button className="ep-button secondary" type="button" onClick={cancelEditing}>
                    <X size={14} aria-hidden="true" />
                    Cancelar
                  </button>
                  <button className="ep-button primary" type="button" onClick={saveDraft}>
                    <Save size={14} aria-hidden="true" />
                    Guardar categoria
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.editorEmpty}>
                <Edit3 size={18} aria-hidden="true" />
                <p>Escolhe uma categoria para editar unidade e objetivo.</p>
              </div>
            )}
          </article>

          <article className={styles.summaryPanel}>
            <div className={styles.panelHeading}>
              <div>
                <span>Pace mensal</span>
                <h2>Resumo compacto</h2>
              </div>
              <Gauge size={18} aria-hidden="true" />
            </div>
            <ul>
              {paceSummary.map((target) => (
                <li key={target.id}>
                  <span>{target.label}</span>
                  <strong>{paceLabels[target.pace]}</strong>
                  <small>
                    {formatValue(target.currentValue, target.primaryUnit)} /{" "}
                    {formatValue(target.targetValue, target.primaryUnit)}
                  </small>
                </li>
              ))}
            </ul>
          </article>
        </aside>
      </div>

      <section className={styles.contextGrid} aria-label="Contexto usado por outras superfícies">
        <article>
          <Check size={17} aria-hidden="true" />
          <div>
            <h2>No Hoje</h2>
            <p>Aparece como resumo compacto de ritmo mensal, sem controlos de edição.</p>
          </div>
        </article>
        <article>
          <ArrowRight size={17} aria-hidden="true" />
          <div>
            <h2>No Plano semanal</h2>
            <p>Ajuda a perceber se a semana chega para manter o mês no ritmo.</p>
          </div>
        </article>
      </section>
    </section>
  );
}
