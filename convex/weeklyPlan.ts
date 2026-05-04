import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const defaultWeekStartDay = 1;

const blockType = v.union(
  v.literal("grind"),
  v.literal("study"),
  v.literal("review"),
  v.literal("sport"),
  v.literal("rest"),
  v.literal("admin"),
);

const blockStatus = v.union(
  v.literal("planned"),
  v.literal("done"),
  v.literal("adjusted"),
  v.literal("notDone"),
);

const planStatus = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("reviewed"),
  v.literal("archived"),
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

async function getPlanWithBlocks(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  weekStartDate: string,
) {
  const plan = await ctx.db
    .query("weeklyPlans")
    .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStartDate", weekStartDate))
    .unique();

  if (!plan) return { plan: null, blocks: [] };

  const blocks = await ctx.db
    .query("weeklyPlanBlocks")
    .withIndex("by_plan", (q) => q.eq("weeklyPlanId", plan._id))
    .collect();

  return {
    plan,
    blocks: blocks.sort((a, b) => a.dayIndex - b.dayIndex || a.order - b.order),
  };
}

export const getCurrent = query({
  args: {
    today: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const preference = await getPreference(ctx, userId);
    const weekStartDay = preference?.weekStartDay ?? defaultWeekStartDay;
    const weekStartDate = getWeekStartDate(args.today, weekStartDay);
    const previousWeekStartDate = addDays(weekStartDate, -7);
    const current = await getPlanWithBlocks(ctx, userId, weekStartDate);
    const previous = await getPlanWithBlocks(ctx, userId, previousWeekStartDate);

    return {
      preference,
      weekStartDay,
      weekStartDate,
      previousWeekStartDate,
      currentPlan: current.plan,
      currentBlocks: current.blocks,
      previousPlan: previous.plan,
      hasPreviousPlan: Boolean(previous.plan),
    };
  },
});

export const setWeekStartDay = mutation({
  args: {
    weekStartDay: v.number(),
  },
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.weekStartDay) || args.weekStartDay < 0 || args.weekStartDay > 6) {
      throw new Error("Invalid week start day");
    }

    const userId = await requireUserId(ctx);
    const existing = await getPreference(ctx, userId);

    if (existing) {
      await ctx.db.patch(existing._id, {
        weekStartDay: args.weekStartDay,
        updatedAt: Date.now(),
      });
      return null;
    }

    await ctx.db.insert("userPreferences", {
      userId,
      weekStartDay: args.weekStartDay,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const save = mutation({
  args: {
    weekStartDate: v.string(),
    focus: v.string(),
    status: planStatus,
    blocks: v.array(
      v.object({
        dayIndex: v.number(),
        type: blockType,
        title: v.string(),
        targetLabel: v.optional(v.string()),
        source: v.optional(v.literal("coachProposal")),
        status: blockStatus,
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("weeklyPlans")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStartDate", args.weekStartDate))
      .unique();

    const planId =
      existing?._id ??
      (await ctx.db.insert("weeklyPlans", {
        userId,
        weekStartDate: args.weekStartDate,
        focus: args.focus,
        status: args.status,
        createdAt: now,
        updatedAt: now,
      }));

    if (existing) {
      await ctx.db.patch(existing._id, {
        focus: args.focus,
        status: args.status,
        updatedAt: now,
      });
    }

    const existingBlocks = await ctx.db
      .query("weeklyPlanBlocks")
      .withIndex("by_plan", (q) => q.eq("weeklyPlanId", planId))
      .collect();

    for (const block of existingBlocks) {
      await ctx.db.delete(block._id);
    }

    for (const block of args.blocks) {
      await ctx.db.insert("weeklyPlanBlocks", {
        userId,
        weeklyPlanId: planId,
        dayIndex: block.dayIndex,
        type: block.type,
        title: block.title,
        targetLabel: block.targetLabel,
        source: block.source,
        status: block.status,
        order: block.order,
        createdAt: now,
        updatedAt: now,
      });
    }

    return planId;
  },
});

export const copyPreviousWeek = mutation({
  args: {
    weekStartDate: v.string(),
    previousWeekStartDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const previous = await getPlanWithBlocks(ctx, userId, args.previousWeekStartDate);

    if (!previous.plan) {
      throw new Error("Previous weekly plan not found");
    }

    const existing = await ctx.db
      .query("weeklyPlans")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStartDate", args.weekStartDate))
      .unique();

    const planId =
      existing?._id ??
      (await ctx.db.insert("weeklyPlans", {
        userId,
        weekStartDate: args.weekStartDate,
        focus: previous.plan.focus,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      }));

    if (existing) {
      await ctx.db.patch(existing._id, {
        focus: previous.plan.focus,
        status: "draft",
        updatedAt: now,
      });

      const existingBlocks = await ctx.db
        .query("weeklyPlanBlocks")
        .withIndex("by_plan", (q) => q.eq("weeklyPlanId", existing._id))
        .collect();

      for (const block of existingBlocks) {
        await ctx.db.delete(block._id);
      }
    }

    for (const block of previous.blocks) {
      await ctx.db.insert("weeklyPlanBlocks", {
        userId,
        weeklyPlanId: planId,
        dayIndex: block.dayIndex,
        type: block.type,
        title: block.title,
        targetLabel: block.targetLabel,
        targetUnit: block.targetUnit,
        targetValue: block.targetValue,
        studyType: block.studyType,
        source: block.source,
        status: "planned",
        order: block.order,
        createdAt: now,
        updatedAt: now,
      });
    }

    return planId;
  },
});
