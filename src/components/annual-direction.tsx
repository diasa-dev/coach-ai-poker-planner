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
import { useMemo, useState } from "react";

import styles from "./annual-direction.module.css";

type AnnualPlan = {
  primaryDirection: string;
  priorities: string[];
  constraints: string[];
  avoidRepeating: string;
};

const savedPlan: AnnualPlan = {
  primaryDirection: "Construir uma rotina profissional sustentável sem compensar volume com cansaço.",
  priorities: [
    "Estudo antes de aumentar grind",
    "Review semanal sem falhar",
    "Proteger energia para domingo",
  ],
  constraints: [
    "Não jogar sessões longas com sono fraco.",
    "Sexta continua leve para recuperar.",
  ],
  avoidRepeating: "Compensar semanas fracas com volume irrealista na semana seguinte.",
};

function normalizePlan(plan: AnnualPlan): AnnualPlan {
  return {
    primaryDirection: plan.primaryDirection.trim(),
    priorities: plan.priorities.map((priority) => priority.trim()).filter(Boolean).slice(0, 4),
    constraints: plan.constraints.map((constraint) => constraint.trim()).filter(Boolean),
    avoidRepeating: plan.avoidRepeating.trim(),
  };
}

export function AnnualDirection() {
  const [plan, setPlan] = useState<AnnualPlan>(savedPlan);
  const [draft, setDraft] = useState<AnnualPlan>(savedPlan);
  const [mode, setMode] = useState<"read" | "edit" | "empty">("read");
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "error">("saved");

  const isEditing = mode === "edit" || mode === "empty";
  const visiblePlan = isEditing ? draft : plan;

  const validationMessage = useMemo(() => {
    const normalized = normalizePlan(draft);

    if (!normalized.primaryDirection) return "Escreve a direção principal do ano.";
    if (normalized.priorities.length < 2) return "Adiciona pelo menos 2 prioridades.";
    if (normalized.priorities.length > 4) return "Podes ter no máximo 4 prioridades.";

    return null;
  }, [draft]);

  const startEditing = () => {
    setDraft(plan);
    setMode("edit");
    setSaveState("dirty");
  };

  const cancelEditing = () => {
    setDraft(plan);
    setMode("read");
    setSaveState("saved");
  };

  const saveDirection = () => {
    if (validationMessage) {
      setSaveState("error");
      return;
    }

    const normalized = normalizePlan(draft);
    setPlan(normalized);
    setDraft(normalized);
    setMode("read");
    setSaveState("saved");
  };

  const updatePriority = (index: number, value: string) => {
    setDraft((current) => ({
      ...current,
      priorities: current.priorities.map((priority, priorityIndex) =>
        priorityIndex === index ? value : priority,
      ),
    }));
    setSaveState("dirty");
  };

  const addPriority = () => {
    if (draft.priorities.length >= 4) return;
    setDraft((current) => ({ ...current, priorities: [...current.priorities, ""] }));
    setSaveState("dirty");
  };

  const removePriority = (index: number) => {
    if (draft.priorities.length <= 2) return;
    setDraft((current) => ({
      ...current,
      priorities: current.priorities.filter((_, priorityIndex) => priorityIndex !== index),
    }));
    setSaveState("dirty");
  };

  const updateConstraint = (index: number, value: string) => {
    setDraft((current) => ({
      ...current,
      constraints: current.constraints.map((constraint, constraintIndex) =>
        constraintIndex === index ? value : constraint,
      ),
    }));
    setSaveState("dirty");
  };

  const addConstraint = () => {
    setDraft((current) => ({ ...current, constraints: [...current.constraints, ""] }));
    setSaveState("dirty");
  };

  const removeConstraint = (index: number) => {
    setDraft((current) => ({
      ...current,
      constraints: current.constraints.filter((_, constraintIndex) => constraintIndex !== index),
    }));
    setSaveState("dirty");
  };

  return (
    <section className="ep-page">
      <div className="ep-page-header">
        <div>
          <span>2026</span>
          <h1>Direção anual</h1>
          <p>Define o contexto que orienta os objetivos mensais e as decisões da semana.</p>
        </div>
        <div className="ep-page-actions">
          {isEditing ? (
            <>
              <button className="ep-button secondary" type="button" onClick={cancelEditing}>
                <X size={14} aria-hidden="true" />
                Cancelar
              </button>
              <button className="ep-button primary" type="button" onClick={saveDirection}>
                <Save size={14} aria-hidden="true" />
                Guardar direção
              </button>
            </>
          ) : (
            <button className="ep-button primary" type="button" onClick={startEditing}>
              <Edit3 size={14} aria-hidden="true" />
              Editar direção
            </button>
          )}
        </div>
      </div>

      {mode === "empty" ? (
        <article className={styles.emptyState}>
          <Compass size={22} aria-hidden="true" />
          <div>
            <h2>Ainda não definiste a direção anual.</h2>
            <p>Define uma direção simples para o ano antes de escolher o ritmo do mês.</p>
          </div>
        </article>
      ) : null}

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
                    setDraft((current) => ({ ...current, primaryDirection: event.target.value }));
                    setSaveState("dirty");
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
              {visiblePlan.constraints.length ? (
                visiblePlan.constraints.map((constraint, index) => (
                  <div className={styles.row} key={`constraint-${index}`}>
                    <span>
                      <Check size={13} aria-hidden="true" />
                    </span>
                    {isEditing ? (
                      <input
                        value={constraint}
                        onChange={(event) => updateConstraint(index, event.target.value)}
                        placeholder="Exemplo: não jogar sessões longas com sono fraco."
                      />
                    ) : (
                      <strong>{constraint}</strong>
                    )}
                    {isEditing ? (
                      <button
                        aria-label="Remover limite"
                        type="button"
                        onClick={() => removeConstraint(index)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className={styles.quietText}>Opcional, mas útil para evitar planos irrealistas.</p>
              )}
            </div>

            {isEditing ? (
              <button className={styles.addButton} type="button" onClick={addConstraint}>
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
                    setDraft((current) => ({ ...current, avoidRepeating: event.target.value }));
                    setSaveState("dirty");
                  }}
                  placeholder="Exemplo: compensar semanas fracas com volume irrealista."
                />
              </label>
            ) : (
              <p className={styles.quietText}>{visiblePlan.avoidRepeating}</p>
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
            <p>Nos Objetivos mensais, esta direção aparece como contexto para decidir o que este mês deve mover.</p>
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
            <p>O Coach pode desafiar pontos vagos ou irrealistas e detetar desalinhamento com objetivos mensais e plano semanal.</p>
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
              {saveState === "saved"
                ? "Guardado"
                : saveState === "dirty"
                  ? "Alterações por guardar"
                  : "Há campos em falta"}
            </strong>
            {saveState === "error" && validationMessage ? <p>{validationMessage}</p> : null}
            <small>Última atualização: hoje, 16:40</small>
          </article>
        </aside>
      </div>
    </section>
  );
}
