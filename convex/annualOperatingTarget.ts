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

const targetCadence = v.union(v.literal("weekly"), v.literal("monthly"));

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

function validateYear(year: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Invalid annual operating target year");
  }
}

function validateEffectiveFrom(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid effective start date");
  }
}

export const listByYear = query({
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    validateYear(args.year);

    const userId = await requireUserId(ctx);
    const targets = await ctx.db
      .query("annualOperatingTargets")
      .withIndex("by_user_year", (q) => q.eq("userId", userId).eq("year", args.year))
      .collect();

    return targets.sort((a, b) => {
      if (a.metricKey !== b.metricKey) return a.metricKey.localeCompare(b.metricKey);
      return b.effectiveFrom.localeCompare(a.effectiveFrom) || b.updatedAt - a.updatedAt;
    });
  },
});

export const saveVersion = mutation({
  args: {
    year: v.number(),
    metricKey: v.string(),
    label: v.string(),
    category: targetCategory,
    unit: v.string(),
    cadence: targetCadence,
    targetValue: v.number(),
    effectiveFrom: v.string(),
  },
  handler: async (ctx, args) => {
    validateYear(args.year);
    validateEffectiveFrom(args.effectiveFrom);

    const metricKey = args.metricKey.trim();
    const label = args.label.trim();
    const unit = args.unit.trim();

    if (!metricKey) throw new Error("Annual operating target requires a metric key");
    if (!label) throw new Error("Annual operating target requires a label");
    if (!unit) throw new Error("Annual operating target requires a unit");
    if (!Number.isFinite(args.targetValue) || args.targetValue <= 0) {
      throw new Error("Annual operating target requires a positive target value");
    }

    const userId = await requireUserId(ctx);
    const now = Date.now();
    const previousVersions = await ctx.db
      .query("annualOperatingTargets")
      .withIndex("by_user_year_metric", (q) =>
        q.eq("userId", userId).eq("year", args.year).eq("metricKey", metricKey),
      )
      .collect();

    for (const version of previousVersions) {
      if (version.active) {
        await ctx.db.patch(version._id, {
          active: false,
          updatedAt: now,
        });
      }
    }

    return await ctx.db.insert("annualOperatingTargets", {
      userId,
      year: args.year,
      metricKey,
      label,
      category: args.category,
      unit,
      cadence: args.cadence,
      targetValue: args.targetValue,
      effectiveFrom: args.effectiveFrom,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});
