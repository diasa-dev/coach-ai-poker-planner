"use client";

import {
  BookOpenCheck,
  Check,
  ChevronDown,
  Copy,
  Gauge,
  MoreHorizontal,
  Plus,
  Save,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  buildPlanDaysFromStoredBlocks,
  createCleanDraftFromDays,
  createEmptyPlanDays,
  createPlanBlock,
  formatWeekRange,
  formatPlanMinutes,
  getBlockClassName,
  getDaySummary,
  getTodayIsoDate,
  initialPlanDays,
  initialWeeklyFocus,
  parsePlanTarget,
  toStoredPlanBlocks,
  weeklyPlanPresets,
  type BlockDraft,
  type PlanBlock,
  type PlanBlockStatus,
  type PlanBlockType,
  type PlanDay,
} from "@/lib/planning/weekly-plan";
import { PersistenceUnavailable } from "@/components/persistence-unavailable";
import { usePersistenceAuth } from "@/lib/persistence-auth";
import { hasPersistenceConfig } from "@/lib/runtime-config";

const planOrder = ["Grind", "Estudo", "Review", "Desporto", "Descanso", "Admin"] as const;
const todayIsoDate = getTodayIsoDate();

type SaveState = "idle" | "saving" | "saved" | "error";
type PlanStatus = "draft" | "active" | "reviewed" | "archived";
type MonthlyTargetCategory = "grind" | "study" | "review" | "sport" | "recovery" | "custom";
type MonthlyTargetContext = {
  category: MonthlyTargetCategory;
  metricKey?: string;
  metricLabel?: string;
  primaryUnit: string;
  targetValue: number;
  optionalSecondaryUnit?: string;
  optionalSecondaryTargetValue?: number;
  updatedAt?: number;
};

type PlanningOption = {
  key: string;
  label: string;
  type: PlanBlockType;
  title: string;
  target: string;
  metricKey?: string;
  metricLabel?: string;
  unit?: string;
  isOff?: boolean;
};
type AnnualPlanContext = {
  primaryDirection: string;
  priorities: string[];
  nonNegotiables: string[];
};
type WeeklyPlanWorkspaceProps = {
  annualPlan?: AnnualPlanContext | null;
  demoReason?: string;
  hasPersistence: boolean;
  hasPreviousPlan?: boolean;
  initialDays?: PlanDay[];
  initialFocus?: string;
  monthlyTargets?: MonthlyTargetContext[];
  initialPlanStatus?: PlanStatus;
  isFirstUse?: boolean;
  onCopyPreviousWeek?: () => Promise<void>;
  onSavePlan?: (payload: {
    days: PlanDay[];
    focus: string;
    status: "draft" | "active";
  }) => Promise<void>;
  saveState?: SaveState;
  weekRange?: string;
  weekStartDay?: number;
};

function isPlannedStudyBlock(block: PlanBlock) {
  return block.type === "Estudo" && block.status === "Planeado";
}

function getStudyBlockHref(blockId: string) {
  return `/study?weeklyPlanBlockId=${encodeURIComponent(blockId)}`;
}

function statusClass(status: PlanBlockStatus) {
  if (status === "Feito") return "done";
  if (status === "Ajustado") return "adj";
  if (status === "Não feito") return "nd";
  return "planned";
}

function formatDayCount(count: number) {
  return count === 1 ? "1 dia" : `${count} dias`;
}

function getDayProgress(blocks: PlanBlock[]) {
  const closedBlocks = blocks.filter(
    (block) => block.status === "Feito" || block.status === "Ajustado",
  ).length;

  return `${closedBlocks}/${blocks.length}`;
}

function getDayMinutes(day: PlanDay) {
  return day.blocks.reduce((total, block) => total + parsePlanTarget(block.target), 0);
}

