"use client";

import { Check, Play, X } from "lucide-react";
import { useState } from "react";

import type { Id } from "../../convex/_generated/dataModel";
import type { PlanBlock } from "@/lib/planning/weekly-plan";
import styles from "./poker-sessions.module.css";

export type StartSessionPayload = {
  weeklyPlanBlockId?: Id<"weeklyPlanBlocks">;
  blockLabel?: string;
  sessionFocus: string;
  maxTables: number;
  energy: number;
  focusScore: number;
  tilt: number;
  microIntention?: string;
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
  const [sessionFocus, setSessionFocus] = useState(defaultFocus);
  const [selectedBlockId, setSelectedBlockId] = useState(grindBlocks[0]?.id ?? "none");
  const [energy, setEnergy] = useState(4);
  const [focusScore, setFocusScore] = useState(4);
  const [microIntention, setMicroIntention] = useState("");
  const selectedBlock = grindBlocks.find((block) => block.id === selectedBlockId);
  const trimmedFocus = sessionFocus.trim();
  const Icon = actionIcon === "check" ? Check : Play;

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
      microIntention: microIntention.trim() || undefined,
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
          value={sessionFocus}
          onChange={(event) => {
            setSessionFocus(event.target.value);
            onErrorClear?.();
          }}
        />
      </label>

      {grindBlocks.length ? (
        <label className={variant === "sidebar" ? "field" : styles.inlineField}>
          Bloco associado <small>opcional</small>
          <select value={selectedBlockId} onChange={(event) => setSelectedBlockId(event.target.value)}>
            {grindBlocks.map((block) => (
              <option key={block.id} value={block.id}>
                Grind · {block.title}{block.target ? ` (${block.target})` : ""}
              </option>
            ))}
            <option value="none">Sem bloco associado</option>
          </select>
        </label>
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

      <label className={variant === "sidebar" ? "field" : styles.inlineField}>
        Micro-intenção <small>opcional</small>
        <input
          placeholder="ex: Não pagar river sem motivo"
          value={microIntention}
          onChange={(event) => setMicroIntention(event.target.value)}
        />
      </label>

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

  return (
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
    </>
  );
}

function StartRating({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
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
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
