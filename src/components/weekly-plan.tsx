"use client";

import {
  Check,
  ChevronDown,
  Copy,
  MoreHorizontal,
  Plus,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import {
  blockTypes,
  buildPlanDaysFromStoredBlocks,
  createCleanDraftFromDays,
  createEmptyBlockDraft,
  createPlanBlock,
  formatWeekRange,
  formatPlanMinutes,
  getBlockClassName,
  getDaySummary,
  getTodayIsoDate,
  getWeeklyTimeTotals,
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
import { hasPersistenceConfig } from "@/lib/runtime-config";

const planOrder = ["Grind", "Estudo", "Review", "Desporto", "Descanso", "Admin"] as const;
const todayIsoDate = getTodayIsoDate();

type SaveState = "idle" | "saving" | "saved" | "error";
type PlanStatus = "draft" | "active" | "reviewed" | "archived";
type WeeklyPlanWorkspaceProps = {
  demoReason?: string;
  hasPersistence: boolean;
  hasPreviousPlan?: boolean;
  initialDays?: PlanDay[];
  initialFocus?: string;
  initialPlanStatus?: PlanStatus;
  onCopyPreviousWeek?: () => Promise<void>;
  onSavePlan?: (payload: {
    days: PlanDay[];
    focus: string;
    status: "draft" | "active";
  }) => Promise<void>;
  onWeekStartDayChange?: (weekStartDay: number) => Promise<void>;
  saveState?: SaveState;
  weekRange?: string;
  weekStartDay?: number;
};

function statusClass(status: PlanBlockStatus) {
  if (status === "Feito") return "done";
  if (status === "Ajustado") return "adj";
  if (status === "Não feito") return "nd";
  return "planned";
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
  const { isAuthenticated, isLoading } = useConvexAuth();
  const weeklyPlan = useQuery(
    api.weeklyPlan.getCurrent,
    isAuthenticated ? { today: todayIsoDate } : "skip",
  );
  const saveWeeklyPlan = useMutation(api.weeklyPlan.save);
  const copyPreviousWeek = useMutation(api.weeklyPlan.copyPreviousWeek);
  const setWeekStartDay = useMutation(api.weeklyPlan.setWeekStartDay);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  if (isLoading || (isAuthenticated && weeklyPlan === undefined)) {
    return (
      <section className="ep-page ep-weekly-page wp-page">
        <div className="wp-demo-banner">A carregar plano semanal...</div>
      </section>
    );
  }

  if (!isAuthenticated || !weeklyPlan) {
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

  const initialDays = weeklyPlan.currentPlan
    ? buildPlanDaysFromStoredBlocks({
        blocks: weeklyPlan.currentBlocks,
        today: todayIsoDate,
        weekStartDate: weeklyPlan.weekStartDate,
      })
    : initialPlanDays;
  const workspaceKey = [
    weeklyPlan.weekStartDate,
    weeklyPlan.weekStartDay,
    weeklyPlan.currentPlan?._id ?? "empty",
    weeklyPlan.currentPlan?.updatedAt ?? 0,
    weeklyPlan.currentBlocks.length,
  ].join(":");

  return (
    <WeeklyPlanWorkspace
      key={workspaceKey}
      hasPersistence
      hasPreviousPlan={weeklyPlan.hasPreviousPlan}
      initialDays={initialDays}
      initialFocus={weeklyPlan.currentPlan?.focus ?? initialWeeklyFocus}
      initialPlanStatus={weeklyPlan.currentPlan?.status ?? "draft"}
      onCopyPreviousWeek={async () => {
        setSaveState("saving");
        try {
          await copyPreviousWeek({
            weekStartDate: weeklyPlan.weekStartDate,
            previousWeekStartDate: weeklyPlan.previousWeekStartDate,
          });
          setSaveState("saved");
        } catch {
          setSaveState("error");
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
        } catch {
          setSaveState("error");
        }
      }}
      onWeekStartDayChange={async (weekStartDay) => {
        setSaveState("saving");
        try {
          await setWeekStartDay({ weekStartDay });
          setSaveState("saved");
        } catch {
          setSaveState("error");
        }
      }}
      saveState={saveState}
      weekRange={formatWeekRange(weeklyPlan.weekStartDate)}
      weekStartDay={weeklyPlan.weekStartDay}
    />
  );
}

function WeeklyPlanWorkspace({
  demoReason,
  hasPersistence,
  hasPreviousPlan,
  initialDays = initialPlanDays,
  initialFocus = initialWeeklyFocus,
  initialPlanStatus = "draft",
  onCopyPreviousWeek,
  onSavePlan,
  onWeekStartDayChange,
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
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [draftBlock, setDraftBlock] = useState(createEmptyBlockDraft);
  const [editing, setEditing] = useState<{ dayDate: string; block: PlanBlock } | null>(null);

  const visibleDays = useMemo(() => {
    if (view === "full") return days;
    const todayIndex = days.findIndex((day) => day.isToday);
    return todayIndex >= 0 ? days.slice(todayIndex) : days;
  }, [days, view]);
  const totals = useMemo(() => getWeeklyTimeTotals(days), [days]);
  const summary = useMemo(() => getWeeklySummary(days), [days]);

  function updateDay(dayDate: string, getNextDay: (day: PlanDay) => PlanDay) {
    setDays((currentDays) =>
      currentDays.map((day) => (day.date === dayDate ? getNextDay(day) : day)),
    );
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
      await onSavePlan({ days, focus: weeklyFocus.trim(), status });
    }

    setWeeklyFocus(weeklyFocus.trim());
    setPlanStatus(status);
    setMode("execution");
  }

  async function handleWeekStartDayChange(value: string) {
    if (onWeekStartDayChange) {
      await onWeekStartDayChange(Number(value));
    }
  }

  function addBlock(dayDate: string, blockType?: PlanBlockType) {
    const baseDraft: BlockDraft = blockType
      ? {
          type: blockType,
          title: getDefaultTitle(blockType),
          target: getDefaultTarget(blockType),
        }
      : draftBlock;
    const title = baseDraft.title.trim();

    if (!title) return;

    updateDay(dayDate, (day) => ({
      ...day,
      isOff: false,
      blocks: [...day.blocks, createPlanBlock(dayDate, { ...baseDraft, title })],
    }));
    setAddingDay(null);
    setDraftBlock(createEmptyBlockDraft());
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

  if (mode === "planning") {
    return (
      <section className="ep-page ep-weekly-page wpp-page">
        <PlanModeBanner
          demoReason={demoReason}
          hasPersistence={hasPersistence}
          onWeekStartDayChange={handleWeekStartDayChange}
          saveState={saveState}
          weekStartDay={weekStartDay}
        />
        <div className="wpp-head">
          <div>
            <span>{weekRange} · {getPlanStatusLabel(planStatus)}</span>
            <h1>Planear semana</h1>
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
            <button className="ep-button secondary" type="button">
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
            {weeklyPlanPresets.map((preset, index) => (
              <button className={index === 0 ? "active" : undefined} key={preset} type="button">
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="wpp-grid" aria-label="Grelha de planeamento semanal">
          {days.map((day) => (
            <DayColumn
              day={day}
              duplicateDay={duplicateDay}
              key={day.date}
              moveBlock={moveBlock}
              removeBlock={removeBlock}
              setEditing={setEditing}
              toggleDayOff={toggleDayOff}
              addTypedBlock={addBlock}
            />
          ))}
        </div>

        <WeeklySummary summary={summary} />

        {addingDay ? (
          <BlockDrawer
            block={draftBlock}
            day={days.find((day) => day.date === addingDay)}
            onChange={setDraftBlock}
            onClose={() => setAddingDay(null)}
            onSave={() => addBlock(addingDay)}
            title="Adicionar bloco"
          />
        ) : null}

        {editing ? (
          <BlockDrawer
            block={editing.block}
            day={days.find((day) => day.date === editing.dayDate)}
            onChange={(block) =>
              setEditing((current) => (current ? { ...current, block: block as PlanBlock } : current))
            }
            onClose={() => setEditing(null)}
            onSave={saveEditedBlock}
            title="Editar bloco"
          />
        ) : null}
      </section>
    );
  }

  return (
    <section className="ep-page ep-weekly-page wp-page">
      <PlanModeBanner
        demoReason={demoReason}
        hasPersistence={hasPersistence}
        onWeekStartDayChange={handleWeekStartDayChange}
        saveState={saveState}
        weekStartDay={weekStartDay}
      />
      <div className="ep-page-header wp-page-head">
        <div>
          <span>{weekRange} · {getPlanStatusLabel(planStatus)}</span>
          <h1>Plano semanal</h1>
          <p>
            Foco · <strong>{weeklyFocus}</strong>
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
          <button className="ep-button secondary" type="button">
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
        <div className="wp-total"><span>Grind</span><strong>{formatPlanMinutes(totals.Grind)}</strong><small>/ 14h</small></div>
        <div className="wp-total"><span>Estudo</span><strong>{formatPlanMinutes(totals.Estudo)}</strong><small>/ 5h</small></div>
        <div className="wp-total"><span>Review</span><strong>{formatPlanMinutes(totals.Review)}</strong><small>/ 2h</small></div>
        <div className="wp-total"><span>Desporto</span><strong>{formatPlanMinutes(totals.Desporto)}</strong><small>/ 3h</small></div>
        <div className="wp-total-meta">
          {view === "full" && days.some((day) => day.isPast) ? (
            <button className="wp-collapse-btn" type="button" onClick={() => setCollapsedPast((value) => !value)}>
              <ChevronDown size={12} aria-hidden="true" />
              {collapsedPast ? "Expandir dias passados" : "Recolher dias passados"}
            </button>
          ) : null}
        </div>
      </div>

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
        <BlockDrawer
          block={draftBlock}
          day={days.find((day) => day.date === addingDay)}
          onChange={setDraftBlock}
          onClose={() => setAddingDay(null)}
          onSave={() => addBlock(addingDay)}
          title="Adicionar bloco"
        />
      ) : null}
    </section>
  );
}

function PlanModeBanner({
  demoReason,
  hasPersistence,
  onWeekStartDayChange,
  saveState,
  weekStartDay,
}: {
  demoReason?: string;
  hasPersistence: boolean;
  onWeekStartDayChange: (value: string) => void;
  saveState: SaveState;
  weekStartDay: number;
}) {
  return (
    <div className={hasPersistence ? "wp-demo-banner is-real" : "wp-demo-banner"}>
      <div>
        <strong>{hasPersistence ? "Dados reais ligados" : "Modo demo/mock"}</strong>
        <span>
          {hasPersistence
            ? "Este plano fica persistido quando guardas draft ou ativar plano."
            : demoReason}
        </span>
      </div>
      <div className="wp-demo-actions">
        <label>
          Semana começa
          <select
            value={weekStartDay}
            onChange={(event) => onWeekStartDayChange(event.target.value)}
            disabled={!hasPersistence || saveState === "saving"}
          >
            <option value={1}>Segunda</option>
            <option value={2}>Terça</option>
            <option value={3}>Quarta</option>
            <option value={4}>Quinta</option>
            <option value={5}>Sexta</option>
            <option value={6}>Sábado</option>
            <option value={0}>Domingo</option>
          </select>
        </label>
        <small>{getSaveStateLabel(saveState)}</small>
      </div>
    </div>
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
                  {block.type}
                  {block.source === "coachProposal" ? <em className="ep-origin-badge">Coach</em> : null}
                </span>
                <strong>{block.title}</strong>
                <small>{block.target ?? "—"}</small>
              </div>
              <i aria-label={block.status} className={`st-dot st-${statusClass(block.status)}`} />
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

function DayColumn({
  day,
  addTypedBlock,
  duplicateDay,
  moveBlock,
  removeBlock,
  setEditing,
  toggleDayOff,
}: {
  day: PlanDay;
  addTypedBlock: (dayDate: string, blockType?: PlanBlockType) => void;
  duplicateDay: (dayDate: string) => void;
  moveBlock: (dayDate: string, blockId: string, direction: -1 | 1) => void;
  removeBlock: (dayDate: string, blockId: string) => void;
  setEditing: (editing: { dayDate: string; block: PlanBlock }) => void;
  toggleDayOff: (dayDate: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingInline, setAddingInline] = useState(false);
  const dayMinutes = getDayMinutes(day);

  return (
    <article className={["ep-day-column", "wpp-col", day.isToday ? "today" : "", day.isOff ? "day-off" : ""].filter(Boolean).join(" ")}>
      <header>
        <div>
          <span>{day.label}</span>
          <h2>{day.date}</h2>
        </div>
        <button className="wpp-col-menu" type="button" aria-label={`Ações de ${day.label}`} onClick={() => setMenuOpen((value) => !value)}>
          <MoreHorizontal size={14} aria-hidden="true" />
        </button>
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

      <div className={day.blocks.length ? "wpp-dist-mini" : "wpp-dist-mini is-empty"} aria-hidden="true">
        {getDistributionSegments(day.blocks).map((segment) => (
          <span className={segment.className} key={segment.id} style={{ width: segment.width }} />
        ))}
      </div>

      <p>
        {day.isOff ? (
          <span className="wpp-off-tag">Dia off</span>
        ) : dayMinutes ? (
          <>
            <span className="wpp-total-val">{formatPlanMinutes(dayMinutes)}</span>{" "}
            <span className="wpp-total-cnt">{day.blocks.length} bloco{day.blocks.length === 1 ? "" : "s"}</span>
          </>
        ) : (
          <span className="wpp-empty-tag">Sem blocos</span>
        )}
      </p>

      <div className="ep-plan-blocks wpp-col-blocks">
        {day.blocks.map((block) => (
          <div className={`${getBlockClassName(block.type)} wpp-block`} key={block.id}>
            <button
              className="wpp-block-main"
              type="button"
              onClick={() => setEditing({ dayDate: day.date, block: { ...block } })}
            >
              <div>
                <span>
                  {block.type}
                  {block.source === "coachProposal" ? <em className="ep-origin-badge">Coach</em> : null}
                </span>
                <strong>{block.title}</strong>
              </div>
              <small>{block.target ?? "—"}</small>
            </button>
            <div className="ep-plan-block-footer">
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

      {day.isOff ? null : addingInline ? (
        <div className="wpp-add-pop" onMouseLeave={() => setAddingInline(false)}>
          {blockTypes.map((type) => (
            <button
              className={`wpp-add-cat cat-${type.toLowerCase().replace("ç", "c")}`}
              key={type}
              type="button"
              onClick={() => {
                addTypedBlock(day.date, type);
                setAddingInline(false);
              }}
            >
              <span />
              {type}
            </button>
          ))}
        </div>
      ) : (
        <button className="ep-add-day-block wpp-add-btn" type="button" onClick={() => setAddingInline(true)}>
          <Plus size={12} aria-hidden="true" />
          Adicionar
        </button>
      )}

    </article>
  );
}

function BlockDrawer({
  block,
  day,
  onChange,
  onClose,
  onSave,
  title,
}: {
  block: BlockDraft | PlanBlock;
  day?: PlanDay;
  onChange: (block: BlockDraft | PlanBlock) => void;
  onClose: () => void;
  onSave: () => void;
  title: string;
}) {
  return (
    <>
      <button className="scrim" type="button" aria-label="Fechar painel" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-head">
          <h2>{day ? `${title} · ${day.label} ${day.date}` : title}</h2>
          <button className="ep-icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="drawer-body">
          <label className="field">
            Categoria
            <select
              value={block.type}
              onChange={(event) => onChange({ ...block, type: event.target.value as PlanBlockType })}
            >
              {blockTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
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
            Duração
            <input
              value={block.target ?? ""}
              onChange={(event) => onChange({ ...block, target: event.target.value })}
              placeholder="ex: 2h"
            />
          </label>
        </div>
        <div className="drawer-foot">
          <button className="ep-button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="ep-button primary" type="button" onClick={onSave} disabled={!block.title.trim()}>
            <Check size={14} aria-hidden="true" />
            Guardar
          </button>
        </div>
      </aside>
    </>
  );
}

function WeeklySummary({
  summary,
}: {
  summary: {
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
      acc.reviewBlocks += day.blocks.filter((block) => block.type === "Review").length;
      acc.sportBlocks += day.blocks.filter((block) => block.type === "Desporto").length;

      day.blocks.forEach((block) => {
        const minutes = parsePlanTarget(block.target);
        categoryMinutes[block.type] += minutes;
        totalMinutes += minutes;
      });

      return acc;
    },
    { grindDays: 0, studyDays: 0, reviewBlocks: 0, sportBlocks: 0, offDays: 0 },
  );

  return { ...summary, totalMinutes, categoryMinutes };
}

function getDefaultTitle(type: PlanBlockType) {
  return {
    Grind: "Sessão MTT",
    Estudo: "Estudo",
    Review: "Rever mãos",
    Desporto: "Treino",
    Descanso: "Dia off",
    Admin: "Admin",
  }[type];
}

function getDefaultTarget(type: PlanBlockType) {
  return {
    Grind: "3h",
    Estudo: "45m",
    Review: "30m",
    Desporto: "45m",
    Descanso: "—",
    Admin: "20m",
  }[type];
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
