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
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { api } from "../../convex/_generated/api";
import { PersistenceUnavailable } from "@/components/persistence-unavailable";
import {
  formatAnnualCadenceLabel,
  formatDerivedMonthlyContext,
  getDerivedMonthlyTargetValue,
  getWholeMonthlyTargetValue,
} from "@/lib/monthly-target-calculation";
import { usePersistenceAuth } from "@/lib/persistence-auth";
import { hasPersistenceConfig } from "@/lib/runtime-config";

import styles from "./monthly-targets.module.css";

type CategoryId = "grind" | "study" | "review" | "sport" | "recovery" | "custom";
type PaceStatus = "missing" | "paused" | "none" | "behind" | "on" | "ahead" | "complete";
type SaveState = "idle" | "saving" | "saved" | "error";

type AnnualPlanContext = {
  primaryDirection: string;
  priorities: string[];
  nonNegotiables: string[];
  decisionRule?: string;
};

type OperatingTargetContext = {
  metricKey: string;
  label: string;
  category: "grind" | "study" | "review" | "sport" | "recovery" | "custom";
  unit: string;
  cadence: "daily" | "weekly" | "monthly" | "yearly";
  targetValue: number;
  effectiveFrom: string;
  active: boolean;
};

type MonthlyTargetRecord = {
  category: CategoryId;
  metricKey?: string;
  metricLabel?: string;
  annualCategory?: string;
  annualUnit?: string;
  annualCadence?: string;
  annualTargetValue?: number;
  primaryUnit: string;
  targetValue: number;
  currentValue?: number;
  optionalSecondaryUnit?: string;
  optionalSecondaryTargetValue?: number;
};

type TargetDraft = MonthlyTargetRecord;

type SuggestedMonthlyTarget = TargetDraft & {
  sourceLabel: string;
};

type TargetRow = {
  id: string;
  category: CategoryId;
  metricKey?: string;
  metricLabel?: string;
  annualCategory?: string;
  annualUnit?: string;
  annualCadence?: string;
  annualTargetValue?: number;
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
  onClearTarget?: (payload: { category: CategoryId; metricKey?: string }) => Promise<void>;
  onSaveTarget?: (payload: MonthlyTargetRecord) => Promise<void>;
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
    label: "Revisão",
    description: "Mãos ou tempo dedicado a revisão.",
    icon: BookCheck,
    accent: "var(--ep-cat-review)",
    defaultUnit: "mãos",
  },
  sport: {
    label: "Desporto",
    description: "Sessões ou blocos para proteger energia.",
    icon: Dumbbell,
    accent: "var(--ep-cat-sport)",
    defaultUnit: "sessões",
  },
  recovery: {
    label: "Recuperação",
    description: "Dias ou sessões para proteger descanso real.",
    icon: Gauge,
    accent: "var(--ep-accent-primary-hover)",
    defaultUnit: "dias",
  },
  custom: {
    label: "Personalizado",
    description: "Métrica anual definida por ti.",
    icon: Target,
    accent: "var(--ep-navy-700)",
    defaultUnit: "sessões",
  },
};

const categoryOrder: CategoryId[] = ["grind", "study", "review", "sport", "recovery", "custom"];

const unitOptions: Record<CategoryId, string[]> = {
  grind: ["dias", "sessões", "torneios", "horas", "minutos"],
  study: ["horas", "minutos", "sessões"],
  review: ["mãos", "horas", "minutos", "sessões"],
  sport: ["dias", "sessões", "blocos", "horas", "minutos"],
  recovery: ["dias", "sessões", "horas", "minutos"],
  custom: ["dias", "torneios", "horas", "sessões", "mãos", "minutos", "blocos", "feito"],
};

const secondaryUnitOptions: Partial<Record<CategoryId, string[]>> = {
  grind: ["torneios"],
};

const paceLabels: Record<PaceStatus, string> = {
  missing: "Sem meta mensal",
  paused: "Pausado este mês",
  none: "Sem progresso",
  behind: "Abaixo do ritmo",
  on: "Dentro do ritmo",
  ahead: "Acima do ritmo",
  complete: "Completo",
};

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
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
  if (target === 0) return "paused";
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

