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
import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { api } from "../../convex/_generated/api";
import { PersistenceUnavailable } from "@/components/persistence-unavailable";
import { usePersistenceAuth } from "@/lib/persistence-auth";
import { hasPersistenceConfig } from "@/lib/runtime-config";

import styles from "./monthly-targets.module.css";

type CategoryId = "grind" | "study" | "review" | "sport";
type PaceStatus = "missing" | "none" | "behind" | "on" | "ahead" | "complete";
type SaveState = "idle" | "saving" | "saved" | "error";

type AnnualPlanContext = {
  primaryDirection: string;
  priorities: string[];
  nonNegotiables: string[];
  decisionRule?: string;
};

type OperatingTargetContext = {
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
};

const categoryOrder: CategoryId[] = ["grind", "study", "review", "sport"];

const unitOptions: Record<CategoryId, string[]> = {
  grind: ["sessões"],
  study: ["horas", "minutos", "sessões"],
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

function getRemainingMonthRatio(month: string) {
  const daysInMonth = getDaysInMonth(month);
  const day = getMonthDay(month);

  if (month !== getCurrentMonth() || day <= 1) return 1;

  return Math.max(1 / daysInMonth, (daysInMonth - day + 1) / daysInMonth);
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

function getWholeTargetValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 1;

  return Math.max(1, Math.ceil(value));
}

function buildRows(targets: MonthlyTargetRecord[]): TargetRow[] {
  return [...targets]
    .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))
    .map((target) => {
      const category = target.category;
      const config = categoryConfig[category];

      return {
        id: category,
        label: config.label,
        description: config.description,
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
    category: target.id,
    primaryUnit: target.primaryUnit,
    targetValue: target.targetValue || 1,
    optionalSecondaryUnit: target.secondaryUnit,
    optionalSecondaryTargetValue: target.secondaryTargetValue,
  };
}

function getOperatingContextLabel(target: OperatingTargetContext, daysInMonth: number) {
  if (target.cadence === "daily") {
    const monthlyEquivalent = Math.round(target.targetValue * daysInMonth * 10) / 10;
    return `${target.targetValue} ${target.unit}/dia · ≈ ${monthlyEquivalent} ${target.unit}/mês`;
  }

  if (target.cadence === "monthly") {
    return `${target.targetValue} ${target.unit}/mês`;
  }

  if (target.cadence === "yearly") {
    const monthlyEquivalent = Math.round((target.targetValue / 12) * 10) / 10;
    return `${target.targetValue} ${target.unit}/ano · ≈ ${monthlyEquivalent} ${target.unit}/mês`;
  }

  const monthlyEquivalent = Math.round(((target.targetValue * daysInMonth) / 7) * 10) / 10;
  return `${target.targetValue} ${target.unit}/semana · ≈ ${monthlyEquivalent} ${target.unit}/mês`;
}

function getMonthlyEquivalentValue(target: OperatingTargetContext, month: string) {
  const daysInMonth = getDaysInMonth(month);
  const remainingRatio = getRemainingMonthRatio(month);
  const monthlyValue = (() => {
    if (target.cadence === "daily") return target.targetValue * daysInMonth * remainingRatio;
    if (target.cadence === "weekly") return (target.targetValue * daysInMonth * remainingRatio) / 7;
    if (target.cadence === "yearly") return (target.targetValue / 12) * remainingRatio;
    return target.targetValue * remainingRatio;
  })();

  return getWholeTargetValue(monthlyValue);
}

function buildSuggestedMonthlyTargets(
  operatingTargets: OperatingTargetContext[],
  month: string,
): SuggestedMonthlyTarget[] {
  const suggestions = new Map<CategoryId, SuggestedMonthlyTarget>();

  for (const target of operatingTargets) {
    if (!target.active) continue;

    const monthlyValue = getMonthlyEquivalentValue(target, month);
    const category = target.category as CategoryId;

    if (!categoryOrder.includes(category)) continue;

    if (category === "grind" && target.unit === "torneios") {
      const existing = suggestions.get("grind") ?? {
        category: "grind" as const,
        primaryUnit: "sessões",
        targetValue: 1,
        sourceLabel: target.label,
      };

      suggestions.set("grind", {
        ...existing,
        optionalSecondaryUnit: "torneios",
        optionalSecondaryTargetValue: monthlyValue,
        sourceLabel: existing.sourceLabel.includes(target.label)
          ? existing.sourceLabel
          : `${existing.sourceLabel} + ${target.label}`,
      });
      continue;
    }

    const unit = normalizeMonthlyUnit(category, target.unit);
    if (!unit) continue;

    suggestions.set(category, {
      category,
      primaryUnit: unit,
      targetValue: monthlyValue,
      sourceLabel: target.label,
      optionalSecondaryUnit: suggestions.get(category)?.optionalSecondaryUnit,
      optionalSecondaryTargetValue: suggestions.get(category)?.optionalSecondaryTargetValue,
    });
  }

  return categoryOrder.flatMap((category) => {
    const suggestion = suggestions.get(category);
    return suggestion ? [suggestion] : [];
  });
}

function normalizeMonthlyUnit(category: CategoryId, unit: string) {
  if (category === "grind" && (unit === "dias" || unit === "sessões")) return "sessões";
  if (unitOptions[category].includes(unit)) return unit;
  if (category === "study" && unit === "horas") return "horas";
  if (category === "review" && unit === "reviews") return "horas";
  if (category === "sport" && unit === "dias") return "sessões";

  return null;
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
  const clearCategory = useMutation(api.monthlyTarget.clearCategory);
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

function MonthlySetupWizard({
  annualPlan,
  initialSuggestions,
  month,
  saveState,
  step,
  onCancel,
  onSave,
  onStepChange,
}: {
  annualPlan: AnnualPlanContext | null;
  initialSuggestions: SuggestedMonthlyTarget[];
  month: string;
  saveState: SaveState;
  step: number;
  onCancel: () => void;
  onSave: (targets: SuggestedMonthlyTarget[]) => Promise<void>;
  onStepChange: Dispatch<SetStateAction<number>>;
}) {
  const [suggestions, setSuggestions] = useState<SuggestedMonthlyTarget[]>(initialSuggestions);
  const steps = ["Contexto", "Objetivos", "Revisão"];

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

  async function continueOrSave() {
    if (step < steps.length - 1) {
      onStepChange((current) => Math.min(current + 1, steps.length - 1));
      return;
    }

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
            <span>Objetivos mensais · passo {step + 1} de {steps.length}</span>
            <h2 id="monthly-setup-title">{steps[step]}</h2>
          </div>
          <button className={styles.iconOnlyButton} type="button" aria-label="Fechar" onClick={onCancel}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.stepper} aria-label="Progresso">
          {steps.map((label, index) => (
            <button
              className={index === step ? styles.activeStep : undefined}
              key={label}
              type="button"
              onClick={() => onStepChange(index)}
            >
              <span>{index + 1}</span>
              {label}
            </button>
          ))}
        </div>

        <div className={styles.modalBody}>
          {step === 0 ? (
            <div className={styles.wizardStack}>
              <div className={styles.wizardIntro}>
                <h3>Este mês deve servir a direção anual.</h3>
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
            </div>
          ) : null}

          {step === 1 ? (
            <div className={styles.wizardStack}>
              <div className={styles.wizardIntro}>
                <h3>Objetivos sugeridos para {formatMonthHeader(month).split(" · ")[0]}</h3>
                <p>Valores inteiros, derivados dos ritmos anuais ativos. Ajusta antes de confirmar.</p>
              </div>
              {suggestions.length ? (
                <div className={styles.suggestionList}>
                  {suggestions.map((target, index) => (
                    <div className={styles.suggestionItem} key={`${target.category}:${target.sourceLabel}`}>
                      <div>
                        <span>{categoryConfig[target.category].label}</span>
                        <strong>{target.sourceLabel}</strong>
                      </div>
                      <label>
                        Unidade
                        <select
                          value={target.primaryUnit}
                          onChange={(event) => updateSuggestion(index, { primaryUnit: event.target.value })}
                        >
                          {unitOptions[target.category].map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Meta
                        <input
                          min="1"
                          type="number"
                          value={target.targetValue}
                          onChange={(event) =>
                            updateSuggestion(index, {
                              targetValue: getWholeTargetValue(Number(event.target.value)),
                            })
                          }
                        />
                      </label>
                      {target.optionalSecondaryUnit ? (
                        <label>
                          {target.optionalSecondaryUnit}
                          <input
                            min="1"
                            type="number"
                            value={target.optionalSecondaryTargetValue ?? 1}
                            onChange={(event) =>
                              updateSuggestion(index, {
                                optionalSecondaryTargetValue: getWholeTargetValue(Number(event.target.value)),
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
                  <p>Não há métricas anuais ativas que mapeiem diretamente para Grind, Estudo, Revisão ou Desporto.</p>
                </div>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className={styles.reviewGrid}>
              {suggestions.length ? (
                suggestions.map((target) => (
                  <section className={styles.reviewCard} key={target.category}>
                    <span>{categoryConfig[target.category].label}</span>
                    <strong>{formatValue(target.targetValue, target.primaryUnit)}</strong>
                    {target.optionalSecondaryUnit && target.optionalSecondaryTargetValue ? (
                      <small>
                        + {target.optionalSecondaryTargetValue} {target.optionalSecondaryUnit}
                      </small>
                    ) : null}
                    <p>{target.sourceLabel}</p>
                  </section>
                ))
              ) : (
                <section className={styles.reviewCard}>
                  <span>Sem sugestões</span>
                  <strong>Adiciona métricas anuais primeiro.</strong>
                </section>
              )}
            </div>
          ) : null}
        </div>

        {saveState === "error" ? (
          <p className={styles.modalError}>Não foi possível guardar estes objetivos. Confirma as metas.</p>
        ) : null}

        <footer className={styles.modalFooter}>
          <button className="ep-button secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
          {step > 0 ? (
            <button className="ep-button secondary" type="button" onClick={() => onStepChange((current) => current - 1)}>
              Voltar
            </button>
          ) : null}
          <button
            className="ep-button primary"
            disabled={saveState === "saving" || (step === steps.length - 1 && !suggestions.length)}
            type="button"
            onClick={continueOrSave}
          >
            {step === steps.length - 1 ? (
              <>
                <Save size={14} aria-hidden="true" />
                {saveState === "saving" ? "A guardar..." : "Confirmar objetivos"}
              </>
            ) : (
              <>
                Continuar
                <ArrowRight size={14} aria-hidden="true" />
              </>
            )}
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
  onClearCategory,
  onSaveCategory,
  saveState = "idle",
}: MonthlyTargetsWorkspaceProps) {
  const [targets, setTargets] = useState(initialTargets);
  const [editingId, setEditingId] = useState<CategoryId | null>(null);
  const [showAnnualDirection, setShowAnnualDirection] = useState(true);
  const [draft, setDraft] = useState<TargetDraft | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [localSaveState, setLocalSaveState] = useState<SaveState>(saveState);
  const targetRows = useMemo(() => buildRows(targets), [targets]);
  const hasTargets = targets.length > 0;
  const activeOperatingTargets = initialOperatingTargets.filter(
    (target) => target.active && categoryOrder.includes(target.category as CategoryId),
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
          id: target.category,
          label: config.label,
          description: target.sourceLabel,
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
  const categoryOperatingTargets = activeOperatingTargets.filter(
    (target) => target.category === draft?.category,
  );

  const startEditing = (target: TargetRow) => {
    setEditingId(target.id);
    setDraft(targetToDraft(target));
    setLocalSaveState("idle");
  };

  const startMonthlyWizard = () => {
    setWizardStep(0);
    setWizardOpen(true);
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

  const saveWizardTargets = async (nextTargets: SuggestedMonthlyTarget[]) => {
    const payloads = nextTargets
      .filter((target) => target.targetValue > 0)
      .map((target) => ({
        category: target.category,
        primaryUnit: target.primaryUnit,
        targetValue: getWholeTargetValue(target.targetValue),
        optionalSecondaryUnit: target.category === "grind" ? target.optionalSecondaryUnit : undefined,
        optionalSecondaryTargetValue:
          target.category === "grind" && target.optionalSecondaryUnit
            ? getWholeTargetValue(target.optionalSecondaryTargetValue ?? 0)
            : undefined,
      }));

    if (!payloads.length) {
      setLocalSaveState("error");
      return;
    }

    setLocalSaveState("saving");

    try {
      if (hasPersistence) {
        for (const payload of payloads) {
          await onSaveCategory?.(payload);
        }
      }

      setTargets((current) => {
        const next = [...current];

        for (const payload of payloads) {
          const index = next.findIndex((target) => target.category === payload.category);
          if (index >= 0) {
            next[index] = payload;
          } else {
            next.push(payload);
          }
        }

        return next;
      });
      setWizardOpen(false);
      setWizardStep(0);
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
          {hasTargets || hasMonthlySuggestions ? (
            <button
              className="ep-button primary"
              type="button"
              onClick={hasMonthlySuggestions && !hasTargets ? startMonthlyWizard : () => startEditing(targetRows[0])}
            >
              {hasTargets ? "Editar objetivos" : "Rever objetivos sugeridos"}
            </button>
          ) : (
            <a className="ep-button primary" href="/annual">
              Definir Direção anual
            </a>
          )}
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
                  : "Adiciona ritmos anuais de Grind, Estudo, Revisão ou Desporto para gerar este mês."
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
        <div className={styles.monthlyLayout}>
        <article className={styles.targetTable} aria-label="Objetivos mensais por categoria">
          <header className={styles.tableHeader}>
            <span>Categoria</span>
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
              {summaryRows.map((target) => (
                <li key={target.id}>
                  <span>{target.label}</span>
                  <strong>{target.paceLabel}</strong>
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
          step={wizardStep}
          onCancel={() => {
            setWizardOpen(false);
            setWizardStep(0);
          }}
          onSave={saveWizardTargets}
          onStepChange={setWizardStep}
        />
      ) : null}
    </section>
  );
}
