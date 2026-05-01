"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ResultType = "positive" | "negative" | "breakEven" | "notSet";

const pendingHands = [
  {
    id: "hand-icm-aqo",
    label: "ICM",
    detail: "AQo BB vs BTN · decisão river",
  },
  {
    id: "hand-big-pot",
    label: "Big pot",
    detail: "Mesa 4 · pote grande em board dobrado",
  },
  {
    id: "hand-emotional",
    label: "Erro emocional",
    detail: "Call rápido depois de perder all-in",
  },
  {
    id: "hand-river",
    label: "River difícil",
    detail: "Bluff catch com blocker médio",
  },
];

const filteredTimeline = [
  "21:15 · Mão para rever · ICM · AQo BB vs BTN",
  "22:05 · Tilt 4/5",
  "22:18 · Energia 2/5",
  "22:55 · Micro-intenção · ICM consciente",
  "23:20 · Nota · Bad beat · Pote grande river",
];

export function PostSessionReview() {
  const [resultType, setResultType] = useState<ResultType>("notSet");
  const [resultNote, setResultNote] = useState("");
  const [focusFollowed, setFocusFollowed] = useState("Parcialmente. Mantive ICM calmo até ao segundo bloco.");
  const [decisionQualityDrop, setDecisionQualityDrop] = useState(
    "Depois do tilt 4/5 comecei a decidir mais rápido em spots marginais.",
  );
  const [bestDecision, setBestDecision] = useState(
    "Fold disciplinado no river quando a linha do adversário estava muito polarizada.",
  );
  const [handOrPatternToReview, setHandOrPatternToReview] = useState(
    "Spots ICM em BB vs BTN quando estou deep.",
  );
  const [nextAction, setNextAction] = useState(
    "Rever 3 mãos ICM antes da próxima sessão e criar uma regra para calls river.",
  );
  const [priorityHands, setPriorityHands] = useState<string[]>(["hand-icm-aqo", "hand-emotional"]);

  const resultLabel = {
    positive: "Positivo",
    negative: "Negativo",
    breakEven: "Break-even",
    notSet: "Não definido",
  }[resultType];

  const improvementPlan = useMemo(() => {
    const selectedHands = pendingHands
      .filter((hand) => priorityHands.includes(hand.id))
      .map((hand) => hand.label)
      .join(", ");

    return {
      summary: `Sessão com energia média 3/5, tilt pico 4/5 e ${pendingHands.length} mãos pendentes.`,
      pattern: handOrPatternToReview || "Padrão ainda por definir.",
      action: nextAction || "Definir uma próxima ação antes de fechar a review.",
      hands: selectedHands || "Escolhe 1-3 mãos prioritárias.",
    };
  }, [handOrPatternToReview, nextAction, priorityHands]);

  function togglePriorityHand(handId: string) {
    setPriorityHands((currentHands) => {
      if (currentHands.includes(handId)) {
        return currentHands.filter((id) => id !== handId);
      }

      if (currentHands.length >= 3) {
        return currentHands;
      }

      return [...currentHands, handId];
    });
  }

  return (
    <main className="review-shell">
      <header className="review-topbar">
        <div>
          <span className="eyebrow">Review pós-sessão</span>
          <h1>Fechar ciclo de aprendizagem</h1>
          <p>Transforma a sessão em mãos prioritárias, padrão principal e uma próxima ação.</p>
        </div>
        <Link className="secondary-button" href="/session/live">
          Voltar à sessão
        </Link>
      </header>

      <section className="review-grid">
        <div className="review-main">
          <section className="panel review-summary-panel">
            <div className="panel-heading">
              <div>
                <h2>Resumo automático</h2>
                <p>Contexto filtrado da sessão ao vivo.</p>
              </div>
            </div>
            <div className="review-metric-grid">
              <div>
                <span>Mãos pendentes</span>
                <strong>{pendingHands.length}</strong>
              </div>
              <div>
                <span>Energia média</span>
                <strong>3/5</strong>
              </div>
              <div>
                <span>Tilt pico</span>
                <strong>4/5</strong>
              </div>
            </div>
            <ul className="filtered-timeline">
              {filteredTimeline.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
          </section>

          <section className="panel review-panel">
            <div className="panel-heading">
              <div>
                <h2>Perguntas de performance</h2>
                <p>Curto, específico e orientado para ação.</p>
              </div>
            </div>
            <div className="review-question-list">
              <label>
                Cumpriste o foco principal?
                <textarea value={focusFollowed} onChange={(event) => setFocusFollowed(event.target.value)} />
              </label>
              <label>
                Onde a qualidade da decisão caiu?
                <textarea
                  value={decisionQualityDrop}
                  onChange={(event) => setDecisionQualityDrop(event.target.value)}
                />
              </label>
              <label>
                Qual foi a melhor decisão?
                <textarea value={bestDecision} onChange={(event) => setBestDecision(event.target.value)} />
              </label>
              <label>
                Qual mão/padrão tens de rever?
                <textarea
                  value={handOrPatternToReview}
                  onChange={(event) => setHandOrPatternToReview(event.target.value)}
                />
              </label>
              <label>
                Qual é a próxima ação?
                <textarea value={nextAction} onChange={(event) => setNextAction(event.target.value)} />
              </label>
            </div>
          </section>

          <section className="panel review-panel">
            <div className="panel-heading">
              <div>
                <h2>Mãos prioritárias</h2>
                <p>Escolhe 1-3 para rever primeiro.</p>
              </div>
              <span className="count-pill">{priorityHands.length}/3</span>
            </div>
            <div className="priority-hand-list">
              {pendingHands.map((hand) => (
                <button
                  className={priorityHands.includes(hand.id) ? "priority-hand active" : "priority-hand"}
                  key={hand.id}
                  type="button"
                  onClick={() => togglePriorityHand(hand.id)}
                >
                  <span>{hand.label}</span>
                  <strong>{hand.detail}</strong>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="review-side">
          <section className="panel review-result-card">
            <h2>Resultado opcional</h2>
            <div className="result-choice-grid">
              {[
                ["positive", "Positivo"] as const,
                ["negative", "Negativo"] as const,
                ["breakEven", "Break-even"] as const,
              ].map(([value, label]) => (
                <button
                  className={resultType === value ? "result-choice active" : "result-choice"}
                  key={value}
                  type="button"
                  onClick={() => setResultType(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <label>
              Nota curta
              <input
                placeholder="Opcional..."
                value={resultNote}
                onChange={(event) => setResultNote(event.target.value)}
              />
            </label>
          </section>

          <section className="panel improvement-card">
            <span className="eyebrow">Plano de melhoria</span>
            <div>
              <span>Resumo</span>
              <p>{improvementPlan.summary}</p>
            </div>
            <div>
              <span>Padrão principal</span>
              <p>{improvementPlan.pattern}</p>
            </div>
            <div>
              <span>Ação</span>
              <p>{improvementPlan.action}</p>
            </div>
            <div>
              <span>Mãos prioritárias</span>
              <p>{improvementPlan.hands}</p>
            </div>
            <div>
              <span>Resultado</span>
              <p>{resultLabel}{resultNote ? ` · ${resultNote}` : ""}</p>
            </div>
          </section>

          <Link className="primary-button full" href="/">
            Fechar review
          </Link>
        </aside>
      </section>
    </main>
  );
}
