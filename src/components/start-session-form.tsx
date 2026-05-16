"use client";

import { Check, Play, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import type { Id } from "../../convex/_generated/dataModel";
import type { PlanBlock } from "@/lib/planning/weekly-plan";
import styles from "./poker-sessions.module.css";

export type StartSessionPayload = {
  weeklyPlanBlockId?: Id<"weeklyPlanBlocks">;
  blockLabel?: string;
  sessionFocus: string;
  maxTables: number;
  energy: number | null;
  focusScore: number | null;
  tilt: number;
  microIntention?: string;
  replaceActive?: boolean;
};

type StartSessionFormProps = {
  actionIcon?: "check" | "play";
  actionLabel?: string;
  defaultFocus?: string;
  error?: string;
  grindBlocks: PlanBlock[];
  isSubmitting?: boolean;
  onCancel?: () => void;
  onErrorClear?: () => void;
  onSubmit: (payload: StartSessionPayload) => void;
  variant?: "modal" | "sidebar";
};

const neutralTilt = 0;
const defaultMaxTables = 6;

export function StartSessionForm({
  actionIcon = "play",
  actionLabel = "Iniciar sessão",
  defaultFocus = "Disciplina em ICM até bolha",
  error,
  grindBlocks,
  isSubmitting = false,
  onCancel,
  onErrorClear,
  onSubmit,
  variant = "modal",
}: StartSessionFormProps) {
  const suggestedFocus = defaultFocus.trim();
  const [sessionFocus, setSessionFocus] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("none");
  const [energy, setEnergy] = useState<number | null>(null);
  const [focusScore, setFocusScore] = useState<number | null>(null);
  const [qualityRule, setQualityRule] = useState("");
  const [qualityRules, setQualityRules] = useState<string[]>([]);
  const selectedBlock = grindBlocks.find((block) => block.id === selectedBlockId);
  const trimmedFocus = sessionFocus.trim();
  const trimmedQualityRule = qualityRule.trim();
  const Icon = actionIcon === "check" ? Check : Play;

  function addQualityRule() {
    if (!trimmedQualityRule) return;
    setQualityRules((currentRules) => [...currentRules, trimmedQualityRule]);
    setQualityRule("");
  }

  function submit() {
    if (!trimmedFocus) return;

    onSubmit({
      weeklyPlanBlockId: selectedBlock?.id as Id<"weeklyPlanBlocks"> | undefined,
      blockLabel: selectedBlock ? `Grind · ${selectedBlock.title}${selectedBlock.target ? ` (${selectedBlock.target})` : ""}` : undefined,
      sessionFocus: trimmedFocus,
      maxTables: defaultMaxTables,
      energy,
      focusScore,
      tilt: neutralTilt,
      microIntention: qualityRules.join(" · ") || undefined,
    });
  }

  return (
    <>
      <label className={variant === "sidebar" ? "field sidebar-session-focus" : styles.startFocusField}>
        Foco da sessão
        <textarea
          aria-invalid={!trimmedFocus}
          autoFocus
          required
          rows={3}
          placeholder={suggestedFocus || "Define o foco desta sessão"}
          value={sessionFocus}
          onChange={(event) => {
            setSessionFocus(event.target.value);
            onErrorClear?.();
          }}
        />
      </label>
      {suggestedFocus ? (
        <div className={styles.suggestedFocusBox}>
          <span>Sugestão Coach</span>
          <p>{suggestedFocus}</p>
          <button className="ep-button secondary" type="button" onClick={() => setSessionFocus(suggestedFocus)}>
            Sugestão Coach
          </button>
        </div>
      ) : null}

      {grindBlocks.length ? (
        <details className={styles.startDetails}>
          <summary>Associar ao plano semanal</summary>
          <label className={variant === "sidebar" ? "field" : styles.inlineField}>
            Bloco de grind <small>opcional</small>
            <select value={selectedBlockId} onChange={(event) => setSelectedBlockId(event.target.value)}>
              <option value="none">Não associar agora</option>
              {grindBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  Grind · {block.title}{block.target ? ` (${block.target})` : ""}
                </option>
              ))}
            </select>
          </label>
        </details>
      ) : null}

      <section className={styles.initialStateBox}>
        <header>
          <span>Estado pré-sessão</span>
          <small>opcional</small>
        </header>
        <div className={styles.ratingGrid}>
          <StartRating label="Energia" value={energy} onChange={setEnergy} />
          <StartRating label="Foco" value={focusScore} onChange={setFocusScore} />
        </div>
      </section>

      <section className={styles.startDetails}>
        <h3>Regra de qualidade opcional</h3>
        <div className={styles.qualityRuleComposer}>
          <label className={variant === "sidebar" ? "field" : styles.inlineField}>
            Regra para proteger a sessão
            <input
              placeholder="ex: Não pagar river sem motivo claro"
              value={qualityRule}
              onChange={(event) => setQualityRule(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addQualityRule();
                }
              }}
            />
          </label>
          <button className="ep-button secondary" type="button" disabled={!trimmedQualityRule} onClick={addQualityRule}>
            Adicionar regra
          </button>
        </div>
        {qualityRules.length ? (
          <ul className={styles.qualityRuleList} aria-label="Regras de qualidade adicionadas">
            {qualityRules.map((rule, index) => (
              <li key={`${rule}-${index}`}>
                <span>{rule}</span>
                <button
                  type="button"
                  onClick={() => setQualityRules((currentRules) => currentRules.filter((_, ruleIndex) => ruleIndex !== index))}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className={styles.localOnlyNote}>Fica ligada ao arranque da sessão.</p>
      </section>

      {error ? <p className={variant === "sidebar" ? "sidebar-session-error" : styles.actionError}>{error}</p> : null}

      <div className={variant === "sidebar" ? "sidebar-session-actions" : styles.modalActions}>
        {onCancel ? (
          <button className="ep-button secondary" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </button>
        ) : null}
        <button className="ep-button primary" type="button" disabled={isSubmitting || !trimmedFocus} onClick={submit}>
          <Icon size={15} aria-hidden="true" />
          {isSubmitting ? "A iniciar..." : actionLabel}
        </button>
      </div>
    </>
  );
}

export function SidebarStartSessionModal({
  grindBlocks,
  onClose,
  onStart,
}: {
  grindBlocks: PlanBlock[];
  onClose: () => void;
  onStart: (payload: StartSessionPayload) => Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(payload: StartSessionPayload) {
    setIsSubmitting(true);
    setError("");
    try {
      await onStart(payload);
    } catch {
      setError("Não foi possível iniciar a sessão. Tenta novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <>
      <button className="scrim" type="button" aria-label="Fechar início de sessão" onClick={onClose} />
      <section className="sidebar-session-modal" role="dialog" aria-modal="true" aria-label="Iniciar sessão">
        <header>
          <h2>Iniciar sessão</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="sidebar-session-body">
          <StartSessionForm
            actionIcon="check"
            error={error}
            grindBlocks={grindBlocks}
            isSubmitting={isSubmitting}
            onCancel={onClose}
            onErrorClear={() => setError("")}
            onSubmit={(payload) => void submit(payload)}
            variant="sidebar"
          />
        </div>
      </section>
    </>,
    document.body,
  );
}

function StartRating({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number | null) => void;
  value: number | null;
}) {
  return (
    <div className={styles.rating}>
      <span>{label}</span>
      <div>
        {[1, 2, 3, 4, 5].map((item) => (
          <button
            className={item === value ? styles.selectedRating : ""}
            key={item}
            type="button"
            onClick={() => onChange(item === value ? null : item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
