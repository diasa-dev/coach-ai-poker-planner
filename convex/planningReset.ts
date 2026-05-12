import { mutation } from "./_generated/server";

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

export const clearPlanningData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const deleted = {
      annualPlans: 0,
      annualOperatingTargets: 0,
      monthlyTargets: 0,
      weeklyPlans: 0,
      weeklyPlanBlocks: 0,
      dailyPlans: 0,
      dailyCommitments: 0,
      coachProposalApplications: 0,
    };

    const annualPlans = await ctx.db
      .query("annualPlans")
      .withIndex("by_user_year", (q) => q.eq("userId", userId))
      .collect();
    for (const plan of annualPlans) {
      await ctx.db.delete(plan._id);
      deleted.annualPlans += 1;
    }

    const annualOperatingTargets = await ctx.db
      .query("annualOperatingTargets")
      .withIndex("by_user_year", (q) => q.eq("userId", userId))
      .collect();
    for (const target of annualOperatingTargets) {
      await ctx.db.delete(target._id);
      deleted.annualOperatingTargets += 1;
    }

    const monthlyTargets = await ctx.db
      .query("monthlyTargets")
      .withIndex("by_user_month", (q) => q.eq("userId", userId))
      .collect();
    for (const target of monthlyTargets) {
      await ctx.db.delete(target._id);
      deleted.monthlyTargets += 1;
    }

    const dailyPlans = await ctx.db
      .query("dailyPlans")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();
    for (const dailyPlan of dailyPlans) {
      const commitments = await ctx.db
        .query("dailyCommitments")
        .withIndex("by_daily_plan", (q) => q.eq("dailyPlanId", dailyPlan._id))
        .collect();

      for (const commitment of commitments) {
        if (commitment.userId === userId) {
          await ctx.db.delete(commitment._id);
          deleted.dailyCommitments += 1;
        }
      }

      await ctx.db.delete(dailyPlan._id);
      deleted.dailyPlans += 1;
    }

    const coachProposalApplications = await ctx.db
      .query("coachProposalApplications")
      .withIndex("by_user_status", (q) => q.eq("userId", userId))
      .collect();
    for (const application of coachProposalApplications) {
      await ctx.db.delete(application._id);
      deleted.coachProposalApplications += 1;
    }

    const weeklyPlans = await ctx.db
      .query("weeklyPlans")
      .withIndex("by_user_week", (q) => q.eq("userId", userId))
      .collect();
    for (const weeklyPlan of weeklyPlans) {
      const blocks = await ctx.db
        .query("weeklyPlanBlocks")
        .withIndex("by_plan", (q) => q.eq("weeklyPlanId", weeklyPlan._id))
        .collect();

      for (const block of blocks) {
        if (block.userId === userId) {
          await ctx.db.delete(block._id);
          deleted.weeklyPlanBlocks += 1;
        }
      }

      await ctx.db.delete(weeklyPlan._id);
      deleted.weeklyPlans += 1;
    }

    return deleted;
  },
});
