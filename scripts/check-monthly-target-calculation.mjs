import assert from "node:assert/strict";
import {
  formatDerivedMonthlyContext,
  getDerivedMonthlyTargetValue,
  getMonthlyTargetWindow,
} from "../src/lib/monthly-target-calculation.ts";

const weeklyStudy = {
  cadence: "weekly",
  effectiveFrom: "2026-05-08",
  targetValue: 12,
  unit: "horas",
};

assert.equal(getDerivedMonthlyTargetValue(weeklyStudy, "2026-05", "2026-05-08"), 42);
assert.match(
  formatDerivedMonthlyContext(weeklyStudy, "2026-05", "2026-05-08"),
  /12 horas\/semana · meta deste mês: 41\.1 horas/,
);

assert.equal(
  getDerivedMonthlyTargetValue({
    cadence: "daily",
    effectiveFrom: "2026-05-08",
    targetValue: 2,
    unit: "sessões",
  }, "2026-05", "2026-05-08"),
  48,
);

assert.equal(
  getDerivedMonthlyTargetValue({
    cadence: "monthly",
    effectiveFrom: "2026-05-08",
    targetValue: 20,
    unit: "horas",
  }, "2026-05", "2026-05-08"),
  16,
);

assert.equal(
  getDerivedMonthlyTargetValue({
    cadence: "yearly",
    effectiveFrom: "2026-05-08",
    targetValue: 1200,
    unit: "torneios",
  }, "2026-05", "2026-05-08"),
  122,
);

assert.equal(
  getDerivedMonthlyTargetValue({ ...weeklyStudy, effectiveFrom: "2026-05-15" }, "2026-05", "2026-05-08"),
  30,
);

assert.deepEqual(getMonthlyTargetWindow({
  applicableFrom: "2026-05-15",
  month: "2026-05",
  today: "2026-05-08",
}), {
  activeDays: 17,
  daysInMonth: 31,
  endDate: "2026-05-31",
  remainingYearDays: 231,
  startDate: "2026-05-15",
});

console.log("monthly target calculation checks passed");
