"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type QuickNote = {
  id: string;
  label: string;
  note: string;
};

const noteTemplates = ["ICM", "Bad beat", "Autopilot", "Dúvida river", "Mesa extra", "Cansaço"];

export function LiveSession() {
  const [markedHands, setMarkedHands] = useState(0);
  const [tiltCount, setTiltCount] = useState(0);
  const [lowEnergyCount, setLowEnergyCount] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(noteTemplates[0]);
  const [noteText, setNoteText] = useState("");
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);

  const coachMessage = useMemo(() => {
    if (tiltCount >= 2) {
      return "2 sinais de tilt. Volta à regra de qualidade.";
    }

    if (lowEnergyCount >= 1) {
      return "Energia baixa registada. Evita abrir mesas extra.";
    }

    if (markedHands >= 5) {
      return "Já marcaste 5 mãos. Chega para review, agora volta ao foco.";
    }

    return "Mantém o plano simples: qualidade de decisão antes de volume.";
  }, [lowEnergyCount, markedHands, tiltCount]);

  function addQuickNote() {
    const trimmedNote = noteText.trim();

    setQuickNotes((currentNotes) => [
      {
        id: `note-${Date.now()}`,
        label: selectedTemplate,
        note: trimmedNote,
      },
      ...currentNotes,
    ]);
    setNoteText("");
  }

  return (
    <main className="live-shell">
      <header className="live-topbar">
        <div>
          <span className="eyebrow">Sessão ao vivo</span>
          <h1>Captura rápida</h1>
        </div>
        <div className="live-topbar-actions">
          <Link className="secondary-button" href="/session/prepare">
            Preparação
          </Link>
          <button
            className="primary-button danger-button"
            type="button"
            onClick={() => setSessionEnded(true)}
          >
            Terminar sessão
          </button>
        </div>
      </header>

      <section className="live-plan-strip" aria-label="Plano da sessão">
        <div>
          <span>Foco</span>
          <strong>ICM calmo no late game</strong>
        </div>
        <div>
          <span>Mesas máx.</span>
          <strong>6</strong>
        </div>
        <div>
          <span>Regra</span>
          <strong>Decisão de qualidade &gt; volume.</strong>
        </div>
      </section>

      <section className="live-grid">
        <div className="live-capture">
          <section className="panel live-actions-panel">
            <div className="panel-heading">
              <div>
                <h2>Eventos</h2>
                <p>Um toque e volta ao jogo.</p>
              </div>
            </div>
            <div className="live-action-grid">
              <button
                className="live-action-button mark-hand"
                type="button"
                onClick={() => setMarkedHands((count) => count + 1)}
              >
                <span>Marcar mão</span>
                <strong>{markedHands}</strong>
              </button>
              <button
                className="live-action-button tilt"
                type="button"
                onClick={() => setTiltCount((count) => count + 1)}
              >
                <span>Tilt +1</span>
                <strong>{tiltCount}</strong>
              </button>
              <button
                className="live-action-button energy"
                type="button"
                onClick={() => setLowEnergyCount((count) => count + 1)}
              >
                <span>Energia baixa</span>
                <strong>{lowEnergyCount}</strong>
              </button>
            </div>
          </section>

          <section className="panel quick-note-panel">
            <div className="panel-heading">
              <div>
                <h2>Nota rápida</h2>
                <p>Template + detalhe curto opcional.</p>
              </div>
            </div>
            <div className="note-template-grid">
              {noteTemplates.map((template) => (
                <button
                  className={selectedTemplate === template ? "note-template active" : "note-template"}
                  key={template}
                  type="button"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {template}
                </button>
              ))}
            </div>
            <div className="quick-note-compose">
              <input
                maxLength={120}
                placeholder="Detalhe curto..."
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
              />
              <button className="primary-button" type="button" onClick={addQuickNote}>
                Guardar nota
              </button>
            </div>
          </section>
        </div>

        <aside className="live-side">
          <section className="panel live-state-card">
            <h2>Estado</h2>
            <div className="live-state-grid">
              <div>
                <span>Mãos</span>
                <strong>{markedHands}</strong>
              </div>
              <div>
                <span>Tilt</span>
                <strong>{tiltCount}</strong>
              </div>
              <div>
                <span>Energia baixa</span>
                <strong>{lowEnergyCount}</strong>
              </div>
            </div>
          </section>

          <section className="panel live-coach-card">
            <span className="eyebrow">Coach AI</span>
            <p>{coachMessage}</p>
          </section>

          <section className="panel recent-notes-card">
            <h2>Notas recentes</h2>
            {quickNotes.length === 0 ? (
              <p>Ainda sem notas nesta sessão.</p>
            ) : (
              <ul>
                {quickNotes.slice(0, 3).map((note) => (
                  <li key={note.id}>
                    <strong>{note.label}</strong>
                    {note.note ? <span>{note.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {sessionEnded ? (
            <section className="panel live-ended-card">
              <strong>Sessão terminada.</strong>
              <p>Próximo passo: review pós-sessão.</p>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
