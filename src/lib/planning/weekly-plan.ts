export type PlanBlockType =
  | "Grind"
  | "Estudo"
  | "Review"
  | "Desporto"
  | "Descanso"
  | "Admin";

export type PlanBlockStatus = "Planeado" | "Feito" | "Ajustado" | "Não feito";

export type PlanBlock = {
  id: string;
  type: PlanBlockType;
  title: string;
  target?: string;
  source?: "coachProposal";
  status: PlanBlockStatus;
  reason?: string;
};

export type PlanDay = {
  date: string;
  isoDate?: string;
  dayIndex?: number;
  label: string;
  summary: string;
  isToday?: boolean;
  isPast?: boolean;
  isOff?: boolean;
  blocks: PlanBlock[];
};

export type BlockDraft = Pick<PlanBlock, "type" | "title" | "target">;

export const blockTypes: PlanBlockType[] = [
  "Grind",
  "Estudo",
  "Review",
  "Desporto",
  "Descanso",
  "Admin",
];

export const blockStatuses: PlanBlockStatus[] = ["Planeado", "Feito", "Ajustado", "Não feito"];

export const initialWeeklyFocus = "Executar com disciplina, não com volume.";

export const initialWeeklyContingency =
  "Se a energia cair abaixo de 3/5, reduzir uma mesa antes de abrir novos torneios.";

export const weeklyPlanPresets = [
  "Semana equilibrada",
  "Semana grind pesada",
  "Semana estudo / review",
  "Semana recuperação",
  "Personalizada",
];

export type StoredPlanStatus = "draft" | "active" | "reviewed" | "archived";
export type StoredBlockType = "grind" | "study" | "review" | "sport" | "rest" | "admin";
export type StoredBlockStatus = "planned" | "done" | "adjusted" | "notDone";

export type StoredWeeklyPlanBlock = {
  _id?: string;
  dayIndex: number;
  type: StoredBlockType;
  title: string;
  targetLabel?: string;
  source?: "coachProposal";
  status: StoredBlockStatus;
  statusReason?: string;
  order: number;
};

const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthLabels = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const storedToUiType: Record<StoredBlockType, PlanBlockType> = {
  grind: "Grind",
  study: "Estudo",
  review: "Review",
  sport: "Desporto",
  rest: "Descanso",
  admin: "Admin",
};

const uiToStoredType: Record<PlanBlockType, StoredBlockType> = {
  Grind: "grind",
  Estudo: "study",
  Review: "review",
  Desporto: "sport",
  Descanso: "rest",
  Admin: "admin",
};

const storedToUiStatus: Record<StoredBlockStatus, PlanBlockStatus> = {
  planned: "Planeado",
  done: "Feito",
  adjusted: "Ajustado",
  notDone: "Não feito",
};

const uiToStoredStatus: Record<PlanBlockStatus, StoredBlockStatus> = {
  Planeado: "planned",
  Feito: "done",
  Ajustado: "adjusted",
  "Não feito": "notDone",
};

