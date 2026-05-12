export type AnnualCadence = "daily" | "weekly" | "monthly" | "yearly";

type MonthlyTargetInput = {
  cadence: AnnualCadence;
  effectiveFrom: string;
  targetValue: number;
  unit: string;
};

const cadenceLabel: Record<AnnualCadence, string> = {
  daily: "dia",
  weekly: "semana",
  monthly: "mês",
  yearly: "ano",
};

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysInclusive(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

function getMonthBounds(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthIndex - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex, 0));

  return { start, end };
}

function getYearEnd(year: number) {
  return new Date(Date.UTC(year, 11, 31));
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function getWholeMonthlyTargetValue(value: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value);
}

export function getMonthlyTargetWindow({
  applicableFrom,
  month,
  today,
}: {
  applicableFrom: string;
  month: string;
  today: string;
}) {
  const { start: monthStart, end: monthEnd } = getMonthBounds(month);
  const todayDate = parseIsoDate(today);
  const applicableDate = parseIsoDate(applicableFrom);
  const currentMonth = today.slice(0, 7);
  const windowStart =
    month === currentMonth
      ? new Date(Math.max(monthStart.getTime(), todayDate.getTime(), applicableDate.getTime()))
      : new Date(Math.max(monthStart.getTime(), applicableDate.getTime()));
  const activeDays = getDaysInclusive(windowStart, monthEnd);
  const daysInMonth = getDaysInclusive(monthStart, monthEnd);
  const yearStart = new Date(Date.UTC(monthStart.getUTCFullYear(), 0, 1));
  const yearlyWindowStart = new Date(Math.max(yearStart.getTime(), todayDate.getTime(), applicableDate.getTime()));
  const remainingYearDays = getDaysInclusive(yearlyWindowStart, getYearEnd(monthStart.getUTCFullYear()));

  return {
    activeDays,
    daysInMonth,
    endDate: formatIsoDate(monthEnd),
    remainingYearDays,
    startDate: formatIsoDate(windowStart),
  };
}

export function getDerivedMonthlyTargetValue(
  target: MonthlyTargetInput,
  month: string,
  today: string,
) {
  const window = getMonthlyTargetWindow({
    applicableFrom: target.effectiveFrom,
    month,
    today,
  });

  if (window.activeDays <= 0) return 0;

  if (target.cadence === "daily") {
    return getWholeMonthlyTargetValue(target.targetValue * window.activeDays);
  }

  if (target.cadence === "weekly") {
    return getWholeMonthlyTargetValue((target.targetValue * window.activeDays) / 7);
  }

  if (target.cadence === "yearly") {
    return getWholeMonthlyTargetValue((target.targetValue * window.activeDays) / Math.max(1, window.remainingYearDays));
  }

  return getWholeMonthlyTargetValue(target.targetValue * (window.activeDays / window.daysInMonth));
}

export function formatAnnualCadenceLabel(target: MonthlyTargetInput) {
  return `${target.targetValue} ${target.unit}/${cadenceLabel[target.cadence]}`;
}

export function formatDerivedMonthlyContext(target: MonthlyTargetInput, month: string, today: string) {
  const window = getMonthlyTargetWindow({
    applicableFrom: target.effectiveFrom,
    month,
    today,
  });
  const rawMonthlyValue =
    target.cadence === "daily"
      ? target.targetValue * window.activeDays
      : target.cadence === "weekly"
        ? (target.targetValue * window.activeDays) / 7
        : target.cadence === "yearly"
          ? (target.targetValue * window.activeDays) / Math.max(1, window.remainingYearDays)
          : target.targetValue * (window.activeDays / window.daysInMonth);

  return `${formatAnnualCadenceLabel(target)} · meta deste mês: ${roundOneDecimal(rawMonthlyValue)} ${target.unit} (${window.startDate} a ${window.endDate})`;
}
