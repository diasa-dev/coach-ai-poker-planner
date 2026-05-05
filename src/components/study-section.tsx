"use client";

import { BookOpenCheck, Check, GraduationCap, Link2, X } from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { getTodayIsoDate } from "@/lib/planning/weekly-plan";
import { hasPersistenceConfig } from "@/lib/runtime-config";
import styles from "./study-section.module.css";

type StudyTypeOption = {
  value: StudyTypeValue;
  label: string;
};

type StudyTypeValue =
  | "Drills"
  | "Hand review"
  | "Tournament review"
  | "Solver"
  | "Individual lesson"
  | "Group lesson"
  | "Video/course"
  | "Group study"
  | "Theory/concepts"
  | "Other";

type StudyLog = {
  id: string;
  date: string;
  studyType: StudyTypeValue | string;
  durationMinutes: number;
  quality: number;
  note?: string;
  blockTitle?: string;
};

type StudyBlockOption = {
  id: Id<"weeklyPlanBlocks">;
  title: string;
  targetLabel?: string;
  status: "planned" | "done" | "adjusted" | "notDone";
};

type StudySummary = {
  minutes: number;
  averageQuality: number;
  topStudyType?: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const durationOptions = [25, 45, 60, 90];
const todayIsoDate = getTodayIsoDate();
const currentMonth = todayIsoDate.slice(0, 7);

const studyTypes: StudyTypeOption[] = [
  { value: "Drills", label: "Drills" },
  { value: "Hand review", label: "Revisão de mãos" },
  { value: "Tournament review", label: "Revisão de torneios" },
  { value: "Solver", label: "Solver" },
  { value: "Individual lesson", label: "Aula individual" },
  { value: "Group lesson", label: "Aula de grupo" },
  { value: "Video/course", label: "Vídeo/curso" },
  { value: "Group study", label: "Estudo em grupo" },
  { value: "Theory/concepts", label: "Teoria/conceitos" },
  { value: "Other", label: "Outro" },
];

const initialLogs: StudyLog[] = [
  { id: "demo-14", date: "14 Mai", studyType: "Solver", durationMinutes: 45, quality: 4, blockTitle: "ICM até bolha" },
  { id: "demo-13", date: "13 Mai", studyType: "Hand review", durationMinutes: 45, quality: 3 },
  { id: "demo-12", date: "12 Mai", studyType: "Theory/concepts", durationMinutes: 25, quality: 4 },
  { id: "demo-10", date: "10 Mai", studyType: "Drills", durationMinutes: 60, quality: 5 },
];

const demoBlocks: StudyBlockOption[] = [
  {
    id: "thu-study" as Id<"weeklyPlanBlocks">,
    title: "Bluff catch — river",
    targetLabel: "45m",
    status: "planned",
  },
  {
    id: "demo-study-2" as Id<"weeklyPlanBlocks">,
    title: "Push/fold spots",
    targetLabel: "45m",
    status: "planned",
  },
];

const demoWeeklySummary = buildSummary(initialLogs);
const demoMonthlySummary = {
  minutes: 410,
  averageQuality: 4,
  topStudyType: "Hand review",
};

export function StudySection({
  selectedWeeklyPlanBlockId,
}: {
  selectedWeeklyPlanBlockId?: string;
}) {
  if (!hasPersistenceConfig) {
    return (
      <StudyWorkspace
        blockOptions={demoBlocks}
        demoReason="Clerk ou Convex ainda não estão configurados. Os registos ficam apenas nesta demo."
        hasPersistence={false}
        initialLogs={initialLogs}
        monthlySummary={demoMonthlySummary}
        selectedWeeklyPlanBlockId={selectedWeeklyPlanBlockId}
        weeklySummary={demoWeeklySummary}
      />
    );
  }

  return <PersistedStudySection selectedWeeklyPlanBlockId={selectedWeeklyPlanBlockId} />;
}

function PersistedStudySection({
  selectedWeeklyPlanBlockId,
}: {
  selectedWeeklyPlanBlockId?: string;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const studyContext = useQuery(
    api.studySession.getCurrent,
    isAuthenticated ? { today: todayIsoDate, month: currentMonth } : "skip",
  );
  const createStudySession = useMutation(api.studySession.create);
  const markWeeklyBlockDone = useMutation(api.studySession.markWeeklyBlockDone);

  if (isLoading || (isAuthenticated && studyContext === undefined)) {
    return (
      <section className="ep-page">
        <div className="wp-demo-banner">A carregar registos de estudo...</div>
      </section>
    );
  }

  if (!isAuthenticated || !studyContext) {
    return (
      <StudyWorkspace
        blockOptions={demoBlocks}
        demoReason="Sessão não iniciada. Estudo está em modo demo/mock até entrares."
        hasPersistence={false}
        initialLogs={initialLogs}
        monthlySummary={demoMonthlySummary}
        selectedWeeklyPlanBlockId={selectedWeeklyPlanBlockId}
        weeklySummary={demoWeeklySummary}
      />
    );
  }

  return (
    <StudyWorkspace
      blockOptions={studyContext.blockOptions}
      hasPersistence
      initialLogs={studyContext.recent.map((log) => ({
        id: log._id,
        date: log.date,
        studyType: log.studyType,
        durationMinutes: log.durationMinutes,
        quality: log.quality,
        note: log.note,
        blockTitle: log.blockTitle,
      }))}
      monthlySummary={studyContext.monthlySummary}
      onMarkWeeklyBlockDone={async (weeklyPlanBlockId) => {
        await markWeeklyBlockDone({ weeklyPlanBlockId });
      }}
      onSaveLog={async (payload) => {
        await createStudySession(payload);
      }}
      selectedWeeklyPlanBlockId={selectedWeeklyPlanBlockId}
      weekLabel={formatIsoRange(studyContext.weekStartDate, studyContext.weekEndDate)}
      weeklySummary={studyContext.weeklySummary}
    />
  );
}

function StudyWorkspace({
  blockOptions,
  demoReason,
  hasPersistence,
  initialLogs,
  monthlySummary,
  onMarkWeeklyBlockDone,
  onSaveLog,
  selectedWeeklyPlanBlockId,
  weekLabel = "Semana demo",
  weeklySummary,
}: {
  blockOptions: StudyBlockOption[];
  demoReason?: string;
  hasPersistence: boolean;
  initialLogs: StudyLog[];
  monthlySummary: StudySummary;
  onMarkWeeklyBlockDone?: (weeklyPlanBlockId: Id<"weeklyPlanBlocks">) => Promise<void>;
  onSaveLog?: (payload: {
    date: string;
    durationMinutes: number;
    studyType: StudyTypeValue;
    quality: number;
    note?: string;
    weeklyPlanBlockId?: Id<"weeklyPlanBlocks">;
  }) => Promise<void>;
  selectedWeeklyPlanBlockId?: string;
  weekLabel?: string;
  weeklySummary: StudySummary;
}) {
  const [duration, setDuration] = useState(45);
  const [studyType, setStudyType] = useState(studyTypes[0].value);
  const [quality, setQuality] = useState(4);
  const [weeklyBlockId, setWeeklyBlockId] = useState(selectedWeeklyPlanBlockId ?? "");
  const [note, setNote] = useState("");
  const [logs, setLogs] = useState(initialLogs);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [pendingBlockDoneId, setPendingBlockDoneId] = useState<Id<"weeklyPlanBlocks"> | null>(null);

  const localWeeklySummary = useMemo(() => (hasPersistence ? weeklySummary : buildSummary(logs)), [hasPersistence, logs, weeklySummary]);
  const localMonthlySummary = hasPersistence ? monthlySummary : demoMonthlySummary;
  const displayedLogs = hasPersistence ? initialLogs : logs;
  const selectedBlock = blockOptions.find((block) => block.id === weeklyBlockId);
  const availableBlocks = blockOptions.filter((block) => block.status !== "done");
  const visibleWeeklyBlockId = availableBlocks.some((block) => block.id === weeklyBlockId) ? weeklyBlockId : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const weeklyPlanBlockId = selectedBlock ? (selectedBlock.id as Id<"weeklyPlanBlocks">) : undefined;
    const trimmedNote = note.trim();
    const nextLog: StudyLog = {
      id: `local-${Date.now()}`,
      date: todayIsoDate,
      studyType,
      durationMinutes: duration,
      quality,
      note: trimmedNote || undefined,
      blockTitle: selectedBlock?.title,
    };

    setSaveState("saving");

    try {
      if (onSaveLog) {
        await onSaveLog({
          date: todayIsoDate,
          durationMinutes: duration,
          studyType,
          quality,
          note: trimmedNote || undefined,
          weeklyPlanBlockId,
        });
      } else {
        setLogs((current) => [nextLog, ...current].slice(0, 8));
      }

      setNote("");
      setWeeklyBlockId("");
      setSaveState("saved");
      setPendingBlockDoneId(weeklyPlanBlockId ?? null);
    } catch (error) {
      console.error(error);
      setSaveState("error");
    }
  }

  async function handleMarkBlockDone() {
    if (!pendingBlockDoneId || !onMarkWeeklyBlockDone) {
      setPendingBlockDoneId(null);
      return;
    }

    try {
      await onMarkWeeklyBlockDone(pendingBlockDoneId);
      setPendingBlockDoneId(null);
    } catch (error) {
      console.error(error);
      setSaveState("error");
    }
  }

  return (
    <section className="ep-page">
      {demoReason ? (
        <div className="wp-demo-banner">
          <div>
            <strong>Modo demo/mock</strong>
            <span>{demoReason}</span>
          </div>
        </div>
      ) : null}

      <div className="ep-page-header">
        <div>
          <span>{weekLabel}</span>
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
            <span>Tipo de estudo</span>
            <select value={studyType} onChange={(event) => setStudyType(event.target.value as StudyTypeValue)}>
              {studyTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
            <select value={visibleWeeklyBlockId} onChange={(event) => setWeeklyBlockId(event.target.value)}>
              <option value="">Sem bloco</option>
              {availableBlocks.map((block) => (
                <option key={block.id} value={block.id}>
                  {block.title}{block.targetLabel ? ` · ${block.targetLabel}` : ""}
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

          {pendingBlockDoneId ? (
            <div className={styles.confirmPanel}>
              <div>
                <strong>Marcar bloco como feito?</strong>
                <span>Este registo está associado a um bloco do plano semanal.</span>
              </div>
              <div>
                <button className="ep-button primary" type="button" onClick={() => void handleMarkBlockDone()}>
                  <Check size={14} aria-hidden="true" />
                  Marcar como feito
                </button>
                <button className="ep-button secondary" type="button" onClick={() => setPendingBlockDoneId(null)}>
                  <X size={14} aria-hidden="true" />
                  Deixar planeado
                </button>
              </div>
            </div>
          ) : null}

          <div className={styles.formFooter}>
            <button className="ep-button primary" disabled={saveState === "saving"} type="submit">
              <Check size={16} aria-hidden="true" />
              {saveState === "saving" ? "A guardar..." : "Guardar registo"}
            </button>
            <span aria-live="polite">{getSaveMessage(saveState, hasPersistence)}</span>
          </div>
        </form>

        <aside className={styles.sideColumn}>
          <SummaryPanel icon={<BookOpenCheck size={17} aria-hidden="true" />} summary={localWeeklySummary} title="Esta semana" />
          <SummaryPanel icon={<Link2 size={17} aria-hidden="true" />} summary={localMonthlySummary} title="Este mês" />

          <article className={styles.recentPanel}>
            <h2>Recente</h2>
            <div className={styles.tableHeader} aria-hidden="true">
              <span>Data</span>
              <span>Tipo</span>
              <span>Dur.</span>
              <span>Qual.</span>
            </div>
            <div className={styles.recentList}>
              {displayedLogs.length ? (
                displayedLogs.map((log) => (
                  <div className={styles.recentRow} key={log.id}>
                    <strong>{formatDateLabel(log.date)}</strong>
                    <span>{getStudyTypeLabel(log.studyType)}{log.blockTitle ? ` · ${log.blockTitle}` : ""}</span>
                    <strong>{formatMinutes(log.durationMinutes)}</strong>
                    <strong>{log.quality}/5</strong>
                  </div>
                ))
              ) : (
                <p className={styles.emptyState}>Ainda não tens registos de estudo.</p>
              )}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function SummaryPanel({
  icon,
  summary,
  title,
}: {
  icon: ReactNode;
  summary: StudySummary;
  title: string;
}) {
  return (
    <article className={styles.summaryPanel}>
      <div className={styles.summaryHead}>
        <h2>{title}</h2>
        {icon}
      </div>
      <div className={styles.summaryGrid}>
        <Metric label="Tempo de estudo" value={formatMinutes(summary.minutes)} />
        <Metric label="Qualidade média" value={summary.averageQuality ? `${summary.averageQuality}/5` : "-"} />
      </div>
      <p>Tipo mais frequente · {summary.topStudyType ? getStudyTypeLabel(summary.topStudyType) : "Sem dados"}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildSummary(logs: StudyLog[]): StudySummary {
  const minutes = logs.reduce((total, log) => total + log.durationMinutes, 0);
  const averageQuality = logs.length
    ? Math.round((logs.reduce((total, log) => total + log.quality, 0) / logs.length) * 10) / 10
    : 0;
  const topStudyType = Object.entries(
    logs.reduce<Record<string, number>>((acc, log) => {
      acc[log.studyType] = (acc[log.studyType] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0]?.[0];

  return { minutes, averageQuality, topStudyType };
}

function getStudyTypeLabel(value: string) {
  return studyTypes.find((option) => option.value === value)?.label ?? value;
}

function getSaveMessage(saveState: SaveState, hasPersistence: boolean) {
  if (saveState === "saved") return hasPersistence ? "Registo guardado." : "Registo adicionado só nesta demo.";
  if (saveState === "error") return "Não foi possível guardar o registo. Tenta novamente.";
  return "";
}

function formatIsoRange(start: string, end: string) {
  return `${formatDateLabel(start)}–${formatDateLabel(end)}`;
}

function formatDateLabel(value: string) {
  if (value === todayIsoDate) return "Hoje";
  if (!value.includes("-")) return value;

  const date = new Date(`${value}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  if (!hours) return `${remaining}m`;
  if (!remaining) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}
