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
  Trash2,
  X,
} from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { api } from "../../convex/_generated/api";
import { hasPersistenceConfig } from "@/lib/runtime-config";

import styles from "./monthly-targets.module.css";

type CategoryId = "grind" | "study" | "review" | "sport";
type PaceStatus = "missing" | "none" | "behind" | "on" | "ahead" | "complete";
type SaveState = "idle" | "saving" | "saved" | "error";

type AnnualPlanContext = {
  primaryDirection: string;
  priorities: string[];
  nonNegotiables: string[];
};

type OperatingTargetContext = {
  label: string;
  category: "grind" | "study" | "review" | "sport" | "recovery" | "custom";
  unit: string;
  cadence: "weekly" | "monthly";
  targetValue: number;
  effectiveFrom: string;
  active: boolean;
};

type MonthlyTargetRecord = {
  category: CategoryId;
  primaryUnit: string;
  targetValue: number;
  currentValue?: number;
  optionalSecondaryUnit?: string;
  optionalSecondaryTargetValue?: number;
};

type TargetDraft = MonthlyTargetRecord;

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

type MonthlyTargetsWorkspaceProps = {
  annualPlan: AnnualPlanContext | null;
  demoReason?: string;
  hasPersistence: boolean;
  initialOperatingTargets?: OperatingTargetContext[];
  initialTargets?: MonthlyTargetRecord[];
  month: string;
  onClearCategory?: (payload: { category: CategoryId }) => Promise<void>;
  onSaveCategory?: (payload: MonthlyTargetRecord) => Promise<void>;
  saveState?: SaveState;
};

const categoryConfig: Record<
  CategoryId,
  {
    label: string;
    description: string;
    icon: typeof Spade;
    accent: string;
    defaultUnit: string;
  }
> = {
  grind: {
    label: "Grind",
    description: "Sessões MTT planeadas para o mês.",
    icon: Spade,
    accent: "var(--ep-cat-grind)",
    defaultUnit: "sessões",
  },
  study: {
    label: "Estudo",
    description: "Tempo de estudo que deve sustentar a grind.",
    icon: GraduationCap,
    accent: "var(--ep-cat-study)",
    defaultUnit: "horas",
  },
  review: {
    label: "Review",
    description: "Mãos ou tempo dedicado a revisão.",
    icon: BookCheck,
    accent: "var(--ep-cat-review)",
    defaultUnit: "mãos",
  },
  sport: {
    label: "Sport",
    description: "Sessões ou blocos para proteger energia.",
    icon: Dumbbell,
    accent: "var(--ep-cat-sport)",
    defaultUnit: "sessões",
  },
};

const categoryOrder: CategoryId[] = ["grind", "study", "review", "sport"];

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

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getDaysInMonth(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  return new Date(year, monthIndex, 0).getDate();
}

function getMonthDay(month: string) {
  const currentMonth = getCurrentMonth();

  if (month !== currentMonth) return 1;

  return new Date().getDate();
}

