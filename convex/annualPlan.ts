import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    throw new Error("Invalid annual direction year");
  }
}

function normalizeList(values: string[], maxItems?: number) {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  return typeof maxItems === "number" ? normalized.slice(0, maxItems) : normalized;
}

export const getCurrent = query({
  args: {
    year: v.number(),
  },
  handler: async (ctx, args) => {
    validateYear(args.year);

    const userId = await requireUserId(ctx);

    return await ctx.db
      .query("annualPlans")
      .withIndex("by_user_year", (q) => q.eq("userId", userId).eq("year", args.year))
      .unique();
  },
});

export const save = mutation({
  args: {
    year: v.number(),
    primaryDirection: v.string(),
    priorities: v.array(v.string()),
    nonNegotiables: v.array(v.string()),
    avoidRepeating: v.string(),
    decisionRule: v.string(),
  },
  handler: async (ctx, args) => {
    validateYear(args.year);

    const userId = await requireUserId(ctx);
    const now = Date.now();
    const primaryDirection = args.primaryDirection.trim();
    const priorities = normalizeList(args.priorities, 4);
    const nonNegotiables = normalizeList(args.nonNegotiables);
    const avoidRepeating = args.avoidRepeating.trim();
    const decisionRule = args.decisionRule.trim();

    if (!primaryDirection) {
      throw new Error("Annual direction requires a primary direction");
    }

    if (priorities.length < 2 || priorities.length > 4) {
      throw new Error("Annual direction requires 2 to 4 priorities");
    }

    const existing = await ctx.db
      .query("annualPlans")
      .withIndex("by_user_year", (q) => q.eq("userId", userId).eq("year", args.year))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        primaryDirection,
        priorities,
        nonNegotiables,
        avoidRepeating,
        decisionRule,
        updatedAt: now,
      });

      return existing._id;
    }

    return await ctx.db.insert("annualPlans", {
      userId,
      year: args.year,
      primaryDirection,
      priorities,
      nonNegotiables,
      avoidRepeating,
      decisionRule,
      createdAt: now,
      updatedAt: now,
    });
  },
});