function getBaseMetricLabel(label: string | undefined, fallback: string) {
  const baseLabel = label
    ?.replace(/\s*(?:[-–—·]\s*)?(?:por|\/)\s*(?:dia|semana|m[eê]s|ano)\s*$/i, "")
    .trim();

  return baseLabel || fallback;
}

function getAnnualCadenceName(cadence: string) {
  if (cadence === "daily") return "dia";
  if (cadence === "weekly") return "semana";
  if (cadence === "yearly") return "ano";
  return "mês";
}

function formatAnnualReference(value: number, unit: string, cadence: string) {
  return `${value} ${unit}/${getAnnualCadenceName(cadence)}`;
}

function buildRows(targets: MonthlyTargetRecord[]): TargetRow[] {
  return [...targets]
    .sort((a, b) => {
      const categorySort = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (categorySort !== 0) return categorySort;
      return (a.metricLabel ?? "").localeCompare(b.metricLabel ?? "");
    })
    .map((target) => {
      const category = target.category;
      const config = categoryConfig[category];

      return {
        id: target.metricKey ?? category,
        category,
        metricKey: target.metricKey,
        metricLabel: target.metricLabel,
        annualCategory: target.annualCategory,
        annualUnit: target.annualUnit,
        annualCadence: target.annualCadence,
        annualTargetValue: target.annualTargetValue,
        label: getBaseMetricLabel(target.metricLabel, config.label),
        description: target.metricKey ? config.label : config.description,
        icon: config.icon,
        accent: config.accent,
        primaryUnit: target.primaryUnit,
        targetValue: target.targetValue,
        currentValue: target.currentValue ?? 0,
        secondaryUnit: target.optionalSecondaryUnit,
        secondaryTargetValue: target.optionalSecondaryTargetValue,
        currentSecondaryValue: target.optionalSecondaryUnit ? 0 : undefined,
      };
    });
}

function targetToDraft(target: TargetRow): TargetDraft {
  return {
    category: target.category,
    metricKey: target.metricKey,
    metricLabel: target.metricKey ? target.label : target.metricLabel,
    annualCategory: target.annualCategory,
    annualUnit: target.annualUnit,
    annualCadence: target.annualCadence,
    annualTargetValue: target.annualTargetValue,
    primaryUnit: target.primaryUnit,
    targetValue: target.targetValue,
    optionalSecondaryUnit: target.secondaryUnit,
    optionalSecondaryTargetValue: target.secondaryTargetValue,
  };
}

function getOperatingContextLabel(target: OperatingTargetContext, month: string) {
  return formatDerivedMonthlyContext(target, month, getTodayIsoDate());
}

function getMonthlyEquivalentValue(target: OperatingTargetContext, month: string) {
  return getDerivedMonthlyTargetValue(target, month, getTodayIsoDate());
}

function buildSuggestedMonthlyTargets(
  operatingTargets: OperatingTargetContext[],
  month: string,
): SuggestedMonthlyTarget[] {
  return operatingTargets
    .filter((target) => target.active && categoryOrder.includes(target.category))
    .map((target) => ({
      category: target.category,
      metricKey: target.metricKey,
      metricLabel: getBaseMetricLabel(target.label, categoryConfig[target.category].label),
      annualCategory: target.category,
      annualUnit: target.unit,
      annualCadence: target.cadence,
      annualTargetValue: target.targetValue,
      primaryUnit: normalizeMonthlyUnit(target.category, target.unit),
      targetValue: getMonthlyEquivalentValue(target, month),
      sourceLabel: getBaseMetricLabel(target.label, categoryConfig[target.category].label),
    }))
    .sort((a, b) => {
      const categorySort = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (categorySort !== 0) return categorySort;
      return a.sourceLabel.localeCompare(b.sourceLabel);
    });
}

function normalizeMonthlyUnit(category: CategoryId, unit: string) {
  const normalizedUnit = unit.trim();

  if (unitOptions[category].includes(normalizedUnit)) return normalizedUnit;
  if (category === "review" && normalizedUnit === "reviews") return "horas";
  if (normalizedUnit) return normalizedUnit;
  return categoryConfig[category].defaultUnit;
}

