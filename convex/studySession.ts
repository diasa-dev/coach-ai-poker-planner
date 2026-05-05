import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const defaultWeekStartDay = 1;
const studyType = v.union(
  v.literal("Drills"),
  v.literal("Hand review"),
  v.literal("Tournament review"),
  v.literal("Solver"),
  v.literal("Individual lesson"),
  v.literal("Group lesson"),
  v.literal("Video/course"),
  v.literal("Group study"),
  v.literal("Theory/concepts"),
  v.literal("Other"),
);

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

function parseIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const next = parseIsoDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return toIsoDate(next);
}

function getWeekStartDate(today: string, weekStartDay: number) {
  const date = parseIsoDate(today);
  const diff = (date.getUTCDay() - weekStartDay + 7) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return toIsoDate(date);
}

async function getPreference(ctx: QueryCtx | MutationCtx, userId: string) {
  return await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

async function getCurrentWeeklyPlan(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  weekStartDate: string,
) {
  return await ctx.db
    .query("weeklyPlans")
    .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStartDate", weekStartDate))
    .unique();
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

function getTopStudyType(sessions: { studyType: string }[]) {
  const counts = sessions.reduce<Record<string, number>>((acc, session) => {
    acc[session.studyType] = (acc[session.studyType] ?? 0) + 1;
    return acc;
  }, {});
  const [studyType] =
    Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] ?? [];

  return studyType;
}

export const getCurrent = query({
  args: {
    today: v.string(),
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const preference = await getPreference(ctx, userId);
    const weekStartDate = getWeekStartDate(args.today, preference?.weekStartDay ?? defaultWeekStartDay);
    const weekEndDate = addDays(weekStartDate, 6);
    const weeklyPlan = await getCurrentWeeklyPlan(ctx, userId, weekStartDate);
    const weeklyBlocks = weeklyPlan
      ? await ctx.db
          .query("weeklyPlanBlocks")
          .withIndex("by_plan", (q) => q.eq("weeklyPlanId", weeklyPlan._id))
          .collect()
      : [];
    const studyBlocks = weeklyBlocks
      .filter((block) => block.type === "study")
      .sort((a, b) => a.dayIndex - b.dayIndex || a.order - b.order);
    const weeklySessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStartDate", weekStartDate))
      .collect();
    const monthlySessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", args.month))
      .collect();
    const recentSessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user_created", (q) => q.eq("userId", userId))
      .collect();

    const recent = recentSessions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 8)
      .map((session) => ({
        ...session,
        blockTitle: studyBlocks.find((block) => block._id === session.weeklyPlanBlockId)?.title,
      }));

    return {
      weekStartDate,
      weekEndDate,
      weeklyPlanId: weeklyPlan?._id,
      blockOptions: studyBlocks.map((block) => ({
        id: block._id,
        dayIndex: block.dayIndex,
        title: block.title,
        targetLabel: block.targetLabel,
        status: block.status,
      })),
      weeklySummary: {
        minutes: weeklySessions.reduce((total, session) => total + session.durationMinutes, 0),
        averageQuality: average(weeklySessions.map((session) => session.quality)),
        topStudyType: getTopStudyType(weeklySessions),
      },
      monthlySummary: {
        minutes: monthlySessions.reduce((total, session) => total + session.durationMinutes, 0),
        averageQuality: average(monthlySessions.map((session) => session.quality)),
        topStudyType: getTopStudyType(monthlySessions),
      },
      recent,
    };
  },
});

export const create = mutation({
  args: {
    date: v.string(),
    durationMinutes: v.number(),
    studyType,
    quality: v.number(),
    note: v.optional(v.string()),
    weeklyPlanBlockId: v.optional(v.id("weeklyPlanBlocks")),
  },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.durationMinutes) || args.durationMinutes <= 0 || args.durationMinutes > 24 * 60) {
      throw new Error("Invalid duration");
    }

    if (!Number.isInteger(args.quality) || args.quality < 1 || args.quality > 5) {
      throw new Error("Invalid quality");
    }

    const userId = await requireUserId(ctx);
    const preference = await getPreference(ctx, userId);
    const weekStartDate = getWeekStartDate(args.date, preference?.weekStartDay ?? defaultWeekStartDay);
    const now = Date.now();
    let weeklyPlanId: Id<"weeklyPlans"> | undefined;

    if (args.weeklyPlanBlockId) {
      const block = await ctx.db.get(args.weeklyPlanBlockId);

      if (!block || block.userId !== userId || block.type !== "study") {
        throw new Error("Study block not found");
      }

      weeklyPlanId = block.weeklyPlanId;
    }

    return await ctx.db.insert("studySessions", {
      userId,
      date: args.date,
      weekStartDate,
      month: args.date.slice(0, 7),
      weeklyPlanId,
      weeklyPlanBlockId: args.weeklyPlanBlockId,
      durationMinutes: args.durationMinutes,
      studyType: args.studyType,
      quality: args.quality,
      note: args.note?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const markWeeklyBlockDone = mutation({
  args: {
    weeklyPlanBlockId: v.id("weeklyPlanBlocks"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const block = await ctx.db.get(args.weeklyPlanBlockId);

    if (!block || block.userId !== userId || block.type !== "study") {
      throw new Error("Study block not found");
    }

    await ctx.db.patch(args.weeklyPlanBlockId, {
      status: "done",
      statusReason: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});