export const initialPlanDays: PlanDay[] = [
  {
    date: "12 Mai",
    label: "Seg",
    summary: "45m estudo · 1 grind",
    isPast: true,
    blocks: [
      {
        id: "mon-study",
        type: "Estudo",
        title: "ICM até bolha",
        target: "45m",
        status: "Feito",
      },
      {
        id: "mon-grind",
        type: "Grind",
        title: "Sessão MTT — noite",
        target: "3h",
        status: "Feito",
      },
    ],
  },
  {
    date: "13 Mai",
    label: "Ter",
    summary: "30m review · 45m estudo · 1 grind",
    isPast: true,
    blocks: [
      {
        id: "tue-review",
        type: "Review",
        title: "Rever sessão de segunda",
        target: "30m",
        status: "Feito",
      },
      {
        id: "tue-study",
        type: "Estudo",
        title: "Push/fold spots",
        target: "45 min",
        status: "Ajustado",
      },
      {
        id: "tue-grind",
        type: "Grind",
        title: "Sessão MTT — noite",
        target: "3h",
        status: "Planeado",
      },
    ],
  },
  {
    date: "14 Mai",
    label: "Qua",
    summary: "45m estudo · 2 grind · 30m review · 40m desporto",
    isToday: true,
    blocks: [
      {
        id: "wed-study",
        type: "Estudo",
        title: "ICM até bolha",
        target: "45m",
        status: "Feito",
      },
      {
        id: "wed-grind",
        type: "Grind",
        title: "Sessão MTT — manhã",
        target: "2h",
        status: "Feito",
      },
      {
        id: "wed-review",
        type: "Review",
        title: "Rever 5 mãos da sessão de ontem",
        target: "30m",
        status: "Planeado",
      },
      {
        id: "wed-sport",
        type: "Desporto",
        title: "Corrida — recovery",
        target: "40m",
        status: "Planeado",
      },
      {
        id: "wed-grind-night",
        type: "Grind",
        title: "Sessão MTT — noite",
        target: "3h",
        status: "Planeado",
      },
    ],
  },
  {
    date: "15 Mai",
    label: "Qui",
    summary: "45m estudo · 1 grind",
    blocks: [
      {
        id: "thu-study",
        type: "Estudo",
        title: "Bluff catch — river",
        target: "45m",
        status: "Planeado",
      },
      {
        id: "thu-grind",
        type: "Grind",
        title: "Sessão MTT — noite",
        target: "3h",
        status: "Planeado",
      },
    ],
  },
  {
    date: "16 Mai",
    label: "Sex",
    summary: "off",
    isOff: true,
    blocks: [
      {
        id: "fri-rest",
        type: "Descanso",
        title: "Dia off",
        target: "—",
        status: "Planeado",
      },
    ],
  },
  {
    date: "17 Mai",
    label: "Sáb",
    summary: "1 grind · 45m review",
    blocks: [
      {
        id: "sat-grind",
        type: "Grind",
        title: "Sessão MTT — tarde",
        target: "4h",
        status: "Planeado",
      },
      {
        id: "sat-review",
        type: "Review",
        title: "Revisão semanal",
        target: "45m",
        status: "Planeado",
      },
    ],
  },
  {
    date: "18 Mai",
    label: "Dom",
    summary: "off",
    isOff: true,
    blocks: [
      { id: "sun-rest", type: "Descanso", title: "Dia off", target: "—", status: "Planeado" },
    ],
  },
];

export function createEmptyBlockDraft(): BlockDraft {
  return {
    type: "Grind",
    title: "",
    target: "",
  };
}

export function getBlockClassName(type: PlanBlockType) {
  return `ep-plan-block ${type.toLowerCase().replace("ç", "c")}`;
}

export function createPlanBlock(dayDate: string, draft: BlockDraft): PlanBlock {
  const title = draft.title.trim();
  const target = draft.target?.trim();

  return {
    id: `${dayDate}-${Date.now()}`,
    type: draft.type,
    title,
    target: target || undefined,
    status: "Planeado",
  };
}

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function formatWeekRange(weekStartDate: string) {
  const start = parseIsoDate(weekStartDate);
  const end = addDays(start, 6);
  return `${formatDayMonth(start)}–${formatDayMonth(end)}`;
}

export function buildPlanDaysFromStoredBlocks({
  blocks,
  today,
  weekStartDate,
}: {
  blocks: StoredWeeklyPlanBlock[];
  today: string;
  weekStartDate: string;
}) {
  const todayTime = parseIsoDate(today).getTime();

  return Array.from({ length: 7 }, (_, dayIndex) => {
    const date = addDays(parseIsoDate(weekStartDate), dayIndex);
    const isoDate = toIsoDate(date);
    const dayBlocks = blocks
      .filter((block) => block.dayIndex === dayIndex)
      .sort((a, b) => a.order - b.order)
      .map<PlanBlock>((block) => ({
        id: block._id ?? `${isoDate}-${block.order}`,
        type: storedToUiType[block.type],
        title: block.title,
        target: block.targetLabel,
        source: block.source,
        status: storedToUiStatus[block.status],
        reason: block.statusReason,
      }));

    return {
      date: formatDayMonth(date),
      isoDate,
      dayIndex,
      label: dayLabels[date.getUTCDay()],
      summary: getDaySummary(dayBlocks),
      isToday: isoDate === today,
      isPast: date.getTime() < todayTime,
      isOff: dayBlocks.length > 0 && dayBlocks.every((block) => block.type === "Descanso"),
      blocks: dayBlocks,
    };
  });
}

