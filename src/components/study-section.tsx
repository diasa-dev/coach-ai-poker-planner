"use client";

import { Check, GraduationCap } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import styles from "./study-section.module.css";

type StudyLog = {
  id: string;
  date: string;
  type: string;
  duration: number;
  quality: number;
  note?: string;
  weeklyBlock?: string;
};

const durationOptions = [25, 45, 60, 90];
const studyTypes = ["ICM", "Push/fold spots", "Open ranges", "Bluff catch", "Review de mãos", "Solver"];
const weeklyBlocks = [
  "Sem bloco semanal",
  "Estudo · ICM até bolha (45m)",
  "Estudo · Push/fold spots (45m)",
  "Estudo · Open ranges (25m)",
];

const initialLogs: StudyLog[] = [
  { id: "demo-14", date: "14 Mai", type: "ICM até bolha", duration: 45, quality: 4 },
  { id: "demo-13", date: "13 Mai", type: "Push/fold spots", duration: 45, quality: 3 },
  { id: "demo-12", date: "12 Mai", type: "Open ranges", duration: 25, quality: 4 },
  { id: "demo-10", date: "10 Mai", type: "Bluff catch", duration: 60, quality: 5 },
];

const hiddenWeeklyMinutes = 20;
const weeklyTargetMinutes = 300;

export function StudySection() {
  const [duration, setDuration] = useState(45);
  const [type, setType] = useState(studyTypes[0]);
  const [quality, setQuality] = useState(4);
  const [weeklyBlock, setWeeklyBlock] = useState(weeklyBlocks[1]);
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState(initialLogs);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const totalMinutes = useMemo(
    () => hiddenWeeklyMinutes + logs.reduce((total, log) => total + log.duration, 0),
    [logs],
  );
  const remainingMinutes = Math.max(weeklyTargetMinutes - totalMinutes, 0);
  const progress = Math.min((totalMinutes / weeklyTargetMinutes) * 100, 100);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextLog: StudyLog = {
      id: `local-${Date.now()}`,
      date: "Hoje",
      type,
      duration,
      quality,
      note: note.trim() || undefined,
      weeklyBlock: weeklyBlock === weeklyBlocks[0] ? undefined : weeklyBlock,
    };

    setLogs((current) => [nextLog, ...current].slice(0, 6));
    setNote("");
    setSaveState("saved");
  };

  return (
    <section className="ep-page">
      <div className="ep-page-header">
        <div>
          <span>Semana 18 · demo local</span>
          <h1>Estudo</h1>
          <p>Registo rápido. 60 segundos no máximo.</p>
        </div>
      </div>

      <div className={styles.studyLayout}>
        <form className={styles.formPanel} onSubmit={handleSubmit}>
          <div className={styles.panelHead}>
            <div>
              <span>Novo registo</span>
              <h2>Registar estudo</h2>
            </div>
            <GraduationCap size={20} aria-hidden="true" />
          </div>

          <fieldset className={styles.fieldGroup}>
            <legend>Duração</legend>
            <div className={styles.segmentedControl}>
              {durationOptions.map((option) => (
                <button
                  aria-pressed={duration === option}
                  className={duration === option ? styles.activeSegment : undefined}
                  key={option}
                  type="button"
                  onClick={() => setDuration(option)}
                >
                  {option} m
                </button>
              ))}
            </div>
          </fieldset>

          <label className={styles.field}>
            <span>Tipo</span>
            <select value={type} onChange={(event) => setType(event.target.value)}>
              {studyTypes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <fieldset className={styles.fieldGroup}>
            <legend>Qualidade</legend>
            <div className={styles.qualityControl}>
              {[1, 2, 3, 4, 5].map((option) => (
                <button
                  aria-label={`Qualidade ${option} de 5`}
                  aria-pressed={option <= quality}
                  className={option <= quality ? styles.activeQuality : undefined}
                  key={option}
                  type="button"
                  onClick={() => setQuality(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </fieldset>

          <label className={styles.field}>
            <span>Bloco semanal (opcional)</span>
            <select value={weeklyBlock} onChange={(event) => setWeeklyBlock(event.target.value)}>
              {weeklyBlocks.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Nota (opcional)</span>
            <textarea
              placeholder="O que ficou claro? O que ficou por resolver?"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          <div className={styles.formFooter}>
            <button className="ep-button primary" type="submit">
              <Check size={16} aria-hidden="true" />
              Registar estudo
            </button>
            <span aria-live="polite">{saveState === "saved" ? "Registo adicionado só nesta demo." : ""}</span>
          </div>
        </form>

        <aside className={styles.sideColumn}>
          <article className={styles.summaryPanel}>
            <div className={styles.summaryHead}>
              <h2>Esta semana</h2>
              <strong>
                {formatMinutes(totalMinutes)} / {formatMinutes(weeklyTargetMinutes)}
              </strong>
            </div>
            <div className={styles.progressTrack} aria-label={`Progresso semanal ${Math.round(progress)}%`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>{remainingMinutes ? `${formatMinutes(remainingMinutes)} até ao objetivo semanal` : "Objetivo semanal completo"}</p>
          </article>

          <article className={styles.recentPanel}>
            <h2>Recente</h2>
            <div className={styles.tableHeader} aria-hidden="true">
              <span>Data</span>
              <span>Tipo</span>
              <span>Dur.</span>
              <span>Qual.</span>
            </div>
            <div className={styles.recentList}>
              {logs.map((log) => (
                <div className={styles.recentRow} key={log.id}>
                  <strong>{log.date}</strong>
                  <span>{log.type}</span>
                  <strong>{log.duration}m</strong>
                  <strong>{log.quality}/5</strong>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (!hours) return `${remaining}m`;
  if (!remaining) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}
