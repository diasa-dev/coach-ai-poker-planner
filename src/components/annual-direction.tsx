"use client";

import {
  AlertCircle,
  ArrowRight,
  Check,
  Compass,
  Edit3,
  Lightbulb,
  Lock,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
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

type AnnualDirectionWorkspaceProps = {
  demoReason?: string;
  hasPersistence: boolean;
  initialPlan: AnnualPlanRecord | null;
  onSave?: (plan: AnnualPlanForm) => Promise<void>;
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

function normalizePlan(plan: AnnualPlanForm): AnnualPlanForm {
  return {
    primaryDirection: plan.primaryDirection.trim(),
    priorities: plan.priorities.map((priority) => priority.trim()).filter(Boolean).slice(0, 4),
    nonNegotiables: plan.nonNegotiables.map((rule) => rule.trim()).filter(Boolean),
    avoidRepeating: plan.avoidRepeating.trim(),
    decisionRule: plan.decisionRule.trim(),
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

export function AnnualDirection() {
  if (!hasPersistenceConfig) {
    return (
      <AnnualDirectionWorkspace
        demoReason="Clerk ou Convex ainda não estão configurados. A direção fica apenas neste draft local."
        hasPersistence={false}
        initialPlan={null}
        saveState="idle"
        year={currentYear}
      />
    );
  }

  return <PersistedAnnualDirection />;
}

function PersistedAnnualDirection() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const annualPlan = useQuery(
    api.annualPlan.getCurrent,
    isAuthenticated ? { year: currentYear } : "skip",
  );
  const saveAnnualPlan = useMutation(api.annualPlan.save);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  if (isLoading || (isAuthenticated && annualPlan === undefined)) {
    return (
      <section className="ep-page">
        <div className={styles.loadingState}>A carregar direção anual...</div>
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <AnnualDirectionWorkspace
        demoReason="Sessão não iniciada. Estás a ver um draft local; entra para guardar a direção no Convex."
        hasPersistence={false}
        initialPlan={null}
        saveState="idle"
        year={currentYear}
      />
    );
  }

  const workspaceKey = annualPlan
    ? `${annualPlan._id}:${annualPlan.updatedAt}`
    : `empty:${currentYear}`;

  return (
    <AnnualDirectionWorkspace
      key={workspaceKey}
      hasPersistence
      initialPlan={annualPlan ?? null}
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
      saveState={saveState}
      year={currentYear}
    />
  );
}

function AnnualDirectionWorkspace({
  demoReason,
  hasPersistence,
  initialPlan,
  onSave,
  saveState = "idle",
  year,
}: AnnualDirectionWorkspaceProps) {
  const initialFormPlan = initialPlan ?? emptyPlan;
  const [plan, setPlan] = useState<AnnualPlanForm>(initialFormPlan);
  const [draft, setDraft] = useState<AnnualPlanForm>(initialFormPlan);
  const [mode, setMode] = useState<"read" | "edit" | "empty">(initialPlan ? "read" : "empty");
  const [localSaveState, setLocalSaveState] = useState<SaveState>(saveState);

  const effectiveSaveState = localSaveState === "idle" ? saveState : localSaveState;
  const isEditing = mode === "edit";
  const visiblePlan = isEditing ? draft : plan;
  const hasSavedPlan = Boolean(plan.primaryDirection.trim());

  const validationMessage = useMemo(() => {
    const normalized = normalizePlan(draft);

    if (!normalized.primaryDirection) return "Escreve a direção principal do ano.";
    if (normalized.priorities.length < 2) return "Adiciona pelo menos 2 prioridades.";
    if (normalized.priorities.length > 4) return "Podes ter no máximo 4 prioridades.";

    return null;
  }, [draft]);

  const startEditing = () => {
    setDraft(hasSavedPlan ? plan : emptyPlan);
    setMode("edit");
    setLocalSaveState("dirty");
  };

  const cancelEditing = () => {
    setDraft(plan);
    setMode(hasSavedPlan ? "read" : "empty");
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
    setDraft((current) => ({ ...current, priorities: [...current.priorities, ""] }));
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
    setDraft((current) => ({ ...current, nonNegotiables: [...current.nonNegotiables, ""] }));
    markDirty();
  };

  const removeNonNegotiable = (index: number) => {
    setDraft((current) => ({
      ...current,
      nonNegotiables: current.nonNegotiables.filter((_, ruleIndex) => ruleIndex !== index),
    }));
    markDirty();
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
    </section>
  );
}