function formatMonthHeader(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1, 1);
  const monthName = new Intl.DateTimeFormat("pt-PT", { month: "long" }).format(date);
  const label = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)}`;

  return `${label} · dia ${getMonthDay(month)} de ${getDaysInMonth(month)}`;
}

function getPaceStatus(current: number, target: number, month: string): PaceStatus {
  if (!target) return "missing";
  if (current <= 0) return "none";
  if (current >= target) return "complete";

  const expectedProgress = getMonthDay(month) / getDaysInMonth(month);
  const progress = current / target;

  if (progress < expectedProgress - 0.08) return "behind";
  if (progress > expectedProgress + 0.12) return "ahead";
  return "on";
}

function formatValue(value: number, unit: string) {
  if (!value) return `0 ${unit}`;
  if (unit === "horas") return `${value}h`;
  if (unit === "minutos") return `${value}m`;
  return `${value} ${unit}`;
}

function buildRows(targets: MonthlyTargetRecord[]): TargetRow[] {
  return categoryOrder.map((category) => {
    const config = categoryConfig[category];
    const target = targets.find((item) => item.category === category);

    return {
      id: category,
      label: config.label,
      description: config.description,
      icon: config.icon,
      accent: config.accent,
      primaryUnit: target?.primaryUnit ?? config.defaultUnit,
      targetValue: target?.targetValue ?? 0,
      currentValue: target?.currentValue ?? 0,
      secondaryUnit: target?.optionalSecondaryUnit,
      secondaryTargetValue: target?.optionalSecondaryTargetValue,
      currentSecondaryValue: target?.optionalSecondaryUnit ? 0 : undefined,
    };
  });
}

function targetToDraft(target: TargetRow): TargetDraft {
  return {
    category: target.id,
    primaryUnit: target.primaryUnit,
    targetValue: target.targetValue || 1,
    optionalSecondaryUnit: target.secondaryUnit,
    optionalSecondaryTargetValue: target.secondaryTargetValue,
  };
}

function getOperatingContextLabel(target: OperatingTargetContext, daysInMonth: number) {
  if (target.cadence === "monthly") {
    return `${target.targetValue} ${target.unit}/mês`;
  }

  const monthlyEquivalent = Math.round(((target.targetValue * daysInMonth) / 7) * 10) / 10;
  return `${target.targetValue} ${target.unit}/semana · ≈ ${monthlyEquivalent} ${target.unit}/mês`;
}

export function MonthlyTargets() {
  const month = getCurrentMonth();

  if (!hasPersistenceConfig) {
    return (
      <MonthlyTargetsWorkspace
        demoReason="Clerk ou Convex ainda não estão configurados. Os objetivos ficam apenas neste draft local."
        annualPlan={null}
        hasPersistence={false}
        month={month}
      />
    );
  }

  return <PersistedMonthlyTargets month={month} />;
}

function PersistedMonthlyTargets({ month }: { month: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentYear = new Date().getFullYear();
  const annualPlan = useQuery(
    api.annualPlan.getCurrent,
    isAuthenticated ? { year: currentYear } : "skip",
  );
  const operatingTargets = useQuery(
    api.annualOperatingTarget.listByYear,
    isAuthenticated ? { year: currentYear } : "skip",
  );
  const monthlyTargets = useQuery(
    api.monthlyTarget.listForMonth,
    isAuthenticated ? { month } : "skip",
  );
  const saveCategory = useMutation(api.monthlyTarget.saveCategory);
  const clearCategory = useMutation(api.monthlyTarget.clearCategory);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  if (
    isLoading ||
    (isAuthenticated &&
      (annualPlan === undefined || operatingTargets === undefined || monthlyTargets === undefined))
  ) {
    return (
      <section className="ep-page">
        <div className={styles.loadingState}>A carregar objetivos mensais...</div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <MonthlyTargetsWorkspace
        demoReason="Sessão não iniciada. Estás a ver um draft local; entra para guardar os objetivos no Convex."
        annualPlan={null}
        hasPersistence={false}
        month={month}
      />
    );
  }

  const workspaceKey = [
    month,
    annualPlan?._id ?? "no-annual-plan",
    annualPlan?.updatedAt ?? 0,
    monthlyTargets?.map((target) => `${target.category}:${target.updatedAt}`).join("|") ?? "empty",
    monthlyTargets?.map((target) => `${target.category}:${target.currentValue ?? 0}`).join("|") ?? "progress-empty",
  ].join(":");

  return (
    <MonthlyTargetsWorkspace
      key={workspaceKey}
      annualPlan={annualPlan ?? null}
      hasPersistence
      initialOperatingTargets={operatingTargets ?? []}
      initialTargets={monthlyTargets ?? []}
      month={month}
      onClearCategory={async ({ category }) => {
        setSaveState("saving");

        try {
          await clearCategory({ month, category });
          setSaveState("saved");
        } catch {
          setSaveState("error");
          throw new Error("Could not clear monthly target");
        }
      }}
      onSaveCategory={async (target) => {
        setSaveState("saving");

        try {
          await saveCategory({ month, ...target });
          setSaveState("saved");
        } catch {
          setSaveState("error");
          throw new Error("Could not save monthly target");
        }
      }}
      saveState={saveState}
    />
  );
}

function MonthlyTargetsWorkspace({
  annualPlan,
  demoReason,
  hasPersistence,
  initialOperatingTargets = [],
  initialTargets = [],
  month,
  onClearCategory,
  onSaveCategory,
  saveState = "idle",
}: MonthlyTargetsWorkspaceProps) {
  const [targets, setTargets] = useState(initialTargets);
  const [editingId, setEditingId] = useState<CategoryId | null>(null);
  const [showAnnualDirection, setShowAnnualDirection] = useState(true);
  const [draft, setDraft] = useState<TargetDraft | null>(null);
  const [localSaveState, setLocalSaveState] = useState<SaveState>(saveState);
  const targetRows = useMemo(() => buildRows(targets), [targets]);
  const hasTargets = targets.length > 0;
  const activeOperatingTargets = initialOperatingTargets.filter(
    (target) => target.active && categoryOrder.includes(target.category as CategoryId),
  );

  const paceSummary = useMemo(
    () =>
      targetRows.map((target) => ({
        ...target,
        pace: getPaceStatus(target.currentValue, target.targetValue, month),
      })),
    [month, targetRows],
  );

  const editingTarget = targetRows.find((target) => target.id === editingId) ?? null;
  const categoryOperatingTargets = activeOperatingTargets.filter(
    (target) => target.category === draft?.category,
  );

  const startEditing = (target: TargetRow) => {
    setEditingId(target.id);
    setDraft(targetToDraft(target));
    setLocalSaveState("idle");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(null);
    setLocalSaveState(saveState);
  };

  const saveDraft = async () => {
    if (!draft || draft.targetValue <= 0) {
      setLocalSaveState("error");
      return;
    }

    if (draft.optionalSecondaryUnit && (!draft.optionalSecondaryTargetValue || draft.optionalSecondaryTargetValue <= 0)) {
      setLocalSaveState("error");
      return;
    }

    const payload = {
      ...draft,
      optionalSecondaryUnit: draft.category === "grind" ? draft.optionalSecondaryUnit : undefined,
      optionalSecondaryTargetValue:
        draft.category === "grind" && draft.optionalSecondaryUnit
          ? draft.optionalSecondaryTargetValue
          : undefined,
    };

    setLocalSaveState("saving");

    try {
      if (hasPersistence) {
        await onSaveCategory?.(payload);
      }

      setTargets((current) => {
        const existing = current.some((target) => target.category === payload.category);

        if (!existing) return [...current, payload];

        return current.map((target) => (target.category === payload.category ? payload : target));
      });
      setEditingId(null);
      setDraft(null);
      setLocalSaveState("saved");
    } catch {
      setLocalSaveState("error");
    }
  };

  const clearDraftCategory = async () => {
    if (!draft) return;

    setLocalSaveState("saving");

    try {
      if (hasPersistence) {
        await onClearCategory?.({ category: draft.category });
      }

      setTargets((current) => current.filter((target) => target.category !== draft.category));
      setEditingId(null);
      setDraft(null);
      setLocalSaveState("saved");
    } catch {
      setLocalSaveState("error");
    }
  };

  return (
    <section className="ep-page">
      {demoReason ? <div className={styles.demoBanner}>{demoReason}</div> : null}

      <div className="ep-page-header">
        <div>
          <span>{formatMonthHeader(month)}</span>
          <h1>Objetivos mensais</h1>
          <p>Define o ritmo do mês para orientar a semana e o dia.</p>
        </div>
        <div className="ep-page-actions">
          <button
            className="ep-button primary"
            type="button"
            onClick={() => startEditing(targetRows[0])}
          >
            {hasTargets ? "Editar objetivos" : "Definir objetivos"}
          </button>
        </div>
      </div>

      <article className={annualPlan ? styles.annualStrip : styles.annualStripMissing}>
        <div className={styles.annualHeader}>
          <div>
            <span>Direção anual</span>
            <h2>{annualPlan ? "Este mês deve aproximar-te disto:" : "Sem direção anual"}</h2>
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
          annualPlan ? (
            <>
              <p>{annualPlan.primaryDirection}</p>
              {annualPlan.priorities.length ? (
                <div className={styles.priorityList} aria-label="Prioridades do ano">
                  {annualPlan.priorities.map((priority) => (
                    <span key={priority}>{priority}</span>
                  ))}
                </div>
              ) : null}
              {annualPlan.nonNegotiables.length ? (
                <small>{annualPlan.nonNegotiables.join(" · ")}</small>
              ) : null}
            </>
          ) : (
            <div className={styles.missingDirection}>
              <AlertTriangle size={18} aria-hidden="true" />
              <div>
                <strong>Ainda não definiste a direção anual.</strong>
                <p>Podes definir objetivos mensais agora, mas o plano terá menos contexto estratégico.</p>
              </div>
              <a className="ep-button secondary" href="/annual">
                Definir direção anual
              </a>
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
          <button className="ep-button primary" type="button" onClick={() => startEditing(targetRows[0])}>
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
            const progress = target.targetValue
              ? Math.min(100, Math.round((target.currentValue / target.targetValue) * 100))
              : 0;

            return (
              <div className={styles.targetRow} key={target.id} style={{ "--accent": target.accent } as CSSProperties}>
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
                  {target.secondaryUnit && target.secondaryTargetValue ? (
                    <small>
                      {target.currentSecondaryValue ?? 0}/{target.secondaryTargetValue} {target.secondaryUnit}
                    </small>
                  ) : null}
                </div>

                <div className={styles.valueCell}>
                  {target.targetValue ? formatValue(target.targetValue, target.primaryUnit) : "Por definir"}
                  {target.secondaryUnit && target.secondaryTargetValue ? (
                    <small>
                      + {target.secondaryTargetValue} {target.secondaryUnit}
                    </small>
                  ) : null}
                </div>

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
                {categoryOperatingTargets.length ? (
                  <div className={styles.referenceBox}>
                    <strong>Ritmo anual como referência</strong>
                    {categoryOperatingTargets.map((target) => (
                      <p key={`${target.label}:${target.effectiveFrom}`}>
                        {target.label}: {getOperatingContextLabel(target, getDaysInMonth(month))}
                      </p>
                    ))}
                  </div>
                ) : null}

                <label>
                  Unidade principal
                  <select
                    value={draft.primaryUnit}
                    onChange={(event) => setDraft({ ...draft, primaryUnit: event.target.value })}
                  >
                    {unitOptions[draft.category].map((unit) => (
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

                {secondaryUnitOptions[draft.category] ? (
                  <div className={styles.secondaryFields}>
                    <label>
                      Unidade secundária
                      <select
                        value={draft.optionalSecondaryUnit ?? ""}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            optionalSecondaryUnit: event.target.value || undefined,
                            optionalSecondaryTargetValue: event.target.value
                              ? draft.optionalSecondaryTargetValue
                              : undefined,
                          })
                        }
                      >
                        <option value="">Sem unidade secundária</option>
                        {secondaryUnitOptions[draft.category]?.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Objetivo secundário
                      <input
                        disabled={!draft.optionalSecondaryUnit}
                        min="1"
                        type="number"
                        value={draft.optionalSecondaryTargetValue ?? ""}
                        onChange={(event) =>
                          setDraft({ ...draft, optionalSecondaryTargetValue: Number(event.target.value) })
                        }
                      />
                    </label>
                  </div>
                ) : null}

                {localSaveState === "error" ? (
                  <p className={styles.errorText}>Não foi possível guardar os objetivos. Confirma os valores e tenta novamente.</p>
                ) : null}

                <div className={styles.editorActions}>
                  <button className="ep-button secondary" type="button" onClick={cancelEditing}>
                    <X size={14} aria-hidden="true" />
                    Cancelar
                  </button>
                  <button className="ep-button secondary" type="button" onClick={clearDraftCategory}>
                    <Trash2 size={14} aria-hidden="true" />
                    Limpar categoria
                  </button>
                  <button
                    className="ep-button primary"
                    disabled={localSaveState === "saving"}
                    type="button"
                    onClick={saveDraft}
                  >
                    <Save size={14} aria-hidden="true" />
                    {localSaveState === "saving" ? "A guardar..." : "Guardar categoria"}
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
                    {target.targetValue ? formatValue(target.targetValue, target.primaryUnit) : "por definir"}
                  </small>
                </li>
              ))}
            </ul>
          </article>

          <article className={styles.operatingPanel}>
            <div className={styles.panelHeading}>
              <div>
                <span>Ritmo anual</span>
                <h2>Referência, não aplicação automática</h2>
              </div>
            </div>
            {activeOperatingTargets.length ? (
              <ul>
                {activeOperatingTargets.map((target) => (
                  <li key={`${target.label}:${target.effectiveFrom}`}>
                    <strong>{target.label}</strong>
                    <small>{getOperatingContextLabel(target, getDaysInMonth(month))}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sem ritmo operacional anual ativo para sugerir este mês.</p>
            )}
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