export function toStoredPlanBlocks(days: PlanDay[]) {
  return days.flatMap((day, fallbackDayIndex) =>
    day.blocks.map((block, order) => ({
      dayIndex: day.dayIndex ?? fallbackDayIndex,
      type: uiToStoredType[block.type],
      title: block.title,
      targetLabel: block.target,
      source: block.source,
      status: uiToStoredStatus[block.status],
      order,
    })),
  );
}

export function createCleanDraftFromDays(days: PlanDay[]) {
  return days.map((day) => ({
    ...day,
    isPast: false,
    blocks: day.blocks.map((block) => ({
      ...block,
      id: `${day.isoDate ?? day.date}-${block.id}-${Date.now()}`,
      status: "Planeado" as const,
    })),
  }));
}

export function getWeeklyDistribution(days: PlanDay[]) {
  const counts = days
    .flatMap((day) => day.blocks)
    .reduce<Record<PlanBlockType, number>>(
      (acc, block) => ({
        ...acc,
        [block.type]: acc[block.type] + 1,
      }),
      {
        Grind: 0,
        Estudo: 0,
        Review: 0,
        Desporto: 0,
        Descanso: 0,
        Admin: 0,
      },
    );

  return [
    { label: "Grind", value: `${counts.Grind} blocos`, tone: "grind" },
    { label: "Estudo", value: `${counts.Estudo} blocos`, tone: "study" },
    { label: "Review", value: `${counts.Review} blocos`, tone: "review" },
    { label: "Desporto", value: `${counts.Desporto} blocos`, tone: "sport" },
    { label: "Descanso", value: `${counts.Descanso} blocos`, tone: "rest" },
  ];
}

export function parsePlanTarget(target?: string) {
  if (!target || target === "—" || target.toLowerCase() === "opcional") return 0;

  const hours = target.match(/(\d+)h/);
  const minutes = target.match(/(\d+)\s?m/);

  return (Number(hours?.[1]) || 0) * 60 + (Number(minutes?.[1]) || 0);
}

export function formatPlanMinutes(minutes: number) {
  if (minutes === 0) return "—";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function getWeeklyTimeTotals(days: PlanDay[]) {
  return {
    Grind: getCategoryMinutes(days, "Grind"),
    Estudo: getCategoryMinutes(days, "Estudo"),
    Review: getCategoryMinutes(days, "Review"),
    Desporto: getCategoryMinutes(days, "Desporto"),
  };
}

export function getDaySummary(blocks: PlanBlock[]) {
  const grouped = blocks.reduce<Record<PlanBlockType, { count: number; minutes: number }>>(
    (acc, block) => {
      acc[block.type].count += 1;
      acc[block.type].minutes += parsePlanTarget(block.target);
      return acc;
    },
    {
      Grind: { count: 0, minutes: 0 },
      Estudo: { count: 0, minutes: 0 },
      Review: { count: 0, minutes: 0 },
      Desporto: { count: 0, minutes: 0 },
      Descanso: { count: 0, minutes: 0 },
      Admin: { count: 0, minutes: 0 },
    },
  );

  return blockTypes
    .filter((type) => grouped[type].count > 0)
    .map((type) => {
      if (type === "Grind") return `${grouped[type].count} grind`;
      if (type === "Descanso") return "off";
      return `${formatPlanMinutes(grouped[type].minutes)} ${type.toLowerCase()}`;
    })
    .join(" · ");
}

function getCategoryMinutes(days: PlanDay[], type: PlanBlockType) {
  return days
    .flatMap((day) => day.blocks)
    .filter((block) => block.type === type)
    .reduce((total, block) => total + parsePlanTarget(block.target), 0);
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDayMonth(date: Date) {
  return `${date.getUTCDate()} ${monthLabels[date.getUTCMonth()]}`;
}
