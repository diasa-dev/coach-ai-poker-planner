"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type TimelineEvent = {
  id: string;
  type: "hand" | "tilt" | "energy" | "intention" | "note";
  label: string;
  detail?: string;
  value?: number;
  createdAt: string;
};

const handTemplates = [
  "ICM",
  "Big pot",
  "Bluff catch",
  "All-in marginal",
  "River difícil",
  "Exploit / read",
  "Erro emocional",
];
const intentionTemplates = [
  "Mais calma",
  "Menos mesas",
  "ICM consciente",
  "Sem autopilot",
  "Decisões mais lentas",
  "Proteger energia",
];
const noteTemplates = ["ICM", "Bad beat", "Autopilot", "Dúvida river", "Mesa extra", "Cansaço"];

function currentTime() {
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export function LiveSession() {
  const [currentTilt, setCurrentTilt] = useState(0);
  const [currentEnergy, setCurrentEnergy] = useState(4);
  const [tiltValues, setTiltValues] = useState<number[]>([]);
  const [energyValues, setEnergyValues] = useState<number[]>([4]);
  const [handTemplate, setHandTemplate] = useState(handTemplates[0]);
  const [handNote, setHandNote] = useState("");
  const [intentionTemplate, setIntentionTemplate] = useState(intentionTemplates[3]);
  const [microIntention, setMicroIntention] = useState("Sem autopilot em spots ICM.");
  const [noteTemplate, setNoteTemplate] = useState(noteTemplates[0]);
  const [noteText, setNoteText] = useState("");
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [sessionEnded, setSessionEnded] = useState(false);

  const pendingHands = timeline.filter((event) => event.type === "hand").length;
  const tiltPeak = tiltValues.length > 0 ? Math.max(...tiltValues) : currentTilt;
  const energyAverage = Math.round(
    energyValues.reduce((total, value) => total + value, 0) / energyValues.length,
  );

  const coachMessage = useMemo(() => {
    if (currentTilt >= 4) {
      return "Tilt 4/5. Volta à regra de qualidade.";
    }

    if (energyAverage <= 2) {
      return "Energia média 2/5. Evita abrir mesas extra.";
    }

    if (pendingHands >= 5) {
      return "Já tens 5 mãos para review. Agora volta ao foco.";
    }

    return "Mantém o plano simples: qualidade de decisão antes de volume.";
  }, [currentTilt, energyAverage, pendingHands]);

  function addEvent(event: Omit<TimelineEvent, "id" | "createdAt">) {
    setTimeline((currentTimeline) => [
      {
        ...event,
        id: `event-${Date.now()}`,
        createdAt: currentTime(),
      },
      ...currentTimeline,
    ]);
  }

  function setTilt(value: number) {
    setCurrentTilt(value);
    setTiltValues((values) => [...values, value]);
    addEvent({
      type: "tilt",
      label: `Tilt ${value}/5`,
      value,
    });
  }

  function setEnergy(value: number) {
    setCurrentEnergy(value);
    setEnergyValues((values) => [...values, value]);
    addEvent({
      type: "energy",
      label: `Energia ${value}/5`,
      value,
    });
  }

  function addHandToReview() {
    const trimmedNote = handNote.trim();

    addEvent({
      type: "hand",
      label: `Mão para rever · ${handTemplate}`,
      detail: trimmedNote,
    });
    setHandNote("");
  }

  function saveMicroIntention() {
    const intention = microIntention.trim() || intentionTemplate;

    addEvent({
      type: "intention",
      label: "Micro-intenção",
      detail: intention,
    });
    setMicroIntention(intention);
  }

  function addQuickNote() {
    const trimmedNote = noteText.trim();

    addEvent({
      type: "note",
      label: `Nota · ${noteTemplate}`,
      detail: trimmedNote,
    });
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
                <h2>Estado atual</h2>
                <p>Regista só quando muda de forma relevante.</p>
              </div>
            </div>
            <div className="state-scale-grid">
              <div className="state-scale">
                <span>Tilt</span>
                <div>
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <button
                      className={currentTilt === value ? "scale-button active tilt" : "scale-button"}
                      key={value}
                      type="button"
                      onClick={() => setTilt(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="state-scale">
                <span>Energia</span>
                <div>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      className={currentEnergy === value ? "scale-button active energy" : "scale-button"}
                      key={value}
                      type="button"
                      onClick={() => setEnergy(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="panel quick-note-panel">
            <div className="panel-heading">
              <div>
                <h2>Mão para rever</h2>
                <p>Cria uma pendência sem substituir tracker ou prints.</p>
              </div>
            </div>
            <div className="note-template-grid hand-template-grid">
              {handTemplates.map((template) => (
                <button
                  className={handTemplate === template ? "note-template active" : "note-template"}
                  key={template}
                  type="button"
                  onClick={() => setHandTemplate(template)}
                >
                  {template}
                </button>
              ))}
            </div>
            <div className="quick-note-compose">
              <input
                maxLength={120}
                placeholder="Ex: Mesa 4, AQo BB vs BTN"
                value={handNote}
                onChange={(event) => setHandNote(event.target.value)}
              />
              <button className="primary-button" type="button" onClick={addHandToReview}>
                Guardar mão
              </button>
            </div>
          </section>

          <section className="panel quick-note-panel">
            <div className="panel-heading">
              <div>
                <h2>Micro-intenção</h2>
                <p>Usa no break para recentrar o próximo bloco.</p>
              </div>
            </div>
            <div className="note-template-grid">
              {intentionTemplates.map((template) => (
                <button
                  className={intentionTemplate === template ? "note-template active" : "note-template"}
                  key={template}
                  type="button"
                  onClick={() => {
                    setIntentionTemplate(template);
                    setMicroIntention(template);
                  }}
                >
                  {template}
                </button>
              ))}
            </div>
            <div className="quick-note-compose">
              <input
                maxLength={120}
                value={microIntention}
                onChange={(event) => setMicroIntention(event.target.value)}
              />
              <button className="primary-button" type="button" onClick={saveMicroIntention}>
                Guardar intenção
              </button>
            </div>
          </section>

          <section className="panel quick-note-panel">
            <div className="panel-heading">
              <div>
                <h2>Nota rápida</h2>
                <p>Contexto curto para algo inesperado.</p>
              </div>
            </div>
            <div className="note-template-grid">
              {noteTemplates.map((template) => (
                <button
                  className={noteTemplate === template ? "note-template active" : "note-template"}
                  key={template}
                  type="button"
                  onClick={() => setNoteTemplate(template)}
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
                <span>Mãos pendentes</span>
                <strong>{pendingHands}</strong>
              </div>
              <div>
                <span>Tilt atual</span>
                <strong>{currentTilt}/5</strong>
              </div>
              <div>
                <span>Energia atual</span>
                <strong>{currentEnergy}/5</strong>
              </div>
              <div>
                <span>Energia média</span>
                <strong>{energyAverage}/5</strong>
              </div>
              <div>
                <span>Tilt pico</span>
                <strong>{tiltPeak}/5</strong>
              </div>
            </div>
          </section>

          <section className="panel live-coach-card">
            <span className="eyebrow">Coach AI</span>
            <p>{coachMessage}</p>
          </section>

          <section className="panel recent-notes-card">
            <h2>Timeline recente</h2>
            {timeline.length === 0 ? (
              <p>Ainda sem eventos nesta sessão.</p>
            ) : (
              <ul>
                {timeline.slice(0, 5).map((event) => (
                  <li key={event.id}>
                    <time>{event.createdAt}</time>
                    <strong>{event.label}</strong>
                    {event.detail ? <span>{event.detail}</span> : null}
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