function getPrimaryUnitOptions(category: CategoryId, currentUnit: string) {
  const normalizedUnit = currentUnit.trim();
  const options = unitOptions[category];

  if (!normalizedUnit || options.includes(normalizedUnit)) return options;

  return [normalizedUnit, ...options];
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
  const auth = usePersistenceAuth();
  const canUsePersistence = auth.kind === "ready";
  const currentYear = new Date().getFullYear();
  const annualPlan = useQuery(
    api.annualPlan.getCurrent,
    canUsePersistence ? { year: currentYear } : "skip",
  );
  const operatingTargets = useQuery(
    api.annualOperatingTarget.listByYear,
    canUsePersistence ? { year: currentYear } : "skip",
  );
  const monthlyTargets = useQuery(
    api.monthlyTarget.listForMonth,
    canUsePersistence ? { month } : "skip",
  );
  const saveCategory = useMutation(api.monthlyTarget.saveCategory);
  const saveMetric = useMutation(api.monthlyTarget.saveMetric);
  const clearCategory = useMutation(api.monthlyTarget.clearCategory);
  const clearMetric = useMutation(api.monthlyTarget.clearMetric);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  if (
    auth.kind === "loading" ||
    (canUsePersistence &&
      (annualPlan === undefined || operatingTargets === undefined || monthlyTargets === undefined))
  ) {
    return (
      <section className="ep-page">
        <div className={styles.loadingState}>A carregar objetivos mensais...</div>
      </section>
    );
  }

  if (auth.kind === "signed-out") {
    return (
      <MonthlyTargetsWorkspace
        demoReason="Sessão não iniciada. Estás a ver um draft local; entra para guardar os objetivos no Convex."
        annualPlan={null}
        hasPersistence={false}
        month={month}
      />
    );
  }

  if (auth.kind === "unavailable") {
    return <PersistenceUnavailable featureName="Objetivos mensais" />;
  }

  const workspaceKey = [
    month,
    annualPlan?._id ?? "no-annual-plan",
    annualPlan?.updatedAt ?? 0,
    monthlyTargets?.map((target) => `${target.metricKey ?? target.category}:${target.updatedAt}`).join("|") ?? "empty",
    monthlyTargets?.map((target) => `${target.metricKey ?? target.category}:${target.currentValue ?? 0}`).join("|") ?? "progress-empty",
  ].join(":");

  return (
    <MonthlyTargetsWorkspace
      key={workspaceKey}
      annualPlan={annualPlan ?? null}
      hasPersistence
      initialOperatingTargets={operatingTargets ?? []}
      initialTargets={monthlyTargets ?? []}
      month={month}
      onClearTarget={async ({ category, metricKey }) => {
        setSaveState("saving");

        try {
          if (metricKey) {
            await clearMetric({ month, metricKey });
          } else {
            await clearCategory({ month, category });
          }
          setSaveState("saved");
        } catch {
          setSaveState("error");
          throw new Error("Could not clear monthly target");
        }
      }}
      onSaveTarget={async (target) => {
        setSaveState("saving");

        try {
          if (target.metricKey && target.metricLabel) {
            await saveMetric({
              month,
              category: target.category,
              metricKey: target.metricKey,
              metricLabel: target.metricLabel,
              annualCategory: target.annualCategory,
              annualUnit: target.annualUnit,
              annualCadence: target.annualCadence,
              annualTargetValue: target.annualTargetValue,
              primaryUnit: target.primaryUnit,
              targetValue: target.targetValue,
            });
          } else {
            await saveCategory({ month, ...target });
          }
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

function MonthlySetupWizard({
  annualPlan,
  initialSuggestions,
  month,
  saveState,
  onCancel,
  onSave,
}: {
  annualPlan: AnnualPlanContext | null;
  initialSuggestions: SuggestedMonthlyTarget[];
  month: string;
  saveState: SaveState;
  onCancel: () => void;
  onSave: (targets: SuggestedMonthlyTarget[]) => Promise<void>;
}) {
  const [suggestions, setSuggestions] = useState<SuggestedMonthlyTarget[]>(initialSuggestions);

  function updateSuggestion(index: number, patch: Partial<SuggestedMonthlyTarget>) {
    setSuggestions((current) =>
      current.map((target, targetIndex) =>
        targetIndex === index
          ? {
              ...target,
              ...patch,
            }
          : target,
      ),
    );
  }

  async function saveReview() {
    await onSave(suggestions);
  }

  return (
    <div className={styles.modalLayer} role="presentation">
      <button className={styles.modalScrim} type="button" aria-label="Fechar" onClick={onCancel} />
      <section
        aria-labelledby="monthly-setup-title"
        aria-modal="true"
        className={styles.modal}
        role="dialog"
      >
        <header className={styles.modalHeader}>
          <div>
            <span>Objetivos mensais</span>
            <h2 id="monthly-setup-title">Rever objetivos sugeridos</h2>
          </div>
          <button className={styles.iconOnlyButton} type="button" aria-label="Fechar" onClick={onCancel}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.modalBody}>
            <div className={styles.reviewSurface}>
              <div className={styles.wizardIntro}>
                <h3>Contexto</h3>
                <p>Usa isto como critério antes de aceitar ou ajustar as metas sugeridas.</p>
              </div>
              <section className={styles.contextReview}>
                <span>Direção anual</span>
                <strong>{annualPlan?.primaryDirection ?? "Sem direção anual definida."}</strong>
                {annualPlan?.priorities.length ? (
                  <div className={styles.priorityList}>
                    {annualPlan.priorities.map((priority) => (
                      <span key={priority}>{priority}</span>
                    ))}
                  </div>
                ) : null}
                {annualPlan?.nonNegotiables.length ? (
                  <small>Não-negociáveis: {annualPlan.nonNegotiables.join(" · ")}</small>
                ) : null}
                {annualPlan?.decisionRule ? (
                  <small>Regra: {annualPlan.decisionRule}</small>
                ) : null}
              </section>

              <div className={styles.wizardIntro}>
                <h3>Objetivos sugeridos para {formatMonthHeader(month).split(" · ")[0]}</h3>
                <p>Cada métrica anual ativa aparece separada. Usa 0 quando não a vais perseguir neste mês.</p>
              </div>
              {suggestions.length ? (
                <div className={styles.suggestionList}>
                  {suggestions.map((target, index) => (
                    <div className={styles.suggestionItem} key={target.metricKey ?? `${target.category}:${target.sourceLabel}`}>
                      <div>
                        <span>{categoryConfig[target.category].label}</span>
                        <strong>{target.sourceLabel}</strong>
                        {target.annualTargetValue && target.annualUnit && target.annualCadence ? (
                          <small>
                            Referência anual:{" "}
                            {formatAnnualReference(target.annualTargetValue, target.annualUnit, target.annualCadence)}
                          </small>
                        ) : null}
                      </div>
                      <label>
                        Unidade
                        <select
                          value={target.primaryUnit}
                          onChange={(event) => updateSuggestion(index, { primaryUnit: event.target.value })}
                        >
                          {getPrimaryUnitOptions(target.category, target.primaryUnit).map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Meta
                        <input
                          min="0"
                          type="number"
                          value={target.targetValue}
                          onChange={(event) =>
                            updateSuggestion(index, {
                              targetValue: getWholeMonthlyTargetValue(Number(event.target.value)),
                            })
                          }
                        />
                      </label>
                      {target.optionalSecondaryUnit ? (
                        <label>
                          {target.optionalSecondaryUnit}
                          <input
                            min="0"
                            type="number"
                            value={target.optionalSecondaryTargetValue ?? 0}
                            onChange={(event) =>
                              updateSuggestion(index, {
                                optionalSecondaryTargetValue: getWholeMonthlyTargetValue(Number(event.target.value)),
                              })
                            }
                          />
                        </label>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.wizardEmpty}>
                  <Gauge size={18} aria-hidden="true" />
                  <p>Não há métricas anuais ativas para sugerir este mês.</p>
                </div>
              )}

              <div className={styles.wizardIntro}>
                <h3>Revisão</h3>
                <p>Preview do que fica definido para este mês ao confirmar.</p>
              </div>
            <div className={styles.reviewGrid}>
              {suggestions.length ? (
                suggestions.map((target) => (
                  <section className={styles.reviewCard} key={target.metricKey ?? target.category}>
                    <span>{categoryConfig[target.category].label}</span>
                    <strong>{formatValue(target.targetValue, target.primaryUnit)}</strong>
                    {target.optionalSecondaryUnit && target.optionalSecondaryTargetValue ? (
                      <small>
                        + {target.optionalSecondaryTargetValue} {target.optionalSecondaryUnit}
                      </small>
                    ) : null}
                    <p>{target.sourceLabel}</p>
                    {target.annualTargetValue && target.annualUnit && target.annualCadence ? (
                      <small>
                        Referência anual:{" "}
                        {formatAnnualReference(target.annualTargetValue, target.annualUnit, target.annualCadence)}
                      </small>
                    ) : null}
                  </section>
                ))
              ) : (
                <section className={styles.reviewCard}>
                  <span>Sem sugestões</span>
                  <strong>Adiciona métricas anuais primeiro.</strong>
                </section>
              )}
            </div>
            </div>
        </div>

        {saveState === "error" ? (
          <p className={styles.modalError}>Não foi possível guardar estes objetivos. Confirma as metas.</p>
        ) : null}

        <footer className={styles.modalFooter}>
          <button className="ep-button secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="ep-button primary"
            disabled={saveState === "saving" || !suggestions.length}
            type="button"
            onClick={saveReview}
          >
            <Save size={14} aria-hidden="true" />
            {saveState === "saving" ? "A guardar..." : "Confirmar objetivos"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function MonthlyTargetsWorkspace({
  annualPlan,
  demoReason,
  hasPersistence,
  initialOperatingTargets = [],
  initialTargets = [],
  month,
  onClearTarget,
  onSaveTarget,
  saveState = "idle",
}: MonthlyTargetsWorkspaceProps) {
  const [targets, setTargets] = useState(initialTargets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAnnualDirection, setShowAnnualDirection] = useState(true);
  const [draft, setDraft] = useState<TargetDraft | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [localSaveState, setLocalSaveState] = useState<SaveState>(saveState);
  const targetRows = useMemo(() => buildRows(targets), [targets]);
  const hasTargets = targets.length > 0;
  const activeOperatingTargets = initialOperatingTargets.filter(
    (target) => target.active && categoryOrder.includes(target.category),
  );
  const hasActiveOperatingTargets = activeOperatingTargets.length > 0;
  const suggestedTargets = useMemo(
    () => buildSuggestedMonthlyTargets(activeOperatingTargets, month),
    [activeOperatingTargets, month],
  );
  const hasMonthlySuggestions = suggestedTargets.length > 0;

  const paceSummary = useMemo(
    () =>
      targetRows.map((target) => ({
        ...target,
        pace: getPaceStatus(target.currentValue, target.targetValue, month),
      })),
    [month, targetRows],
  );
  const suggestedRows = useMemo(
    () =>
      suggestedTargets.map((target) => {
        const config = categoryConfig[target.category];
        return {
          id: target.metricKey ?? target.category,
          category: target.category,
          metricKey: target.metricKey,
          metricLabel: target.metricLabel,
          annualCategory: target.annualCategory,
          annualUnit: target.annualUnit,
          annualCadence: target.annualCadence,
          annualTargetValue: target.annualTargetValue,
          label: getBaseMetricLabel(target.metricLabel, config.label),
          description: config.label,
          icon: config.icon,
          accent: config.accent,
          primaryUnit: target.primaryUnit,
          targetValue: target.targetValue,
          currentValue: 0,
          secondaryUnit: target.optionalSecondaryUnit,
          secondaryTargetValue: target.optionalSecondaryTargetValue,
          currentSecondaryValue: target.optionalSecondaryUnit ? 0 : undefined,
          pace: "none" as const,
        };
      }),
    [suggestedTargets],
  );
  const visibleTargetRows = hasTargets ? paceSummary : suggestedRows;
  const summaryRows = hasTargets
    ? paceSummary.map((target) => ({
        ...target,
        paceLabel: paceLabels[target.pace],
      }))
    : suggestedRows.map((target) => ({
        ...target,
        paceLabel: "Sugerido",
      }));

  const editingTarget = targetRows.find((target) => target.id === editingId) ?? null;
  const referenceOperatingTargets = activeOperatingTargets.filter(
    (target) => (draft?.metricKey ? target.metricKey === draft.metricKey : target.category === draft?.category),
  );

  const startEditing = (target: TargetRow) => {
    setEditingId(target.id);
    setDraft(targetToDraft(target));
    setLocalSaveState("idle");
  };

  const startMonthlyWizard = () => {
    setWizardOpen(true);
    setLocalSaveState("idle");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraft(null);
    setLocalSaveState(saveState);
  };

  const saveDraft = async () => {
    if (!draft || draft.targetValue < 0) {
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
        await onSaveTarget?.(payload);
      }

      setTargets((current) => {
        const existing = current.some((target) =>
          payload.metricKey ? target.metricKey === payload.metricKey : !target.metricKey && target.category === payload.category,
        );

        if (!existing) return [...current, payload];

        return current.map((target) =>
          payload.metricKey
            ? target.metricKey === payload.metricKey
              ? payload
              : target
            : !target.metricKey && target.category === payload.category
              ? payload
              : target,
        );
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
        await onClearTarget?.({ category: draft.category, metricKey: draft.metricKey });
      }

      setTargets((current) =>
        current.filter((target) =>
          draft.metricKey ? target.metricKey !== draft.metricKey : target.metricKey || target.category !== draft.category,
        ),
      );
      setEditingId(null);
      setDraft(null);
      setLocalSaveState("saved");
    } catch {
      setLocalSaveState("error");
    }
  };

  const saveWizardTargets = async (nextTargets: SuggestedMonthlyTarget[]) => {
    const payloads = nextTargets.map((target) => ({
        category: target.category,
        metricKey: target.metricKey,
        metricLabel: target.metricLabel,
        annualCategory: target.annualCategory,
        annualUnit: target.annualUnit,
        annualCadence: target.annualCadence,
        annualTargetValue: target.annualTargetValue,
        primaryUnit: target.primaryUnit,
        targetValue: getWholeMonthlyTargetValue(target.targetValue),
      }));

    if (!payloads.length) {
      setLocalSaveState("error");
      return;
    }

    setLocalSaveState("saving");

    try {
      if (hasPersistence) {
        for (const payload of payloads) {
          await onSaveTarget?.(payload);
        }
      }

      setTargets((current) => {
        const next = [...current];

        for (const payload of payloads) {
          const index = next.findIndex((target) =>
            payload.metricKey ? target.metricKey === payload.metricKey : !target.metricKey && target.category === payload.category,
          );
          if (index >= 0) {
            next[index] = payload;
          } else {
            next.push(payload);
          }
        }

        return next;
      });
      setWizardOpen(false);
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
          {hasTargets ? (
            <button
              className="ep-button primary"
              type="button"
              onClick={() => startEditing(targetRows[0])}
            >
              Editar objetivos
            </button>
          ) : !hasMonthlySuggestions ? (
            <a className="ep-button primary" href="/annual">
              Definir Direção anual
            </a>
          ) : null}
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
                <p>Define primeiro a Direção anual e os ritmos operacionais para este mês nascer de dados reais.</p>
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
            <h2>
              {hasActiveOperatingTargets
                ? hasMonthlySuggestions
                  ? "Revê os objetivos sugeridos para este mês."
                  : "As métricas anuais guardadas não criam objetivos mensais."
                : "Ainda não há métricas anuais para orientar este mês."}
            </h2>
            <p>
              {hasActiveOperatingTargets
                ? hasMonthlySuggestions
                  ? "Gerámos uma proposta apenas a partir dos ritmos anuais guardados. Ajusta antes de confirmar."
                  : "Confirma que há métricas anuais ativas para gerar este mês."
                : "Define primeiro os ritmos operacionais na Direção anual para evitar objetivos mensais inventados."}
            </p>
          </div>
          {hasMonthlySuggestions ? (
            <button
              className="ep-button primary"
              type="button"
              onClick={startMonthlyWizard}
            >
              Rever objetivos sugeridos
            </button>
          ) : (
            <a className="ep-button primary" href="/annual">
              Definir Direção anual
            </a>
          )}
        </article>
      ) : null}

      {hasTargets || hasMonthlySuggestions ? (
        <>
        <article className={styles.summaryPanel}>
          <div className={styles.panelHeading}>
            <div>
              <span>Pace mensal</span>
              <h2>Resumo compacto</h2>
            </div>
            <Gauge size={18} aria-hidden="true" />
          </div>
          <ul>
            {summaryRows.map((target) => (
              <li key={target.id}>
                <span>{target.label}</span>
                <strong>{target.paceLabel}</strong>
                <small>
                  {formatValue(target.currentValue, target.primaryUnit)} /{" "}
                  {formatValue(target.targetValue, target.primaryUnit)}
                </small>
              </li>
            ))}
          </ul>
        </article>

        <div className={styles.monthlyLayout}>
        <article className={styles.targetTable} aria-label="Objetivos mensais por categoria">
          <header className={styles.tableHeader}>
            <span>Métrica</span>
            <span>Progresso atual</span>
            <span>Objetivo</span>
            <span>Ritmo</span>
            <span aria-label="Ações" />
          </header>

          {visibleTargetRows.map((target) => {
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
                  {formatValue(target.targetValue, target.primaryUnit)}
                  {target.annualCadence && target.annualUnit && target.annualTargetValue ? (
                    <small>
                      Meta mensal derivada de{" "}
                      {formatAnnualReference(target.annualTargetValue, target.annualUnit, target.annualCadence)}
                    </small>
                  ) : null}
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

                <button
                  aria-label={`Editar métrica ${target.label}`}
                  className={`${styles.iconButton} ${styles.iconOnlyButton}`}
                  title="Editar"
                  type="button"
                  onClick={() => startEditing(target)}
                >
                  <Edit3 size={15} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </article>

        <aside className={styles.sideStack}>
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
                  <li key={`${target.metricKey}:${target.effectiveFrom}`}>
                    <strong>{getBaseMetricLabel(target.label, categoryConfig[target.category].label)}</strong>
                    <small>{getOperatingContextLabel(target, month)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Sem ritmo operacional anual ativo para sugerir este mês.</p>
            )}
          </article>
        </aside>
        </div>
        </>
      ) : null}

      {draft ? (
        <div className={styles.modalLayer} role="presentation">
          <button className={styles.modalScrim} type="button" aria-label="Fechar" onClick={cancelEditing} />
          <section
            aria-labelledby="monthly-metric-editor-title"
            aria-modal="true"
            className={`${styles.modal} ${styles.metricModal}`}
            role="dialog"
          >
            <header className={styles.modalHeader}>
              <div>
                <span>Métrica mensal</span>
                <h2 id="monthly-metric-editor-title">{editingTarget ? editingTarget.label : "Métrica"}</h2>
              </div>
              <button className={styles.iconOnlyButton} type="button" aria-label="Fechar" onClick={cancelEditing}>
                <X size={16} aria-hidden="true" />
              </button>
            </header>
            <div className={styles.modalBody}>
              <div className={styles.editorForm}>
                {referenceOperatingTargets.length ? (
                  <div className={styles.referenceBox}>
                    <strong>Ritmo anual como referência</strong>
                    {referenceOperatingTargets.map((target) => (
                      <p key={`${target.metricKey}:${target.effectiveFrom}`}>
                        {getBaseMetricLabel(target.label, categoryConfig[target.category].label)}:{" "}
                        {formatAnnualCadenceLabel(target)}
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
                    {getPrimaryUnitOptions(draft.category, draft.primaryUnit).map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Objetivo mensal
                  <input
                    min="0"
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
              </div>
            </div>
            <footer className={styles.modalFooter}>
              <button className="ep-button secondary" type="button" onClick={cancelEditing}>
                <X size={14} aria-hidden="true" />
                Cancelar
              </button>
              <button className="ep-button secondary" type="button" onClick={clearDraftCategory}>
                <Trash2 size={14} aria-hidden="true" />
                Limpar métrica
              </button>
              <button
                className="ep-button primary"
                disabled={localSaveState === "saving"}
                type="button"
                onClick={saveDraft}
              >
                <Save size={14} aria-hidden="true" />
                {localSaveState === "saving" ? "A guardar..." : "Guardar métrica"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

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

      {wizardOpen ? (
        <MonthlySetupWizard
          annualPlan={annualPlan}
          initialSuggestions={suggestedTargets}
          month={month}
          saveState={localSaveState}
          onCancel={() => {
            setWizardOpen(false);
          }}
          onSave={saveWizardTargets}
        />
      ) : null}
    </section>
  );
}
