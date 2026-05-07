"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  Compass,
  Dumbbell,
  Edit3,
  Gauge,
  History,
  Lightbulb,
  Lock,
  Plus,
  Save,
  Sparkles,
  Spade,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { PersistenceUnavailable } from "@/components/persistence-unavailable";
import { usePersistenceAuth } from "@/lib/persistence-auth";
import { hasPersistenceConfig } from "@/lib/runtime-config";

import styles from "./annual-direction.module.css";

type AnnualPlanForm = {
  primaryDirection: string;
  priorities: string[];
  nonNegotiables: string[];
  avoidRepeating: string;
  decisionRule: string;
};

type AnnualPlanRecord = AnnualPlanForm & {
  year: number;
  createdAt: number;
  updatedAt: number;
};

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";
type OperatingTargetCategory = "grind" | "study" | "review" | "sport" | "recovery" | "custom";
type OperatingTargetCadence = "weekly" | "monthly";

type OperatingTarget = {
  metricKey: string;
  label: string;
  category: OperatingTargetCategory;
  unit: string;
  cadence: OperatingTargetCadence;
  targetValue: number;
  effectiveFrom: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

type OperatingTargetDraft = {
  metricKey: string;
  label: string;
  category: OperatingTargetCategory;
  unit: string;
  cadence: OperatingTargetCadence;
  targetValue: number;
  effectiveFrom: string;
};

type AnnualDirectionWorkspaceProps = {
  demoReason?: string;
  hasPersistence: boolean;
  initialPlan: AnnualPlanRecord | null;
  initialOperatingTargets?: OperatingTarget[];
  onSave?: (plan: AnnualPlanForm) => Promise<void>;
  onSaveOperatingTarget?: (target: OperatingTargetDraft) => Promise<void>;
  operatingSaveState?: SaveState;
  saveState?: SaveState;
  year: number;
};

const currentYear = new Date().getFullYear();

const emptyPlan: AnnualPlanForm = {
  primaryDirection: "",
  priorities: ["", ""],
  nonNegotiables: [],
  avoidRepeating: "",
  decisionRule: "",
};

const mainDirectionExamples = [
  "Construir uma rotina estável de MTTs sem sacrificar energia e estudo.",
  "Jogar com mais consistência, menos impulsividade e melhor review.",
  "Tornar-me um jogador mais sólido, disciplinado e preparado.",
  "Priorizar qualidade de decisão, energia e execução semanal.",
];

const priorityExamples = [
  "Melhorar a qualidade de decisão em fases finais.",
  "Estudar ICM 2x por semana.",
  "Proteger energia antes de sessões importantes.",
  "Rever torneios-chave todas as semanas.",
  "Reduzir autopilot em late game.",
  "Manter rotina de estudo mesmo em good run.",
];

const nonNegotiableExamples = [
  "Não jogar sessões longas com sono fraco.",
  "Não aumentar volume para compensar semanas más.",
  "Não saltar review depois de sessões importantes.",
  "Não jogar sem um plano mínimo para o dia.",
  "Não tomar decisões de calendário em tilt.",
  "Não misturar estudo profundo com grind no mesmo bloco.",
];

const avoidRepeatingExamples = [
  "Compensar semanas fracas com volume irrealista.",
  "Jogar cansado só para bater volume.",
  "Adiar estudo até aparecer uma downswing.",
  "Mudar o plano semanal demasiadas vezes.",
  "Ignorar energia/sono antes de sessões grandes.",
  "Fazer review só quando os resultados são maus.",
];

const decisionRuleExamples = [
  "Se estiver cansado, reduzo volume antes de sacrificar review.",
  "Se tiver pouco tempo, priorizo qualidade de spots em vez de quantidade.",
  "Se perder clareza emocional, paro antes de abrir mais torneios.",
  "Se a semana descarrilar, volto ao plano mínimo em vez de tentar compensar tudo.",
  "Se uma decisão não serve a direção anual, não entra no plano semanal.",
  "Se grind e estudo entram em conflito, protejo pelo menos um bloco semanal de estudo.",
];

const operatingMetricExamples = [
  "Dias de grind por mês",
  "Dias de estudo por mês",
  "Volume de torneios por mês",
  "Horas de review por mês",
  "Sessões de treino/coaching por mês",
  "Dias off reais por mês",
];

const operatingTargetPresets: OperatingTargetDraft[] = [
  {
    metricKey: "grind_days_monthly",
    label: "Dias de grind por mês",
    category: "grind",
    unit: "dias",
    cadence: "monthly",
    targetValue: 16,
    effectiveFrom: "",
  },
  {
    metricKey: "study_days_monthly",
    label: "Dias de estudo por mês",
    category: "study",
    unit: "dias",
    cadence: "monthly",
    targetValue: 8,
    effectiveFrom: "",
  },
  {
    metricKey: "tournaments_monthly",
    label: "Volume de torneios por mês",
    category: "grind",
    unit: "torneios",
    cadence: "monthly",
    targetValue: 220,
    effectiveFrom: "",
  },
  {
    metricKey: "review_hours_monthly",
    label: "Horas de review por mês",
    category: "review",
    unit: "horas",
    cadence: "monthly",
    targetValue: 10,
    effectiveFrom: "",
  },
  {
    metricKey: "coaching_sessions_monthly",
    label: "Sessões de treino/coaching por mês",
    category: "study",
    unit: "sessões",
    cadence: "monthly",
    targetValue: 2,
    effectiveFrom: "",
  },
  {
    metricKey: "real_off_days_monthly",
    label: "Dias off reais por mês",
    category: "recovery",
    unit: "dias",
    cadence: "monthly",
    targetValue: 4,
    effectiveFrom: "",
  },
  {
    metricKey: "custom",
    label: "Métrica personalizada",
    category: "custom",
    unit: "",
    cadence: "weekly",
    targetValue: 1,
    effectiveFrom: "",
  },
];

const categoryLabels: Record<OperatingTargetCategory, string> = {
  grind: "Grind",
  study: "Estudo",
  review: "Review",
  sport: "Sport",
  recovery: "Recovery",
  custom: "Custom",
};

const cadenceLabels: Record<OperatingTargetCadence, string> = {
  weekly: "por semana",
  monthly: "por mês",
};

function normalizePlan(plan: AnnualPlanForm): AnnualPlanForm {
  return {
    primaryDirection: plan.primaryDirection.trim(),
    priorities: plan.priorities.map((priority) => priority.trim()).filter(Boolean).slice(0, 4),
    nonNegotiables: plan.nonNegotiables.map((rule) => rule.trim()).filter(Boolean),
    avoidRepeating: plan.avoidRepeating.trim(),
    decisionRule: plan.decisionRule.trim(),
  };
}

function getSuggestion(examples: string[], existing: string[]) {
  const normalized = new Set(existing.map((item) => item.trim()).filter(Boolean));

  return examples.find((example) => !normalized.has(example)) ?? examples[existing.length % examples.length] ?? "";
}

function getDecisionRules(plan: AnnualPlanForm) {
  return plan.decisionRule
    .split("\n")
    .map((rule) => rule.trim())
    .filter(Boolean);
}

function setDecisionRules(plan: AnnualPlanForm, rules: string[]): AnnualPlanForm {
  return {
    ...plan,
    decisionRule: rules.map((rule) => rule.trim()).filter(Boolean).join("\n"),
  };
}

function formatUpdatedAt(timestamp?: number) {
  if (!timestamp) return "Ainda não guardado";

  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function getOperatingTargetIcon(category: OperatingTargetCategory) {
  if (category === "grind") return Spade;
  if (category === "sport" || category === "recovery") return Dumbbell;
  if (category === "review") return History;
  return Gauge;
}

function createDraftFromPreset(metricKey: string, effectiveFrom: string): OperatingTargetDraft {
  const preset = operatingTargetPresets.find((target) => target.metricKey === metricKey);
  const base = preset ?? operatingTargetPresets[0];
  const isCustom = base.metricKey === "custom";

  return {
    ...base,
    metricKey: isCustom ? `custom_${Date.now()}` : base.metricKey,
    label: isCustom ? "" : base.label,
    effectiveFrom,
  };
}

function getActiveTargets(targets: OperatingTarget[]) {
  return targets
    .filter((target) => target.active)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function getInactiveVersions(targets: OperatingTarget[], metricKey: string) {
  return targets
    .filter((target) => target.metricKey === metricKey && !target.active)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
}

function normalizeOperatingTarget(target: OperatingTargetDraft): OperatingTargetDraft {
  return {
    ...target,
    metricKey: target.metricKey.trim(),
    label: target.label.trim(),
    unit: target.unit.trim(),
    targetValue: Number(target.targetValue),
    effectiveFrom: target.effectiveFrom,
  };
}

export function AnnualDirection() {
  if (!hasPersistenceConfig) {
    return (
      <AnnualDirectionWorkspace
        demoReason="Clerk ou Convex ainda não estão configurados. A direção fica apenas neste draft local."
        hasPersistence={false}
        initialPlan={null}
        initialOperatingTargets={[]}
        saveState="idle"
        year={currentYear}
      />
    );
  }

  return <PersistedAnnualDirection />;
}

function PersistedAnnualDirection() {
  const auth = usePersistenceAuth();
  const canUsePersistence = auth.kind === "ready";
  const annualPlan = useQuery(
    api.annualPlan.getCurrent,
    canUsePersistence ? { year: currentYear } : "skip",
  );
  const operatingTargets = useQuery(
    api.annualOperatingTarget.listByYear,
    canUsePersistence ? { year: currentYear } : "skip",
  );
  const saveAnnualPlan = useMutation(api.annualPlan.save);
  const saveOperatingTarget = useMutation(api.annualOperatingTarget.saveVersion);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [operatingSaveState, setOperatingSaveState] = useState<SaveState>("idle");

  if (
    auth.kind === "loading" ||
    (canUsePersistence && (annualPlan === undefined || operatingTargets === undefined))
  ) {
    return (
      <section className="ep-page">
        <div className={styles.loadingState}>A carregar direção anual...</div>
      </section>
    );
  }

  if (auth.kind === "signed-out") {
    return (
      <AnnualDirectionWorkspace
        demoReason="Sessão não iniciada. Estás a ver um draft local; entra para guardar a direção no Convex."
        hasPersistence={false}
        initialPlan={null}
        initialOperatingTargets={[]}
        saveState="idle"
        year={currentYear}
      />
    );
  }

  if (auth.kind === "unavailable") {
    return <PersistenceUnavailable featureName="Direção anual" />;
  }

  const workspaceKey = annualPlan
    ? `${annualPlan._id}:${annualPlan.updatedAt}`
    : `empty:${currentYear}`;

  return (
    <AnnualDirectionWorkspace
      key={workspaceKey}
      hasPersistence
      initialPlan={annualPlan ?? null}
      initialOperatingTargets={operatingTargets ?? []}
      onSave={async (plan) => {
        setSaveState("saving");

        try {
          await saveAnnualPlan({
            year: currentYear,
            ...plan,
          });
          setSaveState("saved");
        } catch (error) {
          setSaveState("error");
          throw error;
        }
      }}
      onSaveOperatingTarget={async (target) => {
        setOperatingSaveState("saving");

        try {
          await saveOperatingTarget({
            year: currentYear,
            ...target,
          });
          setOperatingSaveState("saved");
        } catch (error) {
          setOperatingSaveState("error");
          throw error;
        }
      }}
      operatingSaveState={operatingSaveState}
      saveState={saveState}
      year={currentYear}
    />
  );
}

function AnnualDirectionWorkspace({
  demoReason,
  hasPersistence,
  initialPlan,
  initialOperatingTargets = [],
  onSave,
  onSaveOperatingTarget,
  operatingSaveState = "idle",
  saveState = "idle",
  year,
}: AnnualDirectionWorkspaceProps) {
  const openedSetupFromUrl = useRef(false);
  const initialFormPlan = initialPlan ?? emptyPlan;
  const [plan, setPlan] = useState<AnnualPlanForm>(initialFormPlan);
  const [draft, setDraft] = useState<AnnualPlanForm>(initialFormPlan);
  const [operatingTargets, setOperatingTargets] =
    useState<OperatingTarget[]>(initialOperatingTargets);
  const [operatingDraft, setOperatingDraft] = useState<OperatingTargetDraft | null>(null);
  const [showEffectiveFrom, setShowEffectiveFrom] = useState(false);
  const [mode, setMode] = useState<"read" | "edit" | "empty">(initialPlan ? "read" : "empty");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [localSaveState, setLocalSaveState] = useState<SaveState>(saveState);
  const [localOperatingSaveState, setLocalOperatingSaveState] =
    useState<SaveState>(operatingSaveState);

  const effectiveSaveState = localSaveState === "idle" ? saveState : localSaveState;
  const effectiveOperatingSaveState =
    localOperatingSaveState === "idle" ? operatingSaveState : localOperatingSaveState;
  const isEditing = mode === "edit";
  const visiblePlan = isEditing ? draft : plan;
  const hasSavedPlan = Boolean(plan.primaryDirection.trim());
  const activeOperatingTargets = useMemo(
    () => getActiveTargets(operatingTargets),
    [operatingTargets],
  );

  useEffect(() => {
    if (openedSetupFromUrl.current) return;

    const params = new URLSearchParams(window.location.search);
    const openSetupOnMount = params.get("setup") === "annual";

    if (!openSetupOnMount) return;

    openedSetupFromUrl.current = true;
    window.history.replaceState(null, "", window.location.pathname);

    const frame = window.requestAnimationFrame(() => {
      setDraft(hasSavedPlan ? plan : emptyPlan);
      setWizardStep(0);
      setWizardOpen(true);
      setLocalSaveState("dirty");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hasSavedPlan, plan]);

  const validationMessage = useMemo(() => {
    const normalized = normalizePlan(draft);

    if (!normalized.primaryDirection) return "Escreve a direção principal do ano.";
    if (normalized.priorities.length < 2) return "Adiciona pelo menos 2 prioridades.";
    if (normalized.priorities.length > 4) return "Podes ter no máximo 4 prioridades.";

    return null;
  }, [draft]);
  const operatingValidationMessage = useMemo(() => {
    if (!operatingDraft) return null;

    const normalized = normalizeOperatingTarget(operatingDraft);

    if (!normalized.label) return "Dá um nome à métrica.";
    if (!normalized.unit) return "Escolhe a unidade.";
    if (!normalized.targetValue || normalized.targetValue <= 0) {
      return "Define um valor positivo.";
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized.effectiveFrom)) {
      return "Escolhe uma data de início válida.";
    }

    return null;
  }, [operatingDraft]);

  const startEditing = () => {
    setDraft(hasSavedPlan ? plan : emptyPlan);
    setWizardStep(0);
    setWizardOpen(true);
    setLocalSaveState("dirty");
  };

  const cancelEditing = () => {
    setDraft(plan);
    setWizardOpen(false);
    setWizardStep(0);
    setLocalSaveState("idle");
  };

  const saveDirection = async () => {
    if (validationMessage) {
      setLocalSaveState("error");
      return;
    }

    const normalized = normalizePlan(draft);
    setLocalSaveState("saving");

    if (onSave) {
      try {
        await onSave(normalized);
      } catch {
        setLocalSaveState("error");
        return;
      }
    }

    setPlan(normalized);
    setDraft(normalized);
    setMode("read");
    setWizardOpen(false);
    setWizardStep(0);
    setLocalSaveState("saved");
  };

  const markDirty = () => {
    setLocalSaveState("dirty");
  };

  const updatePriority = (index: number, value: string) => {
    setDraft((current) => ({
      ...current,
      priorities: current.priorities.map((priority, priorityIndex) =>
        priorityIndex === index ? value : priority,
      ),
    }));
    markDirty();
  };

  const addPriority = () => {
    if (draft.priorities.length >= 4) return;
    setDraft((current) => ({
      ...current,
      priorities: [
        ...current.priorities,
        getSuggestion(
          priorityExamples,
          current.priorities.map((priority, index) => priority || priorityExamples[index] || ""),
        ),
      ],
    }));
    markDirty();
  };

  const removePriority = (index: number) => {
    if (draft.priorities.length <= 2) return;
    setDraft((current) => ({
      ...current,
      priorities: current.priorities.filter((_, priorityIndex) => priorityIndex !== index),
    }));
    markDirty();
  };

  const updateNonNegotiable = (index: number, value: string) => {
    setDraft((current) => ({
      ...current,
      nonNegotiables: current.nonNegotiables.map((rule, ruleIndex) =>
        ruleIndex === index ? value : rule,
      ),
    }));
    markDirty();
  };

  const addNonNegotiable = () => {
    setDraft((current) => ({
      ...current,
      nonNegotiables: [
        ...current.nonNegotiables,
        getSuggestion(nonNegotiableExamples, current.nonNegotiables),
      ],
    }));
    markDirty();
  };

  const removeNonNegotiable = (index: number) => {
    setDraft((current) => ({
      ...current,
      nonNegotiables: current.nonNegotiables.filter((_, ruleIndex) => ruleIndex !== index),
    }));
    markDirty();
  };

  const startOperatingTarget = (metricKey?: string) => {
    const activeMetricKeys = new Set(getActiveTargets(operatingTargets).map((target) => target.metricKey));
    const nextMetricKey =
      metricKey ??
      operatingTargetPresets.find(
        (preset) => preset.metricKey !== "custom" && !activeMetricKeys.has(preset.metricKey),
      )?.metricKey ??
      "custom";

    setOperatingDraft(createDraftFromPreset(nextMetricKey, getTodayIsoDate()));
    setShowEffectiveFrom(false);
    setLocalOperatingSaveState("dirty");
  };

  const editOperatingTarget = (target: OperatingTarget) => {
    setOperatingDraft({
      metricKey: target.metricKey,
      label: target.label,
      category: target.category,
      unit: target.unit,
      cadence: target.cadence,
      targetValue: target.targetValue,
      effectiveFrom: getTodayIsoDate(),
    });
    setShowEffectiveFrom(false);
    setLocalOperatingSaveState("dirty");
  };

  const cancelOperatingTarget = () => {
    setOperatingDraft(null);
    setShowEffectiveFrom(false);
    setLocalOperatingSaveState("idle");
  };

  const saveOperatingTargetDraft = async () => {
    if (!operatingDraft) return;

    if (operatingValidationMessage) {
      setLocalOperatingSaveState("error");
      return;
    }

    const normalized = normalizeOperatingTarget(operatingDraft);
    setLocalOperatingSaveState("saving");

    if (onSaveOperatingTarget) {
      try {
        await onSaveOperatingTarget(normalized);
      } catch {
        setLocalOperatingSaveState("error");
        return;
      }
    }

    const now = Date.now();
    setOperatingTargets((current) => [
      ...current.map((target) =>
        target.metricKey === normalized.metricKey
          ? { ...target, active: false, updatedAt: now }
          : target,
      ),
      {
        ...normalized,
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setOperatingDraft(null);
    setShowEffectiveFrom(false);
    setLocalOperatingSaveState("saved");
  };

  return (
    <section className="ep-page">
      {demoReason ? <div className={styles.demoBanner}>{demoReason}</div> : null}

      <div className="ep-page-header">
        <div>
          <span>{year}</span>
          <h1>Direção anual</h1>
          <p>Define o contexto que orienta os objetivos mensais e as decisões da semana.</p>
        </div>
        <div className="ep-page-actions">
          {isEditing ? (
            <>
              <button
                className="ep-button secondary"
                disabled={effectiveSaveState === "saving"}
                type="button"
                onClick={cancelEditing}
              >
                <X size={14} aria-hidden="true" />
                Cancelar
              </button>
              <button
                className="ep-button primary"
                disabled={effectiveSaveState === "saving"}
                type="button"
                onClick={saveDirection}
              >
                <Save size={14} aria-hidden="true" />
                {effectiveSaveState === "saving" ? "A guardar..." : "Guardar direção"}
              </button>
            </>
          ) : (
            <button className="ep-button primary" type="button" onClick={startEditing}>
              <Edit3 size={14} aria-hidden="true" />
              {hasSavedPlan ? "Editar direção" : "Definir direção"}
            </button>
          )}
        </div>
      </div>

      {mode === "empty" ? (
        <article className={styles.emptyState}>
          <Compass size={22} aria-hidden="true" />
          <div>
            <h2>Ainda não definiste a direção anual.</h2>
            <p>Isto dá contexto aos Objetivos mensais, ao Plano semanal e ao Coach AI.</p>
            <div className={styles.emptyChecklist}>
              <span>Direção principal</span>
              <span>2 a 4 prioridades</span>
              <span>Limites opcionais</span>
              <span>Padrão a evitar</span>
              <span>Regra de decisão</span>
            </div>
            <button className="ep-button primary" type="button" onClick={startEditing}>
              <Compass size={14} aria-hidden="true" />
              Definir direção
            </button>
          </div>
        </article>
      ) : (
        <div className={styles.layout}>
          <div className={styles.mainStack}>
            <article className={styles.directionPanel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Direção principal</span>
                  <h2>O que queres construir este ano?</h2>
                </div>
                <Compass size={18} aria-hidden="true" />
              </div>

              {isEditing ? (
                <label className={styles.field}>
                  <span>Escreve uma frase curta que ajude a tomar decisões.</span>
                  <textarea
                    value={draft.primaryDirection}
                    rows={3}
                    onChange={(event) => {
                      setDraft((current) => ({
                        ...current,
                        primaryDirection: event.target.value,
                      }));
                      markDirty();
                    }}
                    placeholder="Exemplo: construir uma rotina estável de MTTs sem sacrificar energia e estudo."
                  />
                </label>
              ) : (
                <p className={styles.primaryStatement}>{visiblePlan.primaryDirection}</p>
              )}
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Prioridades</span>
                  <h2>Escolhe 2 a 4 prioridades para guiar o ano.</h2>
                </div>
                <strong>{visiblePlan.priorities.filter(Boolean).length}/4</strong>
              </div>

              <div className={styles.list}>
                {visiblePlan.priorities.map((priority, index) => (
                  <div className={styles.row} key={`priority-${index}`}>
                    <span>{index + 1}</span>
                    {isEditing ? (
                      <input
                        value={priority}
                        onChange={(event) => updatePriority(index, event.target.value)}
                        placeholder={`Prioridade ${index + 1}`}
                      />
                    ) : (
                      <strong>{priority}</strong>
                    )}
                    {isEditing ? (
                      <button
                        aria-label="Remover prioridade"
                        disabled={draft.priorities.length <= 2}
                        type="button"
                        onClick={() => removePriority(index)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              {isEditing ? (
                <button
                  className={styles.addButton}
                  disabled={draft.priorities.length >= 4}
                  type="button"
                  onClick={addPriority}
                >
                  <Plus size={14} aria-hidden="true" />
                  Adicionar prioridade
                </button>
              ) : null}
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Limites e não-negociáveis</span>
                  <h2>Que regras devem proteger o teu ano?</h2>
                </div>
                <Lock size={18} aria-hidden="true" />
              </div>

              <div className={styles.list}>
                {visiblePlan.nonNegotiables.length ? (
                  visiblePlan.nonNegotiables.map((rule, index) => (
                    <div className={styles.row} key={`non-negotiable-${index}`}>
                      <span>
                        <Check size={13} aria-hidden="true" />
                      </span>
                      {isEditing ? (
                        <input
                          value={rule}
                          onChange={(event) => updateNonNegotiable(index, event.target.value)}
                          placeholder="Exemplo: não jogar sessões longas com sono fraco."
                        />
                      ) : (
                        <strong>{rule}</strong>
                      )}
                      {isEditing ? (
                        <button
                          aria-label="Remover limite"
                          type="button"
                          onClick={() => removeNonNegotiable(index)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className={styles.quietText}>
                    Opcional, mas útil para evitar planos irrealistas.
                  </p>
                )}
              </div>

              {isEditing ? (
                <button className={styles.addButton} type="button" onClick={addNonNegotiable}>
                  <Plus size={14} aria-hidden="true" />
                  Adicionar limite
                </button>
              ) : null}
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span>O que não repetir este ano</span>
                  <h2>Que padrão queres evitar?</h2>
                </div>
                <AlertCircle size={18} aria-hidden="true" />
              </div>

              {isEditing ? (
                <label className={styles.field}>
                  <span>Opcional, mas dá muito contexto ao Coach.</span>
                  <textarea
                    value={draft.avoidRepeating}
                    rows={2}
                    onChange={(event) => {
                      setDraft((current) => ({
                        ...current,
                        avoidRepeating: event.target.value,
                      }));
                      markDirty();
                    }}
                    placeholder="Exemplo: compensar semanas fracas com volume irrealista."
                  />
                </label>
              ) : (
                <p className={styles.quietText}>
                  {visiblePlan.avoidRepeating || "Sem padrão definido."}
                </p>
              )}
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Regra de decisão</span>
                  <h2>Que critério deve guiar trade-offs difíceis?</h2>
                </div>
                <Lightbulb size={18} aria-hidden="true" />
              </div>

              {isEditing ? (
                <label className={styles.field}>
                  <span>Frase livre. Mantém isto prático, não automático.</span>
                  <textarea
                    value={draft.decisionRule}
                    rows={2}
                    onChange={(event) => {
                      setDraft((current) => ({
                        ...current,
                        decisionRule: event.target.value,
                      }));
                      markDirty();
                    }}
                    placeholder="Exemplo: se estiver cansado, reduzo volume antes de sacrificar review."
                  />
                </label>
              ) : (
                <p className={styles.quietText}>
                  {visiblePlan.decisionRule || "Sem regra de decisão definida."}
                </p>
              )}
            </article>

            <article className={styles.operatingPanel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Ritmo operacional anual</span>
                  <h2>Métricas palpáveis para orientar o resto do ano.</h2>
                </div>
                <Gauge size={18} aria-hidden="true" />
              </div>

              <p className={styles.quietText}>
                Define ritmos base como grind, torneios, estudo, review ou sport. Cada alteração
                começa na data definida e não muda meses anteriores.
              </p>

              {activeOperatingTargets.length ? (
                <div className={styles.operatingList}>
                  {activeOperatingTargets.map((target) => {
                    const Icon = getOperatingTargetIcon(target.category);
                    const history = getInactiveVersions(operatingTargets, target.metricKey);

                    return (
                      <div className={styles.operatingItem} key={target.metricKey}>
                        <div className={styles.operatingMain}>
                          <span className={styles.operatingIcon}>
                            <Icon size={15} aria-hidden="true" />
                          </span>
                          <div>
                            <strong>{target.label}</strong>
                            <small>
                              Atual: {target.targetValue} {target.unit}{" "}
                              {cadenceLabels[target.cadence]} desde{" "}
                              {formatDateLabel(target.effectiveFrom)}
                            </small>
                          </div>
                        </div>
                        <span className={styles.categoryTag}>{categoryLabels[target.category]}</span>
                        <button
                          className={styles.textButton}
                          type="button"
                          onClick={() => editOperatingTarget(target)}
                        >
                          Ajustar
                        </button>
                        {history.length ? (
                          <details className={styles.historyDetails}>
                            <summary>Histórico</summary>
                            <ul>
                              {history.map((version) => (
                                <li key={`${version.metricKey}-${version.effectiveFrom}-${version.updatedAt}`}>
                                  {version.targetValue} {version.unit}{" "}
                                  {cadenceLabels[version.cadence]} desde{" "}
                                  {formatDateLabel(version.effectiveFrom)}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.operatingEmpty}>
                  <Gauge size={18} aria-hidden="true" />
                  <p>
                    Ainda não definiste ritmos operacionais. Podes começar por estudo, grind,
                    torneios, review ou sport.
                  </p>
                </div>
              )}

              {operatingDraft ? (
                <div className={styles.operatingForm}>
                  <div className={styles.formGrid}>
                    <label>
                      Métrica
                      <select
                        value={
                          operatingTargetPresets.some(
                            (preset) => preset.metricKey === operatingDraft.metricKey,
                          )
                            ? operatingDraft.metricKey
                            : "custom"
                        }
                        onChange={(event) => startOperatingTarget(event.target.value)}
                      >
                        {operatingTargetPresets.map((preset) => (
                          <option key={preset.metricKey} value={preset.metricKey}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Nome
                      <input
                        value={operatingDraft.label}
                        onChange={(event) =>
                          setOperatingDraft((current) =>
                            current ? { ...current, label: event.target.value } : current,
                          )
                        }
                        placeholder="Exemplo: Horas de estudo por semana"
                      />
                    </label>

                    <label>
                      Categoria
                      <select
                        value={operatingDraft.category}
                        onChange={(event) =>
                          setOperatingDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  category: event.target.value as OperatingTargetCategory,
                                }
                              : current,
                          )
                        }
                      >
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Valor
                      <input
                        min="1"
                        type="number"
                        value={operatingDraft.targetValue}
                        onChange={(event) =>
                          setOperatingDraft((current) =>
                            current
                              ? { ...current, targetValue: Number(event.target.value) }
                              : current,
                          )
                        }
                      />
                    </label>

                    <label>
                      Unidade
                      <input
                        value={operatingDraft.unit}
                        onChange={(event) =>
                          setOperatingDraft((current) =>
                            current ? { ...current, unit: event.target.value } : current,
                          )
                        }
                        placeholder="horas, torneios, sessões..."
                      />
                    </label>

                    <label>
                      Cadência
                      <select
                        value={operatingDraft.cadence}
                        onChange={(event) =>
                          setOperatingDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  cadence: event.target.value as OperatingTargetCadence,
                                }
                              : current,
                          )
                        }
                      >
                        <option value="weekly">por semana</option>
                        <option value="monthly">por mês</option>
                      </select>
                    </label>
                  </div>

                  <button
                    className={styles.textButton}
                    type="button"
                    onClick={() => setShowEffectiveFrom((value) => !value)}
                  >
                    {showEffectiveFrom ? "Ocultar data de início" : "Alterar data de início"}
                  </button>

                  {showEffectiveFrom ? (
                    <label className={styles.dateField}>
                      Aplicável desde
                      <input
                        type="date"
                        value={operatingDraft.effectiveFrom}
                        onChange={(event) =>
                          setOperatingDraft((current) =>
                            current ? { ...current, effectiveFrom: event.target.value } : current,
                          )
                        }
                      />
                    </label>
                  ) : (
                    <p className={styles.quietText}>
                      Aplicável desde {formatDateLabel(operatingDraft.effectiveFrom)}.
                    </p>
                  )}

                  {effectiveOperatingSaveState === "error" ? (
                    <p className={styles.errorText}>
                      {operatingValidationMessage ??
                        "Não foi possível guardar este ritmo. Tenta novamente."}
                    </p>
                  ) : null}

                  <div className={styles.operatingActions}>
                    <button
                      className="ep-button secondary"
                      disabled={effectiveOperatingSaveState === "saving"}
                      type="button"
                      onClick={cancelOperatingTarget}
                    >
                      <X size={14} aria-hidden="true" />
                      Cancelar
                    </button>
                    <button
                      className="ep-button primary"
                      disabled={effectiveOperatingSaveState === "saving"}
                      type="button"
                      onClick={saveOperatingTargetDraft}
                    >
                      <Save size={14} aria-hidden="true" />
                      {effectiveOperatingSaveState === "saving" ? "A guardar..." : "Guardar ritmo"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className={styles.addButton}
                  type="button"
                  onClick={() => startOperatingTarget()}
                >
                  <Plus size={14} aria-hidden="true" />
                  Adicionar métrica
                </button>
              )}
            </article>
          </div>

          <aside className={styles.sideStack}>
            <article className={styles.nextPanel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Próximo passo</span>
                  <h2>Transforma esta direção no ritmo do mês.</h2>
                </div>
                <ArrowRight size={18} aria-hidden="true" />
              </div>
              <p>
                Nos Objetivos mensais, esta direção aparece como contexto para decidir o que este
                mês deve mover.
              </p>
              <Link className="ep-button primary" href="/monthly">
                Definir objetivos mensais
              </Link>
            </article>

            <article className={styles.coachPanel}>
              <div className={styles.panelHead}>
                <div>
                  <span>Coach AI</span>
                  <h2>Revisão contextual</h2>
                </div>
                <Sparkles size={18} aria-hidden="true" />
              </div>
              <p>
                O Coach pode desafiar pontos vagos ou irrealistas e detetar desalinhamento com
                objetivos mensais e plano semanal.
              </p>
              <div className={styles.contextLine}>
                <Lightbulb size={15} aria-hidden="true" />
                <span>Contexto usado: direção anual</span>
              </div>
              <button className="ep-button secondary" type="button">
                Pedir revisão ao Coach
              </button>
            </article>

            <article className={styles.statusPanel}>
              <span className={styles.statusLabel}>Estado</span>
              <strong>
                {effectiveSaveState === "saving"
                  ? "A guardar..."
                  : effectiveSaveState === "saved"
                    ? "Guardado"
                    : effectiveSaveState === "dirty"
                      ? "Alterações por guardar"
                      : effectiveSaveState === "error"
                        ? validationMessage
                          ? "Há campos em falta"
                          : "Não foi possível guardar"
                        : hasPersistence
                          ? "Fonte operacional"
                          : "Draft local"}
              </strong>
              {effectiveSaveState === "error" ? (
                <p>{validationMessage ?? "Tenta novamente daqui a pouco."}</p>
              ) : null}
              <small>Última atualização: {formatUpdatedAt(initialPlan?.updatedAt)}</small>
            </article>
          </aside>
        </div>
      )}

      {wizardOpen ? (
        <AnnualDirectionWizard
          activeOperatingTargets={activeOperatingTargets}
          draft={draft}
          effectiveOperatingSaveState={effectiveOperatingSaveState}
          effectiveSaveState={effectiveSaveState}
          operatingDraft={operatingDraft}
          operatingTargets={operatingTargets}
          operatingValidationMessage={operatingValidationMessage}
          showEffectiveFrom={showEffectiveFrom}
          step={wizardStep}
          validationMessage={validationMessage}
          year={year}
          onAddNonNegotiable={addNonNegotiable}
          onAddPriority={addPriority}
          onCancel={cancelEditing}
          onCancelOperatingTarget={cancelOperatingTarget}
          onEditOperatingTarget={editOperatingTarget}
          onRemoveNonNegotiable={removeNonNegotiable}
          onRemovePriority={removePriority}
          onSave={saveDirection}
          onSaveOperatingTarget={saveOperatingTargetDraft}
          onSetDraft={(nextDraft) => {
            setDraft(nextDraft);
            markDirty();
          }}
          onSetOperatingDraft={setOperatingDraft}
          onSetShowEffectiveFrom={setShowEffectiveFrom}
          onStartOperatingTarget={startOperatingTarget}
          onStepChange={setWizardStep}
          onUpdateNonNegotiable={updateNonNegotiable}
          onUpdatePriority={updatePriority}
        />
      ) : null}
    </section>
  );
}

function AnnualDirectionWizard({
  activeOperatingTargets,
  draft,
  effectiveOperatingSaveState,
  effectiveSaveState,
  operatingDraft,
  operatingTargets,
  operatingValidationMessage,
  showEffectiveFrom,
  step,
  validationMessage,
  year,
  onAddNonNegotiable,
  onAddPriority,
  onCancel,
  onCancelOperatingTarget,
  onEditOperatingTarget,
  onRemoveNonNegotiable,
  onRemovePriority,
  onSave,
  onSaveOperatingTarget,
  onSetDraft,
  onSetOperatingDraft,
  onSetShowEffectiveFrom,
  onStartOperatingTarget,
  onStepChange,
  onUpdateNonNegotiable,
  onUpdatePriority,
}: {
  activeOperatingTargets: OperatingTarget[];
  draft: AnnualPlanForm;
  effectiveOperatingSaveState: SaveState;
  effectiveSaveState: SaveState;
  operatingDraft: OperatingTargetDraft | null;
  operatingTargets: OperatingTarget[];
  operatingValidationMessage: string | null;
  showEffectiveFrom: boolean;
  step: number;
  validationMessage: string | null;
  year: number;
  onAddNonNegotiable: () => void;
  onAddPriority: () => void;
  onCancel: () => void;
  onCancelOperatingTarget: () => void;
  onEditOperatingTarget: (target: OperatingTarget) => void;
  onRemoveNonNegotiable: (index: number) => void;
  onRemovePriority: (index: number) => void;
  onSave: () => Promise<void>;
  onSaveOperatingTarget: () => Promise<void>;
  onSetDraft: (draft: AnnualPlanForm) => void;
  onSetOperatingDraft: Dispatch<SetStateAction<OperatingTargetDraft | null>>;
  onSetShowEffectiveFrom: Dispatch<SetStateAction<boolean>>;
  onStartOperatingTarget: (metricKey?: string) => void;
  onStepChange: Dispatch<SetStateAction<number>>;
  onUpdateNonNegotiable: (index: number, value: string) => void;
  onUpdatePriority: (index: number, value: string) => void;
}) {
  const steps = [
    "Direção",
    "Prioridades",
    "Padrões",
    "Métricas",
    "Revisão",
  ];
  const decisionRules = getDecisionRules(draft);
  const canContinue = step !== 0 || Boolean(draft.primaryDirection.trim());

  function updateDecisionRule(index: number, value: string) {
    const nextRules = decisionRules.map((rule, ruleIndex) =>
      ruleIndex === index ? value : rule,
    );
    onSetDraft(setDecisionRules(draft, nextRules));
  }

  function addDecisionRule() {
    onSetDraft(
      setDecisionRules(draft, [
        ...decisionRules,
        getSuggestion(
          decisionRuleExamples,
          decisionRules.map((rule, index) => rule || decisionRuleExamples[index] || ""),
        ),
      ]),
    );
  }

  function removeDecisionRule(index: number) {
    onSetDraft(setDecisionRules(draft, decisionRules.filter((_, ruleIndex) => ruleIndex !== index)));
  }

  async function continueOrSave() {
    if (step === 0 && !draft.primaryDirection.trim()) return;
    if (step < steps.length - 1) {
      onStepChange((current) => Math.min(current + 1, steps.length - 1));
      return;
    }

    await onSave();
  }

  return (
    <div className={styles.modalLayer} role="presentation">
      <button className={styles.modalScrim} type="button" aria-label="Fechar" onClick={onCancel} />
      <section
        aria-labelledby="annual-direction-wizard-title"
        aria-modal="true"
        className={styles.modal}
        role="dialog"
      >
        <header className={styles.modalHeader}>
          <div>
            <span>Direção anual · passo {step + 1} de {steps.length}</span>
            <h2 id="annual-direction-wizard-title">{steps[step]}</h2>
          </div>
          <button className={styles.iconButton} type="button" aria-label="Fechar" onClick={onCancel}>
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.stepper} aria-label="Progresso">
          {steps.map((label, index) => (
            <button
              className={index === step ? styles.activeStep : undefined}
              key={label}
              type="button"
              onClick={() => {
                if (index === 0 || draft.primaryDirection.trim()) onStepChange(index);
              }}
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
                <h3>O que queres construir este ano?</h3>
                <p>Escreve uma frase curta que ajude a tomar decisões difíceis.</p>
              </div>
              <label className={`${styles.field} ${styles.primaryField}`}>
                <span>Direção principal</span>
                <textarea
                  autoFocus
                  rows={4}
                  value={draft.primaryDirection}
                  onChange={(event) => onSetDraft({ ...draft, primaryDirection: event.target.value })}
                  placeholder={mainDirectionExamples[0]}
                />
              </label>
              <CoachHint examples={mainDirectionExamples} label="Pedir ideias ao Coach" />
              {!draft.primaryDirection.trim() && effectiveSaveState === "error" ? (
                <p className={styles.errorText}>A direção principal é obrigatória.</p>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className={styles.wizardStack}>
              <div className={styles.wizardIntro}>
                <h3>Onde vai a atenção e que limites protegem o ano?</h3>
                <p>Mantém 2 a 4 prioridades. Os não-negociáveis protegem energia, estudo e decisões sob pressão.</p>
              </div>
              <WizardRows
                addLabel="Adicionar prioridade"
                countLabel={`${draft.priorities.filter(Boolean).length}/4`}
                items={draft.priorities}
                placeholders={priorityExamples}
                removeDisabled={draft.priorities.length <= 2}
                title="Prioridades"
                onAdd={onAddPriority}
                onRemove={onRemovePriority}
                onUpdate={onUpdatePriority}
              />
              <WizardRows
                addLabel="Adicionar não-negociável"
                icon="check"
                items={draft.nonNegotiables}
                placeholders={nonNegotiableExamples}
                title="Não-negociáveis"
                onAdd={onAddNonNegotiable}
                onRemove={onRemoveNonNegotiable}
                onUpdate={onUpdateNonNegotiable}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className={styles.wizardStack}>
              <div className={styles.wizardIntro}>
                <h3>Que padrões e trade-offs precisam de ficar explícitos?</h3>
                <p>Isto torna a direção prática quando houver cansaço, tilt, pouco tempo ou pressão por volume.</p>
              </div>
              <label className={styles.field}>
                <span>O que não repetir este ano</span>
                <textarea
                  rows={3}
                  value={draft.avoidRepeating}
                  onChange={(event) => onSetDraft({ ...draft, avoidRepeating: event.target.value })}
                  placeholder={avoidRepeatingExamples[0]}
                />
              </label>
              <CoachHint examples={avoidRepeatingExamples} label="Sugerir exemplos" />
              <WizardRows
                addLabel="Adicionar regra"
                icon="rule"
                items={decisionRules}
                placeholders={decisionRuleExamples}
                title="Regras de decisão"
                onAdd={addDecisionRule}
                onRemove={removeDecisionRule}
                onUpdate={updateDecisionRule}
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className={styles.wizardStack}>
              <div className={styles.wizardIntro}>
                <h3>Que métricas tornam a direção visível?</h3>
                <p>Escolhe ritmos simples. Podes adicionar várias métricas agora e ajustá-las mais tarde.</p>
              </div>
              <CoachHint examples={operatingMetricExamples} label="Sugerir exemplos" />
              <OperatingTargetsEditor
                activeOperatingTargets={activeOperatingTargets}
                effectiveOperatingSaveState={effectiveOperatingSaveState}
                operatingDraft={operatingDraft}
                operatingTargets={operatingTargets}
                operatingValidationMessage={operatingValidationMessage}
                showEffectiveFrom={showEffectiveFrom}
                onCancelOperatingTarget={onCancelOperatingTarget}
                onEditOperatingTarget={onEditOperatingTarget}
                onSaveOperatingTarget={onSaveOperatingTarget}
                onSetOperatingDraft={onSetOperatingDraft}
                onSetShowEffectiveFrom={onSetShowEffectiveFrom}
                onStartOperatingTarget={onStartOperatingTarget}
              />
            </div>
          ) : null}

          {step === 4 ? (
            <div className={styles.reviewGrid}>
              <section className={styles.reviewHero}>
                <span>Direção anual {year}</span>
                <strong>{draft.primaryDirection || "Direção por definir"}</strong>
              </section>
              <PreviewList title="Prioridades" items={draft.priorities} />
              <PreviewList title="Não-negociáveis" items={draft.nonNegotiables} empty="Sem limites definidos." />
              <PreviewList title="O que não repetir" items={draft.avoidRepeating ? [draft.avoidRepeating] : []} empty="Sem padrão definido." />
              <PreviewList title="Regras de decisão" items={decisionRules} empty="Sem regras definidas." />
              <PreviewList
                title="Métricas"
                items={activeOperatingTargets.map(
                  (target) => `${target.label}: ${target.targetValue} ${target.unit} ${cadenceLabels[target.cadence]}`,
                )}
                empty="Sem métricas anuais definidas."
              />
            </div>
          ) : null}
        </div>

        {effectiveSaveState === "error" && validationMessage ? (
          <p className={styles.modalError}>{validationMessage}</p>
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
            disabled={effectiveSaveState === "saving" || !canContinue}
            type="button"
            onClick={continueOrSave}
          >
            {step === steps.length - 1 ? (
              <>
                <Save size={14} aria-hidden="true" />
                {effectiveSaveState === "saving" ? "A guardar..." : "Guardar direção"}
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

function CoachHint({ examples, label }: { examples: string[]; label: string }) {
  return (
    <details className={styles.coachHint}>
      <summary>
        <Sparkles size={14} aria-hidden="true" />
        {label}
      </summary>
      <div>
        {examples.slice(0, 4).map((example) => (
          <p key={example}>{example}</p>
        ))}
      </div>
    </details>
  );
}

function WizardRows({
  addLabel,
  countLabel,
  icon,
  items,
  placeholders,
  removeDisabled = false,
  title,
  onAdd,
  onRemove,
  onUpdate,
}: {
  addLabel: string;
  countLabel?: string;
  icon?: "check" | "rule";
  items: string[];
  placeholders: string[];
  removeDisabled?: boolean;
  title: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
}) {
  return (
    <section className={styles.wizardRows}>
      <header>
        <strong>{title}</strong>
        {countLabel ? <span>{countLabel}</span> : null}
      </header>
      <div className={styles.list}>
        {items.length ? (
          items.map((item, index) => (
            <div className={styles.row} key={`${title}-${index}`}>
              <span>{icon === "check" ? <Check size={13} aria-hidden="true" /> : icon === "rule" ? <Lightbulb size={13} aria-hidden="true" /> : index + 1}</span>
              <input
                value={item}
                onChange={(event) => onUpdate(index, event.target.value)}
                placeholder={placeholders[index % placeholders.length]}
              />
              <button
                aria-label="Remover"
                disabled={removeDisabled}
                type="button"
                onClick={() => onRemove(index)}
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))
        ) : (
          <p className={styles.quietText}>Ainda sem itens.</p>
        )}
      </div>
      <button className={styles.addButton} type="button" onClick={onAdd}>
        <Plus size={14} aria-hidden="true" />
        {addLabel}
      </button>
    </section>
  );
}

function PreviewList({ title, items, empty = "Sem itens." }: { title: string; items: string[]; empty?: string }) {
  const visibleItems = items.map((item) => item.trim()).filter(Boolean);

  return (
    <section className={styles.previewSection}>
      <span>{title}</span>
      {visibleItems.length ? (
        <ul>
          {visibleItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </section>
  );
}

function OperatingTargetsEditor({
  activeOperatingTargets,
  effectiveOperatingSaveState,
  operatingDraft,
  operatingTargets,
  operatingValidationMessage,
  showEffectiveFrom,
  onCancelOperatingTarget,
  onEditOperatingTarget,
  onSaveOperatingTarget,
  onSetOperatingDraft,
  onSetShowEffectiveFrom,
  onStartOperatingTarget,
}: {
  activeOperatingTargets: OperatingTarget[];
  effectiveOperatingSaveState: SaveState;
  operatingDraft: OperatingTargetDraft | null;
  operatingTargets: OperatingTarget[];
  operatingValidationMessage: string | null;
  showEffectiveFrom: boolean;
  onCancelOperatingTarget: () => void;
  onEditOperatingTarget: (target: OperatingTarget) => void;
  onSaveOperatingTarget: () => Promise<void>;
  onSetOperatingDraft: Dispatch<SetStateAction<OperatingTargetDraft | null>>;
  onSetShowEffectiveFrom: Dispatch<SetStateAction<boolean>>;
  onStartOperatingTarget: (metricKey?: string) => void;
}) {
  return (
    <section className={styles.metricsStep}>
      {activeOperatingTargets.length ? (
        <div className={styles.operatingList}>
          {activeOperatingTargets.map((target) => {
            const Icon = getOperatingTargetIcon(target.category);
            const history = getInactiveVersions(operatingTargets, target.metricKey);

            return (
              <div className={styles.operatingItem} key={target.metricKey}>
                <div className={styles.operatingMain}>
                  <span className={styles.operatingIcon}>
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{target.label}</strong>
                    <small>
                      {target.targetValue} {target.unit} {cadenceLabels[target.cadence]} desde{" "}
                      {formatDateLabel(target.effectiveFrom)}
                    </small>
                  </div>
                </div>
                <span className={styles.categoryTag}>{categoryLabels[target.category]}</span>
                <button className={styles.textButton} type="button" onClick={() => onEditOperatingTarget(target)}>
                  Ajustar
                </button>
                {history.length ? (
                  <details className={styles.historyDetails}>
                    <summary>Histórico</summary>
                    <ul>
                      {history.map((version) => (
                        <li key={`${version.metricKey}-${version.effectiveFrom}-${version.updatedAt}`}>
                          {version.targetValue} {version.unit} {cadenceLabels[version.cadence]} desde{" "}
                          {formatDateLabel(version.effectiveFrom)}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.operatingEmpty}>
          <Gauge size={18} aria-hidden="true" />
          <p>Adiciona métricas base como grind, estudo, reviews, coaching ou dias off.</p>
        </div>
      )}

      {operatingDraft ? (
        <div className={styles.operatingForm}>
          <div className={styles.formGrid}>
            <label>
              Métrica
              <select
                value={
                  operatingTargetPresets.some((preset) => preset.metricKey === operatingDraft.metricKey)
                    ? operatingDraft.metricKey
                    : "custom"
                }
                onChange={(event) => onStartOperatingTarget(event.target.value)}
              >
                {operatingTargetPresets.map((preset) => (
                  <option key={preset.metricKey} value={preset.metricKey}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nome
              <input
                value={operatingDraft.label}
                onChange={(event) =>
                  onSetOperatingDraft((current) => current ? { ...current, label: event.target.value } : current)
                }
                placeholder="Exemplo: Dias de grind por mês"
              />
            </label>
            <label>
              Valor
              <input
                min="1"
                type="number"
                value={operatingDraft.targetValue}
                onChange={(event) =>
                  onSetOperatingDraft((current) => current ? { ...current, targetValue: Number(event.target.value) } : current)
                }
              />
            </label>
            <label>
              Unidade
              <input
                value={operatingDraft.unit}
                onChange={(event) =>
                  onSetOperatingDraft((current) => current ? { ...current, unit: event.target.value } : current)
                }
                placeholder="dias, torneios, reviews..."
              />
            </label>
            <label>
              Cadência
              <select
                value={operatingDraft.cadence}
                onChange={(event) =>
                  onSetOperatingDraft((current) =>
                    current ? { ...current, cadence: event.target.value as OperatingTargetCadence } : current,
                  )
                }
              >
                <option value="monthly">por mês</option>
                <option value="weekly">por semana</option>
              </select>
            </label>
            <label>
              Categoria
              <select
                value={operatingDraft.category}
                onChange={(event) =>
                  onSetOperatingDraft((current) =>
                    current ? { ...current, category: event.target.value as OperatingTargetCategory } : current,
                  )
                }
              >
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button className={styles.textButton} type="button" onClick={() => onSetShowEffectiveFrom((value) => !value)}>
            {showEffectiveFrom ? "Ocultar data de início" : "Alterar data de início"}
          </button>
          {showEffectiveFrom ? (
            <label className={styles.dateField}>
              Aplicável desde
              <input
                type="date"
                value={operatingDraft.effectiveFrom}
                onChange={(event) =>
                  onSetOperatingDraft((current) => current ? { ...current, effectiveFrom: event.target.value } : current)
                }
              />
            </label>
          ) : (
            <p className={styles.quietText}>Aplicável desde {formatDateLabel(operatingDraft.effectiveFrom)}.</p>
          )}
          {effectiveOperatingSaveState === "error" ? (
            <p className={styles.errorText}>
              {operatingValidationMessage ?? "Não foi possível guardar esta métrica."}
            </p>
          ) : null}
          <div className={styles.operatingActions}>
            <button className="ep-button secondary" type="button" onClick={onCancelOperatingTarget}>
              Cancelar métrica
            </button>
            <button className="ep-button primary" type="button" onClick={onSaveOperatingTarget}>
              <Save size={14} aria-hidden="true" />
              Guardar métrica
            </button>
          </div>
        </div>
      ) : (
        <button className={styles.addButton} type="button" onClick={() => onStartOperatingTarget()}>
          <Plus size={14} aria-hidden="true" />
          Adicionar métrica
        </button>
      )}
    </section>
  );
}
