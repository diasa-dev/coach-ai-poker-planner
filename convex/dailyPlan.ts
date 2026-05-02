import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const defaultCommitments = [
  {
    title: "Rever 20 mãos ICM",
    detail: "20 min · antes de abrir mesas",
    phase: "Preparar",
    tone: "default",
    done: true,
  },
  {
    title: "Definir mesas máximas",
    detail: "6 mesas enquanto estiver deep",
    phase: "Preparar",
    tone: "default",
    done: true,
  },
  {
    title: "2 torneios online principais",
    detail: "sem late reg extra fora do plano",
    phase: "Jogar",
    tone: "accent",
    done: false,
  },
  {
    title: "Marcar spots ICM",
    detail: "mínimo 5 mãos para revisão",
    phase: "Jogar",
    tone: "accent",
    done: true,
  },
  {
    title: "Review pós-sessão",
    detail: "2 min · 1 decisão boa + 1 erro",
    phase: "Rever",
    tone: "soft",
    done: false,
  },
  {
    title: "Dormir 7h+",
    detail: "sem sessão extra se energia cair",
    phase: "Recuperar",
    tone: "soft",
    done: true,
  },
] as const;

const dailyCommitmentStatus = v.union(
  v.literal("planned"),
  v.literal("done"),
  v.literal("adjusted"),
  v.literal("notDone"),
);

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

async function getDailyPlanByDate(
  ctx: QueryCtx | MutationCtx,
  userId: string,
  date: string,
) {
  return await ctx.db
    .query("dailyPlans")
    .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
    .unique();
}

export const getPreparedDay = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const dailyPlan = await getDailyPlanByDate(ctx, userId, args.date);

    if (!dailyPlan) {
      return {
        dailyPlan: null,
        commitments: [],
      };
    }

    const commitments = await ctx.db
      .query("dailyCommitments")
      .withIndex("by_daily_plan", (q) => q.eq("dailyPlanId", dailyPlan._id))
      .collect();

    return {
      dailyPlan,
      commitments: commitments.sort((a, b) => a.order - b.order),
    };
  },
});

export const prepareDay = mutation({
  args: {
    date: v.string(),
    weeklyPlanId: v.optional(v.id("weeklyPlans")),
    commitments: v.array(
      v.object({
        sourceWeeklyPlanBlockId: v.optional(v.id("weeklyPlanBlocks")),
        kind: v.string(),
        title: v.string(),
        estimate: v.string(),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();

    if (args.weeklyPlanId) {
      const weeklyPlan = await ctx.db.get(args.weeklyPlanId);

      if (!weeklyPlan || weeklyPlan.userId !== userId) {
        throw new Error("Weekly plan not found");
      }
    }

    for (const commitment of args.commitments) {
      if (commitment.sourceWeeklyPlanBlockId) {
        const block = await ctx.db.get(commitment.sourceWeeklyPlanBlockId);

        if (!block || block.userId !== userId || block.weeklyPlanId !== args.weeklyPlanId) {
          throw new Error("Weekly plan block not found");
        }
      }
    }

    const existingDailyPlan = await getDailyPlanByDate(ctx, userId, args.date);
    const dailyPlanId =
      existingDailyPlan?._id ??
      (await ctx.db.insert("dailyPlans", {
        userId,
        date: args.date,
        weeklyPlanId: args.weeklyPlanId,
        status: "prepared",
        createdAt: now,
        updatedAt: now,
      }));

    if (existingDailyPlan) {
      await ctx.db.patch(existingDailyPlan._id, {
        weeklyPlanId: args.weeklyPlanId,
        status: "prepared",
        updatedAt: now,
      });

      const existingCommitments = await ctx.db
        .query("dailyCommitments")
        .withIndex("by_daily_plan", (q) => q.eq("dailyPlanId", existingDailyPlan._id))
        .collect();

      for (const commitment of existingCommitments) {
        await ctx.db.delete(commitment._id);
      }
    }

    for (const commitment of args.commitments.slice(0, 3)) {
      await ctx.db.insert("dailyCommitments", {
        userId,
        dailyPlanId,
        sourceWeeklyPlanBlockId: commitment.sourceWeeklyPlanBlockId,
        kind: commitment.kind,
        title: commitment.title,
        estimate: commitment.estimate,
        status: "planned",
        order: commitment.order,
        createdAt: now,
        updatedAt: now,
      });
    }

    const savedCommitments = await ctx.db
      .query("dailyCommitments")
      .withIndex("by_daily_plan", (q) => q.eq("dailyPlanId", dailyPlanId))
      .collect();

    return {
      dailyPlanId,
      commitments: savedCommitments.sort((a, b) => a.order - b.order),
    };
  },
});

export const updateDailyCommitment = mutation({
  args: {
    id: v.id("dailyCommitments"),
    status: dailyCommitmentStatus,
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const commitment = await ctx.db.get(args.id);

    if (!commitment || commitment.userId !== userId) {
      throw new Error("Daily commitment not found");
    }

    await ctx.db.patch(args.id, {
      status: args.status,
      reason:
        args.status === "adjusted" || args.status === "notDone"
          ? args.reason
          : undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const closePreparedDay = mutation({
  args: {
    id: v.id("dailyPlans"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const dailyPlan = await ctx.db.get(args.id);

    if (!dailyPlan || dailyPlan.userId !== userId) {
      throw new Error("Daily plan not found");
    }

    await ctx.db.patch(args.id, {
      status: "closed",
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const getToday = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    const checkIn = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();

    const commitments = await ctx.db
      .query("commitments")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .collect();

    return {
      checkIn,
      commitments: commitments.sort((a, b) => a.order - b.order),
    };
  },
});

export const seedToday = mutation({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();

    const existingCheckIn = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();

    if (!existingCheckIn) {
      await ctx.db.insert("dailyCheckIns", {
        userId,
        date: args.date,
        sleep: 4,
        energy: 4,
        focus: 5,
        stress: 2,
        priority: "Tomar melhores decisões no late game.",
        updatedAt: now,
      });
    }

    const existingCommitments = await ctx.db
      .query("commitments")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .collect();

    if (existingCommitments.length === 0) {
      for (const [order, commitment] of defaultCommitments.entries()) {
        await ctx.db.insert("commitments", {
          ...commitment,
          userId,
          date: args.date,
          order,
          updatedAt: now,
        });
      }
    }

    return null;
  },
});

export const updateCheckIn = mutation({
  args: {
    date: v.string(),
    field: v.union(
      v.literal("sleep"),
      v.literal("energy"),
      v.literal("focus"),
      v.literal("stress"),
    ),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();

    const existingCheckIn = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", args.date))
      .unique();

    if (!existingCheckIn) {
      await ctx.db.insert("dailyCheckIns", {
        userId,
        date: args.date,
        sleep: 4,
        energy: 4,
        focus: 5,
        stress: 2,
        priority: "Tomar melhores decisões no late game.",
        [args.field]: args.value,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.patch(existingCheckIn._id, {
      [args.field]: args.value,
      updatedAt: now,
    });

    return null;
  },
});

export const toggleCommitment = mutation({
  args: {
    id: v.id("commitments"),
    done: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const commitment = await ctx.db.get(args.id);

    if (!commitment || commitment.userId !== userId) {
      throw new Error("Commitment not found");
    }

    await ctx.db.patch(args.id, {
      done: args.done,
      updatedAt: Date.now(),
    });

    return null;
  },
});