function getDistributionSegments(blocks: PlanBlock[]) {
  const total = blocks.reduce((sum, block) => sum + (parsePlanTarget(block.target) || 1), 0);

  return blocks.map((block) => ({
    id: block.id,
    className: `cat-${block.type.toLowerCase().replace("ç", "c")}`,
    width: `${((parsePlanTarget(block.target) || 1) / total) * 100}%`,
  }));
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function WeeklyPlan() {
  if (!hasPersistenceConfig) {
    return (
      <WeeklyPlanWorkspace
        demoReason="Clerk ou Convex ainda não estão configurados. As alterações ficam apenas neste draft local."
        hasPersistence={false}
        initialPlanStatus="draft"
        saveState="idle"
        weekRange="Semana demo"
        weekStartDay={1}
      />
    );
  }

  return <PersistedWeeklyPlan />;
}

function PersistedWeeklyPlan() {
  const auth = usePersistenceAuth();
  const canUsePersistence = auth.kind === "ready";
  const currentMonth = getCurrentMonth();
  const weeklyPlan = useQuery(
    api.weeklyPlan.getCurrent,
    canUsePersistence ? { today: todayIsoDate } : "skip",
  );
  const monthlyTargets = useQuery(
    api.monthlyTarget.listForMonth,
    canUsePersistence ? { month: currentMonth } : "skip",
  );
  const annualPlan = useQuery(
    api.annualPlan.getCurrent,
    canUsePersistence ? { year: new Date().getFullYear() } : "skip",
  );
  const saveWeeklyPlan = useMutation(api.weeklyPlan.save);
  const copyPreviousWeek = useMutation(api.weeklyPlan.copyPreviousWeek);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  if (
    auth.kind === "loading" ||
    (canUsePersistence &&
      (weeklyPlan === undefined || monthlyTargets === undefined || annualPlan === undefined))
  ) {
    return (
      <section className="ep-page ep-weekly-page wp-page">
        <div className="wp-demo-banner">A carregar plano semanal...</div>
      </section>
    );
  }

  if (auth.kind === "signed-out") {
    return (
      <WeeklyPlanWorkspace
        demoReason="Sessão não iniciada. Estás a ver dados mock; entra para guardar o plano no Convex."
        hasPersistence={false}
        initialPlanStatus="draft"
        saveState="idle"
        weekRange="Semana demo"
        weekStartDay={1}
      />
    );
  }

  if (auth.kind === "unavailable") {
    return <PersistenceUnavailable featureName="Plano semanal" className="ep-page ep-weekly-page wp-page" />;
  }

  if (!weeklyPlan || !monthlyTargets || annualPlan === undefined) {
    return (
      <section className="ep-page ep-weekly-page wp-page">
        <div className="wp-demo-banner">A carregar plano semanal...</div>
      </section>
    );
  }

  const initialDays = weeklyPlan.currentPlan
    ? buildPlanDaysFromStoredBlocks({
        blocks: weeklyPlan.currentBlocks,
        today: todayIsoDate,
        weekStartDate: weeklyPlan.weekStartDate,
      })
    : createEmptyPlanDays({
        today: todayIsoDate,
        weekStartDate: weeklyPlan.weekStartDate,
      });
  const workspaceKey = [
    weeklyPlan.weekStartDate,
    weeklyPlan.weekStartDay,
    weeklyPlan.currentPlan?._id ?? "empty",
    weeklyPlan.currentPlan?.updatedAt ?? 0,
    weeklyPlan.currentBlocks.length,
    monthlyTargets?.map((target) => `${target.category}:${target.updatedAt}`).join("|") ?? "no-monthly-targets",
    annualPlan?._id ?? "no-annual-plan",
    annualPlan?.updatedAt ?? 0,
  ].join(":");

  return (
    <WeeklyPlanWorkspace
      annualPlan={annualPlan ?? null}
      key={workspaceKey}
      hasPersistence
      hasPreviousPlan={weeklyPlan.hasPreviousPlan}
      initialDays={initialDays}
      initialFocus={weeklyPlan.currentPlan?.focus ?? ""}
      initialPlanStatus={weeklyPlan.currentPlan?.status ?? "draft"}
      isFirstUse={!weeklyPlan.currentPlan}
      monthlyTargets={monthlyTargets ?? []}
      onCopyPreviousWeek={async () => {
        setSaveState("saving");
        try {
          await copyPreviousWeek({
            weekStartDate: weeklyPlan.weekStartDate,
            previousWeekStartDate: weeklyPlan.previousWeekStartDate,
          });
          setSaveState("saved");
        } catch (error) {
          setSaveState("error");
          throw error;
        }
      }}
      onSavePlan={async ({ days, focus, status }) => {
        setSaveState("saving");
        try {
          await saveWeeklyPlan({
            weekStartDate: weeklyPlan.weekStartDate,
            focus,
            status,
            blocks: toStoredPlanBlocks(days),
          });
          setSaveState("saved");
        } catch (error) {
          setSaveState("error");
          throw error;
        }
      }}
      saveState={saveState}
      weekRange={formatWeekRange(weeklyPlan.weekStartDate)}
      weekStartDay={weeklyPlan.weekStartDay}
    />
  );
}

function WeeklyPlanWorkspace({
  annualPlan,
  demoReason,
  hasPersistence,
  hasPreviousPlan,
  initialDays = initialPlanDays,
  initialFocus = initialWeeklyFocus,
  monthlyTargets = [],
  initialPlanStatus = "draft",
  isFirstUse = false,
  onCopyPreviousWeek,
  onSavePlan,
  saveState = "idle",
  weekRange = "12–18 Mai",
  weekStartDay = 1,
}: WeeklyPlanWorkspaceProps) {
  const [mode, setMode] = useState<"execution" | "planning">("execution");
  const [view, setView] = useState<"full" | "from-today">("full");
  const [collapsedPast, setCollapsedPast] = useState(true);
  const [weeklyFocus, setWeeklyFocus] = useState(initialFocus);
  const [planStatus, setPlanStatus] = useState<PlanStatus>(initialPlanStatus);
  const [days, setDays] = useState(initialDays);
  const [savedSnapshot, setSavedSnapshot] = useState(() => getPlanSnapshot(initialDays, initialFocus));
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [draftBlock, setDraftBlock] = useState(() => createDefaultDraftBlock(monthlyTargets));
  const [editing, setEditing] = useState<{ dayDate: string; block: PlanBlock } | null>(null);
  const [objectivesOpen, setObjectivesOpen] = useState(false);
  const [coachContextOpen, setCoachContextOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const visibleDays = useMemo(() => {
    if (view === "full") return days;
    const todayIndex = days.findIndex((day) => day.isToday);
    return todayIndex >= 0 ? days.slice(todayIndex) : days;
  }, [days, view]);
  const summary = useMemo(() => getWeeklySummary(days), [days]);
  const planningOptions = useMemo(() => buildPlanningOptions(monthlyTargets), [monthlyTargets]);
  const monthlyPlanContext = useMemo(
    () => buildMonthlyPlanContext(monthlyTargets, days, summary, annualPlan ?? null),
    [annualPlan, days, monthlyTargets, summary],
  );
  const hasUnsavedChanges = getPlanSnapshot(days, weeklyFocus) !== savedSnapshot;

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  function updateDay(dayDate: string, getNextDay: (day: PlanDay) => PlanDay) {
    setDays((currentDays) =>
      currentDays.map((day) => (day.date === dayDate ? getNextDay(day) : day)),
    );
    setPlanStatus("draft");
  }

  async function handleCopyPreviousWeek() {
    if (onCopyPreviousWeek) {
      await onCopyPreviousWeek();
      setPlanStatus("draft");
      setMode("planning");
      return;
    }

    setDays(createCleanDraftFromDays(days));
    setPlanStatus("draft");
    setMode("planning");
  }

  async function handleSave(status: "draft" | "active") {
    if (!weeklyFocus.trim()) return;

    if (onSavePlan) {
      try {
        await onSavePlan({ days, focus: weeklyFocus.trim(), status });
      } catch {
        return;
      }
    }

    const cleanFocus = weeklyFocus.trim();
    setWeeklyFocus(cleanFocus);
    setSavedSnapshot(getPlanSnapshot(days, cleanFocus));
    setPlanStatus(status);
    setMode("execution");
  }

  function addBlock(dayDates: string[]) {
    const baseDraft = draftBlock;
    const title = baseDraft.title.trim();
    const targetDates = dayDates.length ? dayDates : addingDay ? [addingDay] : [];

    if (!title || !targetDates.length) return;

    setDays((currentDays) =>
      currentDays.map((day) => {
        if (!targetDates.includes(day.date)) return day;

        if (baseDraft.type === "Descanso") {
          return {
            ...day,
            isOff: true,
            blocks: [createPlanBlock(day.date, { ...baseDraft, title })],
          };
        }

        return {
          ...day,
          isOff: false,
          blocks: [...day.blocks, createPlanBlock(day.date, { ...baseDraft, title })],
        };
      }),
    );
    setPlanStatus("draft");
    setAddingDay(null);
    setDraftBlock(createDefaultDraftBlock(monthlyTargets));
  }

  function removeBlock(dayDate: string, blockId: string) {
    updateDay(dayDate, (day) => ({
      ...day,
      blocks: day.blocks.filter((block) => block.id !== blockId),
    }));
  }

  function moveBlock(dayDate: string, blockId: string, direction: -1 | 1) {
    const currentIndex = days.findIndex((day) => day.date === dayDate);
    const targetDay = days[currentIndex + direction];
    const block = days[currentIndex]?.blocks.find((item) => item.id === blockId);

    if (!targetDay || !block) return;

    setDays((currentDays) =>
      currentDays.map((day) => {
        if (day.date === dayDate) {
          return { ...day, blocks: day.blocks.filter((item) => item.id !== blockId) };
        }

        if (day.date === targetDay.date) {
          return { ...day, isOff: false, blocks: [...day.blocks, block] };
        }

        return day;
      }),
    );
  }

  function toggleDayOff(dayDate: string) {
    updateDay(dayDate, (day) => {
      if (day.isOff) return { ...day, isOff: false, blocks: [] };

      return {
        ...day,
        isOff: true,
        blocks: [
          createPlanBlock(dayDate, {
            type: "Descanso",
            title: "Dia off",
            target: "—",
          }),
        ],
      };
    });
  }

  function duplicateDay(dayDate: string) {
    const dayIndex = days.findIndex((day) => day.date === dayDate);
    const nextDay = days[dayIndex + 1];
    const sourceDay = days[dayIndex];

    if (!sourceDay || !nextDay) return;

    updateDay(nextDay.date, (day) => ({
      ...day,
      isOff: sourceDay.isOff,
      blocks: sourceDay.blocks.map((block) => ({
        ...block,
        id: `${day.date}-${block.id}-${Date.now()}`,
      })),
    }));
  }

  function saveEditedBlock() {
    if (!editing?.block.title.trim()) return;

    updateDay(editing.dayDate, (day) => ({
      ...day,
      blocks: day.blocks.map((block) =>
        block.id === editing.block.id
          ? {
              ...editing.block,
              title: editing.block.title.trim(),
              target: editing.block.target?.trim() || undefined,
            }
          : block,
      ),
    }));
    setEditing(null);
  }

  function applyPreset(preset: string) {
    const nextDays = buildPresetDays(days, preset);

    if (!nextDays) return;

    setDays(nextDays.days);
    setWeeklyFocus(nextDays.focus);
    setPlanStatus("draft");
    setActivePreset(preset);
  }

  if (mode === "planning") {
    return (
      <section className="ep-page ep-weekly-page wpp-page">
        <PlanModeBanner
          demoReason={demoReason}
          hasPersistence={hasPersistence}
          hasUnsavedChanges={hasUnsavedChanges}
          isFirstUse={isFirstUse}
          saveState={saveState}
          weekStartDay={weekStartDay}
        />
        <div className="wpp-head">
          <div>
            <span>{weekRange} · {getPlanStatusLabel(planStatus)}</span>
            <h1>Planear semana</h1>
            {isFirstUse ? <p>Começa por um foco curto e 2 ou 3 blocos para esta semana.</p> : null}
          </div>
          <div className="ep-page-actions">
            <button
              className="ep-button secondary"
              type="button"
              onClick={handleCopyPreviousWeek}
              disabled={hasPersistence && !hasPreviousPlan}
            >
              <Copy size={14} aria-hidden="true" />
              Copiar semana anterior
            </button>
            <button className="ep-button secondary" type="button" onClick={() => setCoachContextOpen(true)}>
              <Sparkles size={14} aria-hidden="true" />
              Rever com Coach
            </button>
            <button className="ep-button secondary" type="button" onClick={() => setMode("execution")}>
              Cancelar
            </button>
            <button
              className="ep-button secondary"
              type="button"
              onClick={() => handleSave("draft")}
              disabled={!weeklyFocus.trim() || saveState === "saving"}
            >
              Guardar draft
            </button>
            <button
              className="ep-button primary"
              type="button"
              onClick={() => handleSave("active")}
              disabled={!weeklyFocus.trim() || saveState === "saving"}
            >
              <Check size={14} aria-hidden="true" />
              Ativar plano
            </button>
          </div>
        </div>

        <div className="wpp-focus">
          <label htmlFor="weekly-focus">
            Foco da semana <span>obrigatório</span>
          </label>
          <input
            id="weekly-focus"
            type="text"
            value={weeklyFocus}
            onChange={(event) => setWeeklyFocus(event.target.value)}
          />
        </div>

        <div className="wpp-presets" aria-label="Pontos de partida">
          <span>Começar de</span>
          <div className="wpp-preset-chips">
            {weeklyPlanPresets.map((preset) => (
              <button
                className={activePreset === preset ? "active" : undefined}
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <MonthlyPlanContext context={monthlyPlanContext} onViewObjectives={() => setObjectivesOpen(true)} />

        <div className="ep-week-list wpp-planning-list" aria-label="Lista de planeamento semanal">
          {days.map((day) => (
            <PlanningDayRow
              day={day}
              duplicateDay={duplicateDay}
              key={day.date}
              moveBlock={moveBlock}
              removeBlock={removeBlock}
              setEditing={setEditing}
              toggleDayOff={toggleDayOff}
              onAdd={() => setAddingDay(day.date)}
            />
          ))}
        </div>

        <WeeklySummary summary={summary} />

        {addingDay ? (
          <BlockModal
            block={draftBlock}
            day={days.find((day) => day.date === addingDay)}
            days={days}
            options={planningOptions}
            onChange={setDraftBlock}
            onClose={() => setAddingDay(null)}
            onSave={addBlock}
            title="Adicionar bloco"
          />
        ) : null}

        {editing ? (
          <BlockModal
            block={editing.block}
            day={days.find((day) => day.date === editing.dayDate)}
            days={days}
            options={planningOptions}
            onChange={(block) =>
              setEditing((current) => (current ? { ...current, block: block as PlanBlock } : current))
            }
            onClose={() => setEditing(null)}
            onSave={() => saveEditedBlock()}
            title="Editar bloco"
          />
        ) : null}
        {objectivesOpen ? (
          <ObjectivesModal
            context={monthlyPlanContext}
            onClose={() => setObjectivesOpen(false)}
          />
        ) : null}
        {coachContextOpen ? (
          <CoachContextModal context={monthlyPlanContext} onClose={() => setCoachContextOpen(false)} />
        ) : null}
      </section>
    );
  }

  return (
    <section className="ep-page ep-weekly-page wp-page">
      <PlanModeBanner
        demoReason={demoReason}
        hasPersistence={hasPersistence}
        isFirstUse={isFirstUse}
        saveState={saveState}
        weekStartDay={weekStartDay}
      />
      <div className="ep-page-header wp-page-head">
        <div>
          <span>{weekRange} · {getPlanStatusLabel(planStatus)}</span>
          <h1>Plano semanal</h1>
          <p>
            {weeklyFocus ? (
              <>
                Foco · <strong>{weeklyFocus}</strong>
              </>
            ) : (
              "Ainda não há foco semanal definido."
            )}
          </p>
        </div>
        <div className="ep-page-actions">
          <div className="ep-segmented-control wp-view-switch" aria-label="Vista do plano">
            <button
              className={view === "full" ? "active" : undefined}
              type="button"
              onClick={() => setView("full")}
            >
              Semana inteira
            </button>
            <button
              className={view === "from-today" ? "active" : undefined}
              type="button"
              onClick={() => setView("from-today")}
            >
              A partir de hoje
            </button>
          </div>
          <button
            className="ep-button secondary"
            type="button"
            onClick={handleCopyPreviousWeek}
            disabled={hasPersistence && !hasPreviousPlan}
          >
            <Copy size={14} aria-hidden="true" />
            Copiar semana anterior
          </button>
          <button className="ep-button secondary" type="button" onClick={() => setCoachContextOpen(true)}>
            <Sparkles size={14} aria-hidden="true" />
            Rever com Coach
          </button>
          <button
            className="ep-button secondary"
            type="button"
            onClick={() => setAddingDay(days.find((day) => day.isToday)?.date ?? days[0].date)}
          >
            <Plus size={14} aria-hidden="true" />
            Adicionar bloco
          </button>
          <button className="ep-button primary" type="button" onClick={() => setMode("planning")}>
            <Save size={14} aria-hidden="true" />
            Planear semana
          </button>
        </div>
      </div>

      <div className="wp-totals">
        {monthlyPlanContext.rows.length ? (
          monthlyPlanContext.rows.slice(0, 4).map((row) => (
            <div className="wp-total" key={`${row.category}-${row.label}`}>
              <span>{row.label}</span>
              <strong>{row.plannedLabel.replace("Semana: ", "")}</strong>
              <small>{row.targetLabel.replace("Meta mensal: ", "/ ")}</small>
            </div>
          ))
        ) : (
          <div className="wp-total"><span>Objetivos mensais</span><strong>—</strong><small>define métricas para planear</small></div>
        )}
        <div className="wp-total"><span>Dia off</span><strong>{formatDayCount(summary.offDays)}</strong><small>sempre disponível</small></div>
        <div className="wp-total-meta">
          {view === "full" && days.some((day) => day.isPast) ? (
            <button className="wp-collapse-btn" type="button" onClick={() => setCollapsedPast((value) => !value)}>
              <ChevronDown size={12} aria-hidden="true" />
              {collapsedPast ? "Expandir dias passados" : "Recolher dias passados"}
            </button>
          ) : null}
        </div>
      </div>

      {isFirstUse ? (
        <section className="wp-monthly-context is-empty" aria-label="Próxima ação do plano semanal">
          <div>
            <Target size={16} aria-hidden="true" />
            <div>
              <strong>Ainda não tens plano semanal guardado</strong>
              <span>Cria um foco, adiciona blocos reais e ativa o plano para ligar Hoje, Sessões e Coach.</span>
            </div>
          </div>
          <button className="ep-button primary" type="button" onClick={() => setMode("planning")}>
            Planear primeira semana
          </button>
        </section>
      ) : null}

      <MonthlyPlanContext context={monthlyPlanContext} onViewObjectives={() => setObjectivesOpen(true)} />

      <div className="ep-week-list wp-grid" aria-label="Execução do plano semanal">
        {visibleDays.map((day) => (
          <DayRow
            collapsed={Boolean(day.isPast && collapsedPast && view === "full")}
            day={day}
            key={day.date}
            onAdd={() => setAddingDay(day.date)}
            onExpand={() => setCollapsedPast(false)}
          />
        ))}
      </div>

      {addingDay ? (
        <BlockModal
          block={draftBlock}
          day={days.find((day) => day.date === addingDay)}
          days={days}
          options={planningOptions}
          onChange={setDraftBlock}
          onClose={() => setAddingDay(null)}
          onSave={addBlock}
          title="Adicionar bloco"
        />
      ) : null}
      {objectivesOpen ? (
        <ObjectivesModal
          context={monthlyPlanContext}
          onClose={() => setObjectivesOpen(false)}
        />
      ) : null}
      {coachContextOpen ? (
        <CoachContextModal context={monthlyPlanContext} onClose={() => setCoachContextOpen(false)} />
      ) : null}
    </section>
  );
}

function PlanModeBanner({
  demoReason,
  hasPersistence,
  hasUnsavedChanges,
  isFirstUse,
  saveState,
  weekStartDay,
}: {
  demoReason?: string;
  hasPersistence: boolean;
  hasUnsavedChanges?: boolean;
  isFirstUse?: boolean;
  saveState: SaveState;
  weekStartDay: number;
}) {
  void weekStartDay;

  return (
    <div className={hasPersistence ? "wp-demo-banner is-real" : "wp-demo-banner"}>
      <div>
        <strong>{hasPersistence ? "Dados reais ligados" : "Modo demo/mock"}</strong>
        <span>
          {hasPersistence
            ? isFirstUse
              ? "Conta ligada. Ainda não há plano semanal guardado nesta semana."
              : "Este plano fica persistido quando guardas draft ou ativar plano."
            : demoReason}
        </span>
      </div>
      <div className="wp-demo-actions">
        <small>{hasUnsavedChanges ? "Alterações por guardar" : getSaveStateLabel(saveState)}</small>
      </div>
    </div>
  );
}

function MonthlyPlanContext({
  context,
  onViewObjectives,
}: {
  context: ReturnType<typeof buildMonthlyPlanContext>;
  onViewObjectives: () => void;
}) {
  if (!context.rows.length) {
    return (
      <section className="wp-monthly-context is-empty" aria-label="Contexto dos objetivos mensais">
        <div>
          <Target size={16} aria-hidden="true" />
          <div>
            <strong>Sem objetivos mensais</strong>
            <span>O plano semanal tem menos contexto de ritmo.</span>
          </div>
        </div>
        <button className="ep-button secondary" type="button" onClick={onViewObjectives}>
          Definir objetivos mensais
        </button>
      </section>
    );
  }

  return (
    <section className="wp-monthly-context" aria-label="Contexto dos objetivos mensais">
      <div>
        <Gauge size={16} aria-hidden="true" />
        <div>
          <strong>Ritmo mensal</strong>
          <span>Comparação leve entre esta semana e os objetivos do mês.</span>
        </div>
      </div>
      <div className="wp-monthly-context-list">
        {context.rows.map((row, index) => (
          <div className={`wp-monthly-context-row ${row.kind}`} key={`${row.category}-${row.label}-${row.targetLabel}-${index}`}>
            <span>{row.label}</span>
            <strong>{row.plannedLabel}</strong>
            <small>{row.targetLabel}</small>
          </div>
        ))}
      </div>
      {context.feedback.length ? (
        <div className="wp-strategic-feedback" aria-label="Feedback estratégico">
          {context.feedback.map((item) => (
            <p className={item.kind} key={item.message}>{item.message}</p>
          ))}
        </div>
      ) : null}
      <button className="ep-button secondary" type="button" onClick={onViewObjectives}>
        Ver objetivos
      </button>
    </section>
  );
}

function DayRow({
  collapsed,
  day,
  onAdd,
  onExpand,
}: {
  collapsed: boolean;
  day: PlanDay;
  onAdd: () => void;
  onExpand: () => void;
}) {
  return (
    <article
      className={[
        "ep-week-row",
        day.isToday ? "today" : "",
        day.isPast ? "past" : "",
        day.isOff ? "day-off" : "",
        collapsed ? "collapsed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header onClick={collapsed ? onExpand : undefined}>
        <div>
          <span>{day.label}</span>
          <h2>{day.date}</h2>
          {day.isToday ? <em>Hoje</em> : null}
        </div>
        <p>{getDaySummary(day.blocks)}</p>
        <strong>{day.isPast || day.isOff ? getDayProgress(day.blocks) : ""}</strong>
      </header>
      {!collapsed ? (
        <div className="ep-week-row-blocks">
          {day.blocks.map((block) => (
            <div className={`${getBlockClassName(block.type)} wp-row-like st-${statusClass(block.status)}`} key={block.id}>
              <div>
                <span>
                  {block.metricLabel ?? block.type}
                  {block.source === "coachProposal" ? <em className="ep-origin-badge">Coach</em> : null}
                </span>
                <strong>{block.title}</strong>
                <small>{block.target ?? "—"}</small>
              </div>
              <div className="wp-row-actions">
                <i aria-label={block.status} className={`st-dot st-${statusClass(block.status)}`} />
                {isPlannedStudyBlock(block) ? (
                  <Link className="wp-row-action" href={getStudyBlockHref(block.id)}>
                    <BookOpenCheck size={12} aria-hidden="true" />
                    Registar estudo
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
          <button className="wp-row-add" type="button" onClick={onAdd}>
            <Plus size={12} aria-hidden="true" />
            Adicionar bloco
          </button>
        </div>
      ) : null}
    </article>
  );
}

function PlanningDayRow({
  day,
  duplicateDay,
  moveBlock,
  onAdd,
  removeBlock,
  setEditing,
  toggleDayOff,
}: {
  day: PlanDay;
  duplicateDay: (dayDate: string) => void;
  moveBlock: (dayDate: string, blockId: string, direction: -1 | 1) => void;
  onAdd: () => void;
  removeBlock: (dayDate: string, blockId: string) => void;
  setEditing: (editing: { dayDate: string; block: PlanBlock }) => void;
  toggleDayOff: (dayDate: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const dayMinutes = getDayMinutes(day);

  return (
    <article
      className={["ep-week-row", "wpp-plan-row", day.isToday ? "today" : "", day.isOff ? "day-off" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <header>
        <div>
          <span>{day.label}</span>
          <h2>{day.date}</h2>
          {day.isToday ? <em>Hoje</em> : null}
        </div>
        <p>
          {day.isOff ? "Dia off" : dayMinutes ? `${formatPlanMinutes(dayMinutes)} · ${day.blocks.length} bloco${day.blocks.length === 1 ? "" : "s"}` : "Sem blocos"}
        </p>
        <div className="wpp-plan-row-actions">
          <button className="wp-row-action" type="button" onClick={onAdd}>
            <Plus size={12} aria-hidden="true" />
            Adicionar
          </button>
          <button className="wpp-col-menu" type="button" aria-label={`Ações de ${day.label}`} onClick={() => setMenuOpen((value) => !value)}>
            <MoreHorizontal size={14} aria-hidden="true" />
          </button>
        </div>
        {menuOpen ? (
          <div className="wpp-menu" onMouseLeave={() => setMenuOpen(false)}>
            <button type="button" onClick={() => { duplicateDay(day.date); setMenuOpen(false); }}>
              Copiar para amanhã
            </button>
            <button type="button" onClick={() => { toggleDayOff(day.date); setMenuOpen(false); }}>
              {day.isOff ? "Reativar dia" : "Marcar como off"}
            </button>
          </div>
        ) : null}
      </header>

      <div className="ep-week-row-blocks">
        {day.blocks.map((block) => (
          <div className={`${getBlockClassName(block.type)} wp-row-like st-${statusClass(block.status)}`} key={block.id}>
            <button
              className="wpp-row-edit"
              type="button"
              onClick={() => setEditing({ dayDate: day.date, block: { ...block } })}
            >
              <span>
                {block.metricLabel ?? block.type}
                {block.source === "coachProposal" ? <em className="ep-origin-badge">Coach</em> : null}
              </span>
              <strong>{block.title}</strong>
              <small>{block.target ?? "—"}</small>
            </button>
            <div className="wp-row-actions wpp-row-actions">
              <button type="button" aria-label="Mover para o dia anterior" onClick={() => moveBlock(day.date, block.id, -1)}>
                ←
              </button>
              <button type="button" aria-label="Mover para o dia seguinte" onClick={() => moveBlock(day.date, block.id, 1)}>
                →
              </button>
              <button type="button" aria-label={`Remover ${block.title}`} onClick={() => removeBlock(day.date, block.id)}>
                <X size={11} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function BlockModal({
  block,
  day,
  days,
  options,
  onChange,
  onClose,
  onSave,
  title,
}: {
  block: BlockDraft | PlanBlock;
  day?: PlanDay;
  days: PlanDay[];
  options: PlanningOption[];
  onChange: (block: BlockDraft | PlanBlock) => void;
  onClose: () => void;
  onSave: (dayDates: string[]) => void;
  title: string;
}) {
  const [selectedDays, setSelectedDays] = useState(() => (day ? [day.date] : []));
  const blockOptionKey = getBlockOptionKey(block);
  const selectedOptionKey = options.some((option) => option.key === blockOptionKey)
    ? blockOptionKey
    : options[0]?.key;

  function selectOption(optionKey: string) {
    const option = options.find((item) => item.key === optionKey);
    if (!option) return;

    onChange({
      ...block,
      type: option.type,
      title: option.title,
      target: option.target,
      metricKey: option.metricKey,
      metricLabel: option.metricLabel,
    });
  }

  function toggleSelectedDay(dayDate: string) {
    setSelectedDays((current) =>
      current.includes(dayDate)
        ? current.filter((item) => item !== dayDate)
        : [...current, dayDate],
    );
  }

  function setShortcut(kind: "weekdays" | "weekend" | "all" | "clear") {
    if (kind === "clear") return setSelectedDays([]);
    if (kind === "all") return setSelectedDays(days.map((item) => item.date));
    if (kind === "weekdays") return setSelectedDays(days.slice(0, 5).map((item) => item.date));
    return setSelectedDays(days.slice(5).map((item) => item.date));
  }

  return (
    <>
      <button className="scrim" type="button" aria-label="Fechar modal" onClick={onClose} />
      <section className="wp-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head">
          <h2>{day ? `${title} · ${day.label} ${day.date}` : title}</h2>
          <button className="ep-icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="drawer-body">
          <WeekPreview days={days} selectedDays={selectedDays} onToggleDay={toggleSelectedDay} />
          <div className="wpp-day-shortcuts" aria-label="Atalhos de dias">
            <button type="button" onClick={() => setShortcut("weekdays")}>Dias úteis</button>
            <button type="button" onClick={() => setShortcut("weekend")}>Fim-de-semana</button>
            <button type="button" onClick={() => setShortcut("all")}>Todos</button>
            <button type="button" onClick={() => setShortcut("clear")}>Limpar</button>
          </div>
          <label className="field">
            Objetivo mensal
            <select value={selectedOptionKey} onChange={(event) => selectOption(event.target.value)}>
              {options.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Título
            <input
              autoFocus
              value={block.title}
              onChange={(event) => onChange({ ...block, title: event.target.value })}
              placeholder='ex: "Sessão MTT — noite"'
            />
          </label>
          <label className="field">
            Meta do bloco
            <input
              value={block.target ?? ""}
              onChange={(event) => onChange({ ...block, target: event.target.value })}
              placeholder="ex: 12 torneios, 1 sessão, 45m"
            />
          </label>
        </div>
        <div className="drawer-foot">
          <button className="ep-button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="ep-button primary"
            type="button"
            onClick={() => onSave(selectedDays)}
            disabled={!block.title.trim() || selectedDays.length === 0}
          >
            <Check size={14} aria-hidden="true" />
            Guardar em {selectedDays.length || 0} dia{selectedDays.length === 1 ? "" : "s"}
          </button>
        </div>
      </section>
    </>
  );
}

function WeekPreview({
  days,
  onToggleDay,
  selectedDays,
}: {
  days: PlanDay[];
  onToggleDay?: (dayDate: string) => void;
  selectedDays?: string[];
}) {
  return (
    <section className="wp-week-preview" aria-label="Resumo compacto da semana">
      {days.map((day) => {
        const active = selectedDays?.includes(day.date);

        return (
          <button
            className={active ? "active" : undefined}
            key={day.date}
            type="button"
            onClick={() => onToggleDay?.(day.date)}
            disabled={!onToggleDay}
          >
            <strong>{day.label}</strong>
            <span>{day.blocks.length}</span>
            <small>{formatPlanMinutes(getDayMinutes(day))}</small>
            <div className={day.blocks.length ? "wpp-dist-mini" : "wpp-dist-mini is-empty"} aria-hidden="true">
              {getDistributionSegments(day.blocks).map((segment) => (
                <i className={segment.className} key={segment.id} style={{ width: segment.width }} />
              ))}
            </div>
          </button>
        );
      })}
    </section>
  );
}

function ObjectivesModal({
  context,
  onClose,
}: {
  context: ReturnType<typeof buildMonthlyPlanContext>;
  onClose: () => void;
}) {
  return (
    <>
      <button className="scrim" type="button" aria-label="Fechar objetivos" onClick={onClose} />
      <section className="wp-modal compact" role="dialog" aria-modal="true" aria-label="Objetivos mensais">
        <div className="drawer-head">
          <h2>Objetivos mensais</h2>
          <button className="ep-icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="drawer-body">
          {context.rows.length ? (
            <div className="wp-objective-list">
              {context.rows.map((row, index) => (
                <div className={`wp-monthly-context-row ${row.kind}`} key={`${row.category}-${row.label}-${row.targetLabel}-${index}`}>
                  <span>{row.label}</span>
                  <strong>{row.plannedLabel}</strong>
                  <small>{row.targetLabel}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="wp-modal-copy">Ainda não há objetivos mensais definidos. O plano semanal continua editável.</p>
          )}
          {context.feedback.length ? (
            <div className="wp-strategic-feedback">
              {context.feedback.map((item) => (
                <p className={item.kind} key={item.message}>{item.message}</p>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function CoachContextModal({
  context,
  onClose,
}: {
  context: ReturnType<typeof buildMonthlyPlanContext>;
  onClose: () => void;
}) {
  return (
    <>
      <button className="scrim" type="button" aria-label="Fechar revisão do Coach" onClick={onClose} />
      <section className="wp-modal compact" role="dialog" aria-modal="true" aria-label="Rever com Coach">
        <div className="drawer-head">
          <h2>Rever com Coach</h2>
          <button className="ep-icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="drawer-body">
          <p className="wp-modal-copy">
            Revisão rápida baseada no ritmo mensal e na direção anual disponível. Nada é aplicado ao plano sem guardares.
          </p>
          <div className="wp-strategic-feedback">
            {(context.feedback.length ? context.feedback : [{ kind: "info" as const, message: "Sem alertas fortes neste draft." }]).map((item) => (
              <p className={item.kind} key={item.message}>{item.message}</p>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function WeeklySummary({
  summary,
}: {
  summary: {
    grindBlocks: number;
    grindDays: number;
    studyDays: number;
    reviewBlocks: number;
    sportBlocks: number;
    offDays: number;
    totalMinutes: number;
    categoryMinutes: Record<(typeof planOrder)[number], number>;
  };
}) {
  const total = Object.values(summary.categoryMinutes).reduce((value, minutes) => value + minutes, 0);

  return (
    <div className="wpp-summary">
      <SummaryStat label="Grind" unit="dias" value={summary.grindDays} />
      <SummaryStat label="Estudo" unit="dias" value={summary.studyDays} />
      <SummaryStat label="Review" unit="blocos" value={summary.reviewBlocks} />
      <SummaryStat label="Desporto" unit="blocos" value={summary.sportBlocks} />
      <SummaryStat label="Off" unit="dias" value={summary.offDays} />
      <SummaryStat label="Total planeado" value={formatPlanMinutes(summary.totalMinutes)} big />
      <div className="wpp-sum-dist">
        <div className="wpp-sum-dist-lbl">Distribuição</div>
        <div className="wpp-dist-bar">
          {total ? (
            planOrder.map((type) => {
              const minutes = summary.categoryMinutes[type];
              if (!minutes) return null;

              return (
                <div
                  className={`wpp-dist-seg cat-${type.toLowerCase().replace("ç", "c")}`}
                  key={type}
                  style={{ width: `${(minutes / total) * 100}%` }}
                  title={`${type} · ${formatPlanMinutes(minutes)}`}
                >
                  <span>{type}</span>
                </div>
              );
            })
          ) : (
            <span className="wpp-dist-empty">Sem blocos planeados</span>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({
  big,
  label,
  unit,
  value,
}: {
  big?: boolean;
  label: string;
  unit?: string;
  value: number | string;
}) {
  return (
    <div className={big ? "wpp-sum-stat big" : "wpp-sum-stat"}>
      <div className="wpp-sum-val">
        {value}
        {unit ? <span className="wpp-sum-unit"> {unit}</span> : null}
      </div>
      <div className="wpp-sum-lbl">{label}</div>
    </div>
  );
}

const categoryToPlanType: Record<MonthlyTargetCategory, PlanBlockType> = {
  grind: "Grind",
  study: "Estudo",
  review: "Review",
  sport: "Desporto",
  recovery: "Descanso",
  custom: "Admin",
};

const labelByCategory: Record<MonthlyTargetCategory, string> = {
  grind: "Grind",
  study: "Estudo",
  review: "Review",
  sport: "Sport",
  recovery: "Recuperação",
  custom: "Personalizado",
};

function getTargetIdentity(target: MonthlyTargetContext) {
  return target.metricKey ?? `${target.category}:${target.metricLabel ?? target.primaryUnit}`;
}

function getBlockOptionKey(block: BlockDraft | PlanBlock) {
  if (block.type === "Descanso") return "__off";
  return block.metricKey ?? `legacy:${block.type}`;
}

function buildPlanningOptions(targets: MonthlyTargetContext[]): PlanningOption[] {
  const metricOptions = targets.map((target) => {
    const label = target.metricLabel ?? labelByCategory[target.category];
    const type = categoryToPlanType[target.category] ?? "Admin";

    return {
      key: getTargetIdentity(target),
      label: `${label} · meta mensal ${formatTargetValue(target.targetValue, target.primaryUnit)}`,
      type,
      title: label,
      target: getDefaultTargetForMonthlyTarget(target),
      metricKey: getTargetIdentity(target),
      metricLabel: label,
      unit: target.primaryUnit,
    };
  });

  return [
    ...metricOptions,
    {
      key: "__off",
      label: "Dia off",
      type: "Descanso" as const,
      title: "Dia off",
      target: "—",
      isOff: true,
    },
  ];
}

function createDefaultDraftBlock(targets: MonthlyTargetContext[]): BlockDraft {
  const [option] = buildPlanningOptions(targets);

  return {
    type: option.type,
    title: option.title,
    target: option.target,
    metricKey: option.metricKey,
    metricLabel: option.metricLabel,
  };
}

function getDefaultTargetForMonthlyTarget(target: MonthlyTargetContext) {
  if (target.primaryUnit === "horas") return "1h";
  if (target.primaryUnit === "minutos") return "30m";
  if (target.primaryUnit === "sessões" || target.primaryUnit === "blocos") return `1 ${target.primaryUnit.slice(0, -1)}`;
  if (target.primaryUnit === "dias") return "1 dia";
  return `1 ${target.primaryUnit}`;
}

function getPlanSnapshot(days: PlanDay[], focus: string) {
  return JSON.stringify({ days, focus: focus.trim() });
}

function getWeeklySummary(days: PlanDay[]) {
  const categoryMinutes = planOrder.reduce<Record<(typeof planOrder)[number], number>>(
    (acc, type) => ({ ...acc, [type]: 0 }),
    {} as Record<(typeof planOrder)[number], number>,
  );

  let totalMinutes = 0;

  const summary = days.reduce(
    (acc, day) => {
      const typesInDay = new Set(day.blocks.map((block) => block.type));

      if (typesInDay.has("Grind")) acc.grindDays += 1;
      if (typesInDay.has("Estudo")) acc.studyDays += 1;
      if (day.isOff) acc.offDays += 1;
      acc.grindBlocks += day.blocks.filter((block) => block.type === "Grind").length;
      acc.reviewBlocks += day.blocks.filter((block) => block.type === "Review").length;
      acc.sportBlocks += day.blocks.filter((block) => block.type === "Desporto").length;

      day.blocks.forEach((block) => {
        const minutes = parsePlanTarget(block.target);
        categoryMinutes[block.type] += minutes;
        totalMinutes += minutes;
      });

      return acc;
    },
    { grindBlocks: 0, grindDays: 0, studyDays: 0, reviewBlocks: 0, sportBlocks: 0, offDays: 0 },
  );

  return { ...summary, totalMinutes, categoryMinutes };
}

function formatTargetValue(value: number, unit: string) {
  if (unit === "horas") return `${value}h`;
  if (unit === "minutos") return `${value}m`;
  return `${value} ${unit}`;
}

function minutesToUnit(minutes: number, unit: string) {
  if (unit === "horas") return Math.round((minutes / 60) * 10) / 10;
  if (unit === "minutos") return minutes;
  return null;
}

function extractTargetNumber(target?: string) {
  if (!target) return 0;
  const number = target.match(/\d+(?:[,.]\d+)?/);
  return number ? Number(number[0].replace(",", ".")) : 0;
}

function blockMatchesTarget(block: PlanBlock, target: MonthlyTargetContext) {
  const identity = getTargetIdentity(target);
  if (block.metricKey) return block.metricKey === identity;
  return block.type === categoryToPlanType[target.category];
}

function getWeeklyPlannedValue(
  target: MonthlyTargetContext,
  days: PlanDay[],
) {
  const matchingByDay = days.map((day) => ({
    day,
    blocks: day.blocks.filter((block) => blockMatchesTarget(block, target)),
  })).filter((item) => item.blocks.length > 0);
  const blocks = matchingByDay.flatMap((item) => item.blocks);

  if (target.primaryUnit === "horas" || target.primaryUnit === "minutos") {
    const minutes = blocks.reduce((total, block) => total + parsePlanTarget(block.target), 0);
    return minutesToUnit(minutes, target.primaryUnit) ?? 0;
  }

  if (target.primaryUnit === "dias") return matchingByDay.length;
  if (target.primaryUnit === "sessões" || target.primaryUnit === "blocos") return blocks.length;

  const explicitTotal = blocks.reduce((total, block) => total + extractTargetNumber(block.target), 0);
  return explicitTotal || blocks.length;
}

function buildMonthlyPlanContext(
  targets: MonthlyTargetContext[],
  days: PlanDay[],
  summary: ReturnType<typeof getWeeklySummary>,
  annualPlan: AnnualPlanContext | null,
) {
  void summary;
  const uncoveredCategories: string[] = [];
  const rows = targets.map((target) => {
    const plannedValue = getWeeklyPlannedValue(target, days);
    const targetLabel = `Meta mensal: ${formatTargetValue(target.targetValue, target.primaryUnit)}`;
    const plannedLabel = `Semana: ${formatTargetValue(plannedValue, target.primaryUnit)}`;
    const weeklyShare = target.targetValue > 0 ? plannedValue / target.targetValue : 0;
    const kind = weeklyShare >= 0.2 ? "supporting" : "light";
    const label = target.metricLabel ?? labelByCategory[target.category];

    if (plannedValue <= 0) {
      uncoveredCategories.push(label);
    }

    return {
      category: target.category,
      kind,
      label,
      plannedLabel,
      targetLabel,
    };
  });
  const feedback: Array<{ kind: "info" | "warning"; message: string }> = [];

  if (annualPlan?.primaryDirection) {
    feedback.push({
      kind: "info",
      message: `Direção anual: ${annualPlan.primaryDirection}`,
    });
  } else {
    feedback.push({
      kind: "warning",
      message: "Sem direção anual, este plano tem menos critério estratégico.",
    });
  }

  if (uncoveredCategories.length) {
    feedback.push({
      kind: "warning",
      message: `Sem cobertura planeada esta semana: ${uncoveredCategories.join(", ")}.`,
    });
  }

  return { feedback, rows };
}

function buildPresetDays(days: PlanDay[], preset: string) {
  const presetBlocks = getPresetBlocks(preset);

  if (!presetBlocks) return null;

  return {
    focus: presetBlocks.focus,
    days: days.map((day, dayIndex) => {
      const blocks = (presetBlocks.days[dayIndex] ?? []).map((draft) => createPlanBlock(day.date, draft));

      return {
        ...day,
        isOff: blocks.length > 0 && blocks.every((block) => block.type === "Descanso"),
        blocks,
        summary: getDaySummary(blocks),
      };
    }),
  };
}

function getPresetBlocks(preset: string): { focus: string; days: BlockDraft[][] } | null {
  if (preset === "Personalizada") {
    return {
      focus: initialWeeklyFocus,
      days: [[], [], [], [], [], [], []],
    };
  }

  const restDay: BlockDraft[] = [{ type: "Descanso", title: "Dia off", target: "—" }];
  const study: BlockDraft = { type: "Estudo", title: "Estudo técnico", target: "45m" };
  const review: BlockDraft = { type: "Review", title: "Rever mãos", target: "30m" };
  const sport: BlockDraft = { type: "Desporto", title: "Treino", target: "45m" };
  const grind: BlockDraft = { type: "Grind", title: "Sessão MTT", target: "12 torneios" };

  if (preset === "Semana equilibrada") {
    return {
      focus: "Equilibrar volume, estudo e recuperação sem forçar.",
      days: [[study, sport], [grind], [review, grind], [study], restDay, [grind], restDay],
    };
  }

  if (preset === "Semana grind pesada") {
    return {
      focus: "Volume forte com limites claros de energia e review.",
      days: [[study, grind], [grind], [review, grind], [grind], restDay, [grind], [review]],
    };
  }

  if (preset === "Semana estudo / review") {
    return {
      focus: "Transformar leaks em trabalho técnico antes de aumentar volume.",
      days: [[study, review], [study], [review], [study, sport], restDay, [grind], [review]],
    };
  }

  if (preset === "Semana recuperação") {
    return {
      focus: "Recuperar energia mantendo contacto leve com poker.",
      days: [[study], restDay, [sport], [review], restDay, [grind], restDay],
    };
  }

  return null;
}

function getPlanStatusLabel(status: PlanStatus) {
  return {
    draft: "Draft",
    active: "Plano ativo",
    reviewed: "Revisto",
    archived: "Arquivado",
  }[status];
}

function getSaveStateLabel(state: SaveState) {
  return {
    idle: "Sem alterações guardadas nesta sessão",
    saving: "A guardar...",
    saved: "Guardado",
    error: "Erro ao guardar",
  }[state];
}
