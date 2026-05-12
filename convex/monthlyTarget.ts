import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const targetCategory = v.union(
  v.literal("grind"),
  v.literal("study"),
  v.literal("review"),
  v.literal("sport"),
  v.literal("recovery"),
  v.literal("custom"),
);

const categoryOrder = ["grind", "study", "review", "sport", "recovery", "custom"];

const allowedPrimaryUnits = {
  grind: ["dias", "sessões", "torneios", "horas", "minutos"],
  study: ["horas", "minutos", "sessões"],
  review: ["mãos", "horas", "minutos", "sessões"],
  sport: ["dias", "sessões", "blocos", "horas", "minutos"],
  recovery: ["dias", "sessões", "horas", "minutos"],
  custom: ["dias", "torneios", "horas", "sessões", "mãos", "minutos", "blocos", "feito"],
} as const;

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

function validateMonth(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Invalid monthly target month");
  }
}

function studyMinutesToUnit(minutes: number, unit: string) {
  if (unit === "horas") return Math.round((minutes / 60) * 10) / 10;
  return minutes;
}

function validateTarget({
  category,
  primaryUnit,
  targetValue,
  optionalSecondaryUnit,
  optionalSecondaryTargetValue,
}: {
  category: keyof typeof allowedPrimaryUnits;
  primaryUnit: string;
  targetValue: number;
  optionalSecondaryUnit?: string;
  optionalSecondaryTargetValue?: number;
}) {
  const validUnits: readonly string[] = allowedPrimaryUnits[category];

  if (!validUnits.includes(primaryUnit)) {
    throw new Error("Invalid monthly target unit");
  }

  if (!Number.isFinite(targetValue) || targetValue < 0) {
    throw new Error("Monthly target requires a non-negative target value");
  }

  if (category !== "grind" && (optionalSecondaryUnit || optionalSecondaryTargetValue)) {
    throw new Error("Only grind supports a secondary monthly target");
  }

  if (category === "grind" && optionalSecondaryUnit && optionalSecondaryUnit !== "torneios") {
    throw new Error("Invalid grind secondary unit");
  }

  if (
    optionalSecondaryUnit &&
    (!Number.isFinite(optionalSecondaryTargetValue) || !optionalSecondaryTargetValue || optionalSecondaryTargetValue <= 0)
  ) {
    throw new Error("Secondary monthly target requires a positive target value");
  }
}

function validateMetricTarget({
  primaryUnit,
  targetValue,
}: {
  primaryUnit: string;
  targetValue: number;
}) {
  if (!primaryUnit) {
    throw new Error("Monthly metric target requires a unit");
  }

  if (!Number.isFinite(targetValue) || targetValue < 0) {
    throw new Error("Monthly target requires a non-negative target value");
  }
}

export const listForMonth = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    validateMonth(args.month);

    const userId = await requireUserId(ctx);
    const targets = await ctx.db
      .query("monthlyTargets")
      .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", args.month))
      .collect();
    const monthlyStudyMinutes = targets.some((target) => target.category === "study")
      ? (
          await ctx.db
            .query("studySessions")
            .withIndex("by_user_month", (q) => q.eq("userId", userId).eq("month", args.month))
            .collect()
        ).reduce((total, session) => total + session.durationMinutes, 0)
      : 0;

    return targets
      .sort((a, b) => categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category))
      .map((target) => ({
        ...target,
        currentValue:
          target.category === "study"
            ? studyMinutesToUnit(monthlyStudyMinutes, target.primaryUnit)
            : 0,
      }));
  },
});

