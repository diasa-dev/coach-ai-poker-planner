"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Recommendation = {
  state: "ready" | "restricted" | "not-recommended";
  label: string;
  reason: string;
};

const scoreFields = [
  ["sleep", "Sono"] as const,
  ["energy", "Energia"] as const,
  ["focus", "Foco"] as const,
  ["stress", "Stress"] as const,
  ["tiltRisk", "Risco de tilt"] as const,
];

const tablePresets = [2, 4, 6, 8];

const defaultIfThenPlans = [
  "Se sentir tilt depois de uma bad beat, então marco a mão e espero 60 segundos antes da próxima decisão marginal.",
  "Se energia cair para 2/5, então reduzo mesas no próximo break.",
];

export function SessionPrepare() {
  const router = useRouter();
  const [scores, setScores] = useState({
    sleep: 4,
    energy: 4,
    focus: 4,
    stress: 2,
    tiltRisk: 2,
  });
  const [decisionRisk, setDecisionRisk] = useState(
    "Aumentar mesas quando estiver card dead ou perder um pote grande.",
  );
  const [maxTables, setMaxTables] = useState(6);
  const [mainFocus, setMainFocus] = useState("ICM calmo no late game");
  const [qualityRule, setQualityRule] = useState("Decisão de qualidade > volume.");
  const [ifThenPlans, setIfThenPlans] = useState(defaultIfThenPlans);
  const [overrideReason, setOverrideReason] = useState("");
  const [savedState, setSavedState] = useState<"idle" | "prepared" | "active">("idle");

  const readiness = useMemo(() => {
    const rawScore =
      ((scores.sleep + scores.energy + scores.focus + (6 - scores.stress) + (6 - scores.tiltRisk)) /
        25) *
      100;
    return Math.round(rawScore);
  }, [scores]);

  const recommendation = useMemo<Recommendation>(() => {
    if (readiness < 58 || scores.tiltRisk >= 5 || scores.stress >= 5 || scores.energy <= 2) {
      return {
        state: "not-recommended",
        label: "Não recomendado começar agora",
        reason: "O estado atual aumenta o risco de decisões automáticas.",
      };
    }

    if (readiness < 78 || scores.tiltRisk >= 4 || scores.stress >= 4 || scores.sleep <= 3) {
      return {
        state: "restricted",
        label: "Jogar com restrições",
        reason: "Começa com limites claros e reduz volume se a qualidade cair.",
      };
    }

    return {
      state: "ready",
      label: "Pronto para jogar",
      reason: "A prontidão está estável para iniciar com intenção.",
    };
  }, [readiness, scores.energy, scores.sleep, scores.stress, scores.tiltRisk]);

  const canStart = recommendation.state !== "not-recommended" || overrideReason.trim().length >= 8;

  function updateScore(key: keyof typeof scores, value: number) {
    setScores((currentScores) => ({
      ...currentScores,
      [key]: value,
    }));
  }

  function updatePlan(index: number, value: string) {
    setIfThenPlans((currentPlans) =>
      currentPlans.map((plan, currentIndex) => (currentIndex === index ? value : plan)),
    );
  }

  function addPlan() {
    setIfThenPlans((currentPlans) => [
      ...currentPlans,
      "Se aparecer um sinal de risco, então paro e volto à regra de qualidade.",
    ]);
  }

  return (
    <main className="prepare-shell">
      <header className="prepare-topbar">
        <div>
          <span className="eyebrow">Preparação</span>
          <h1>Preparar sessão</h1>
          <p>Define o estado, os limites e o plano mental antes de abrir mesas.</p>
        </div>
        <Link className="secondary-button" href="/">
          Voltar ao dashboard
        </Link>
      </header>

      <section className="prepare-grid">
        <div className="prepare-main">
          <section className="panel prepare-panel">
            <div className="panel-heading">
              <div>
                <h2>Prontidão</h2>
                <p>Snapshot rápido antes da sessão.</p>
              </div>
              <span className="count-pill">{readiness}/100</span>
            </div>
            <div className="prepare-score-grid">
              {scoreFields.map(([key, label]) => (
                <label key={key} className="prepare-score">
                  <span>
                    {label}
                    <strong>{scores[key]}/5</strong>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={scores[key]}
                    onChange={(event) => updateScore(key, Number(event.target.value))}
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="panel prepare-panel">
            <div className="panel-heading">
              <div>
                <h2>Plano da sessão</h2>
                <p>Decide os limites antes de estares envolvido no jogo.</p>
              </div>
            </div>
            <label className="wide-field">
              O que pode fazer a qualidade da tua decisão cair hoje?
              <textarea
                value={decisionRisk}
                onChange={(event) => setDecisionRisk(event.target.value)}
              />
            </label>
            <label className="wide-field">
              Foco principal da sessão
              <input value={mainFocus} onChange={(event) => setMainFocus(event.target.value)} />
            </label>
            <div className="prepare-control-block">
              <span>Mesas máximas</span>
              <div className="table-presets">
                {tablePresets.map((preset) => (
                  <button
                    className={maxTables === preset ? "preset-button active" : "preset-button"}
                    key={preset}
                    type="button"
                    onClick={() => setMaxTables(preset)}
                  >
                    {preset}
                  </button>
                ))}
                <input
                  aria-label="Mesas máximas personalizadas"
                  min="1"
                  max="16"
                  type="number"
                  value={maxTables}
                  onChange={(event) => setMaxTables(Number(event.target.value))}
                />
              </div>
            </div>
          </section>

          <section className="panel prepare-panel">
            <div className="panel-heading">
              <div>
                <h2>Guardrails de performance</h2>
                <p>Transforma intenção em regras concretas.</p>
              </div>
            </div>
            <label className="wide-field">
              Regra de qualidade
              <input value={qualityRule} onChange={(event) => setQualityRule(event.target.value)} />
            </label>
            <div className="if-then-list">
              {ifThenPlans.map((plan, index) => (
                <label key={index}>
                  Plano se/então {index + 1}
                  <textarea value={plan} onChange={(event) => updatePlan(index, event.target.value)} />
                </label>
              ))}
            </div>
            {ifThenPlans.length < 3 ? (
              <button className="secondary-button add-plan-button" type="button" onClick={addPlan}>
                Adicionar plano se/então
              </button>
            ) : null}
          </section>
        </div>

        <aside className="prepare-side">
          <section className={`panel recommendation-card ${recommendation.state}`}>
            <span className="eyebrow">Decisão</span>
            <strong>{recommendation.label}</strong>
            <p>{recommendation.reason}</p>
            <div className="recommendation-score">
              <span>Prontidão</span>
              <strong>{readiness}</strong>
            </div>
            {recommendation.state === "not-recommended" ? (
              <label className="override-field">
                Motivo para começar apesar do aviso
                <textarea
                  placeholder="Quero começar apesar do aviso porque..."
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                />
              </label>
            ) : null}
          </section>

          <section className="panel prepare-summary">
            <h2>Resumo</h2>
            <dl>
              <div>
                <dt>Mesas máx.</dt>
                <dd>{maxTables || 1}</dd>
              </div>
              <div>
                <dt>Foco</dt>
                <dd>{mainFocus || "Por definir"}</dd>
              </div>
              <div>
                <dt>Risco de decisão</dt>
                <dd>{decisionRisk || "Por definir"}</dd>
              </div>
              <div>
                <dt>Regra</dt>
                <dd>{qualityRule || "Por definir"}</dd>
              </div>
            </dl>
            {savedState !== "idle" ? (
              <p className="save-status">
                {savedState === "prepared"
                  ? "Preparação guardada."
                  : "Sessão iniciada. Mantém os limites definidos."}
              </p>
            ) : null}
            <div className="prepare-actions">
              <button className="secondary-button" type="button" onClick={() => setSavedState("prepared")}>
                Guardar preparação
              </button>
              <button
                className="primary-button"
                disabled={!canStart}
                type="button"
                onClick={() => {
                  setSavedState("active");
                  router.push("/session/live");
                }}
              >
                Iniciar sessão
              </button>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
