import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const reviewStatus = v.union(
  v.literal("draft"),
  v.literal("completed"),
  v.literal("skipped"),
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

export const getByWeek = query({
  args: {
    weekStartDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    return await ctx.db
      .query("weeklyReviews")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStartDate", args.weekStartDate))
      .unique();
  },
});

export const save = mutation({
  args: {
    weekStartDate: v.string(),
    weeklyPlanId: v.optional(v.id("weeklyPlans")),
    status: reviewStatus,
    executionRating: v.number(),
    energyRating: v.number(),
    focusRating: v.number(),
    qualityRating: v.number(),
    wins: v.string(),
    leaks: v.string(),
    reasons: v.array(v.string()),
    adjustmentNextWeek: v.string(),
    reviewedSessionCount: v.number(),
    pendingSessionReviewCount: v.number(),
    handsToReviewCount: v.number(),
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

    const existing = await ctx.db
      .query("weeklyReviews")
      .withIndex("by_user_week", (q) => q.eq("userId", userId).eq("weekStartDate", args.weekStartDate))
      .unique();

    const payload = {
      weeklyPlanId: args.weeklyPlanId,
      status: args.status,
      executionRating: args.executionRating,
      energyRating: args.energyRating,
      focusRating: args.focusRating,
      qualityRating: args.qualityRating,
      wins: args.wins.trim(),
      leaks: args.leaks.trim(),
      reasons: args.reasons,
      adjustmentNextWeek: args.adjustmentNextWeek.trim(),
      reviewedSessionCount: args.reviewedSessionCount,
      pendingSessionReviewCount: args.pendingSessionReviewCount,
      handsToReviewCount: args.handsToReviewCount,
      completedAt: args.status === "completed" ? now : existing?.completedAt,
      skippedAt: args.status === "skipped" ? now : existing?.skippedAt,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("weeklyReviews", {
      userId,
      weekStartDate: args.weekStartDate,
      ...payload,
      createdAt: now,
    });
  },
});