export const saveCategory = mutation({
  args: {
    month: v.string(),
    category: targetCategory,
    primaryUnit: v.string(),
    targetValue: v.number(),
    optionalSecondaryUnit: v.optional(v.string()),
    optionalSecondaryTargetValue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    validateMonth(args.month);

    const primaryUnit = args.primaryUnit.trim();
    const optionalSecondaryUnit = args.optionalSecondaryUnit?.trim() || undefined;
    const optionalSecondaryTargetValue = optionalSecondaryUnit
      ? args.optionalSecondaryTargetValue
      : undefined;

    validateTarget({
      category: args.category,
      primaryUnit,
      targetValue: args.targetValue,
      optionalSecondaryUnit,
      optionalSecondaryTargetValue,
    });

    const userId = await requireUserId(ctx);
    const now = Date.now();
    const categoryMatches = await ctx.db
      .query("monthlyTargets")
      .withIndex("by_user_month_category", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("category", args.category),
      )
      .collect();
    const existing = categoryMatches.find((target) => !target.metricKey);

    if (existing) {
      await ctx.db.patch(existing._id, {
        primaryUnit,
        targetValue: args.targetValue,
        optionalSecondaryUnit,
        optionalSecondaryTargetValue,
        updatedAt: now,
      });
      return existing._id;
    }

    const insertPayload = {
      userId,
      month: args.month,
      category: args.category,
      primaryUnit,
      targetValue: args.targetValue,
      createdAt: now,
      updatedAt: now,
    };

    if (optionalSecondaryUnit && optionalSecondaryTargetValue) {
      return await ctx.db.insert("monthlyTargets", {
        ...insertPayload,
        optionalSecondaryUnit,
        optionalSecondaryTargetValue,
      });
    }

    return await ctx.db.insert("monthlyTargets", insertPayload);
  },
});

export const saveMetric = mutation({
  args: {
    month: v.string(),
    category: targetCategory,
    metricKey: v.string(),
    metricLabel: v.string(),
    annualCategory: v.optional(v.string()),
    annualUnit: v.optional(v.string()),
    annualCadence: v.optional(v.string()),
    annualTargetValue: v.optional(v.number()),
    primaryUnit: v.string(),
    targetValue: v.number(),
  },
  handler: async (ctx, args) => {
    validateMonth(args.month);

    const metricKey = args.metricKey.trim();
    const metricLabel = args.metricLabel.trim();
    const primaryUnit = args.primaryUnit.trim();

    if (!metricKey) throw new Error("Monthly target requires a metric key");
    if (!metricLabel) throw new Error("Monthly target requires a metric label");

    validateMetricTarget({
      primaryUnit,
      targetValue: args.targetValue,
    });

    const userId = await requireUserId(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("monthlyTargets")
      .withIndex("by_user_month_metric", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("metricKey", metricKey),
      )
      .unique();
    const payload = {
      category: args.category,
      metricKey,
      metricLabel,
      annualCategory: args.annualCategory?.trim() || undefined,
      annualUnit: args.annualUnit?.trim() || undefined,
      annualCadence: args.annualCadence?.trim() || undefined,
      annualTargetValue: args.annualTargetValue,
      primaryUnit,
      targetValue: args.targetValue,
      optionalSecondaryUnit: undefined,
      optionalSecondaryTargetValue: undefined,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("monthlyTargets", {
      userId,
      month: args.month,
      ...payload,
      createdAt: now,
    });
  },
});

export const clearCategory = mutation({
  args: {
    month: v.string(),
    category: targetCategory,
  },
  handler: async (ctx, args) => {
    validateMonth(args.month);

    const userId = await requireUserId(ctx);
    const categoryMatches = await ctx.db
      .query("monthlyTargets")
      .withIndex("by_user_month_category", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("category", args.category),
      )
      .collect();
    const existing = categoryMatches.find((target) => !target.metricKey);

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});

export const clearMetric = mutation({
  args: {
    month: v.string(),
    metricKey: v.string(),
  },
  handler: async (ctx, args) => {
    validateMonth(args.month);

    const metricKey = args.metricKey.trim();
    if (!metricKey) throw new Error("Monthly target requires a metric key");

    const userId = await requireUserId(ctx);
    const existing = await ctx.db
      .query("monthlyTargets")
      .withIndex("by_user_month_metric", (q) =>
        q.eq("userId", userId).eq("month", args.month).eq("metricKey", metricKey),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
  },
});
