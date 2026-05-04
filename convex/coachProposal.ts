import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

const undoWindowMs = 30_000;

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

const planBlock = v.object({
  dayIndex: v.number(),
  type: blockType,
  title: v.string(),
  targetLabel: v.optional(v.string()),
  source: v.optional(v.literal("coachProposal")),
  status: blockStatus,
  order: v.number(),
});

type StoredPlanBlock = {
  dayIndex: number;
  type: "grind" | "study" | "review" | "sport" | "rest" | "admin";
  title: string;
  targetLabel?: string;
  source?: "coachProposal";
  status: "planned" | "done" | "adjusted" | "notDone";
  order: number;
};

type CoachChange = {
  action: "addBlock";
  block: StoredPlanBlock;
  source: "coachProposal";
};

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

async function getOwnedPlan(
  ctx: MutationCtx,
  weeklyPlanId: Id<"weeklyPlans">,
  userId: string,
) {
  const weeklyPlan = await ctx.db.get(weeklyPlanId);

  if (!weeklyPlan || weeklyPlan.userId !== userId) {
    throw new Error("Weekly plan not found");
  }

  return weeklyPlan;
}

async function getPlanBlocks(
  ctx: MutationCtx,
  weeklyPlanId: Id<"weeklyPlans">,
) {
  const blocks = await ctx.db
    .query("weeklyPlanBlocks")
    .withIndex("by_plan", (q) => q.eq("weeklyPlanId", weeklyPlanId))
    .collect();

  return blocks
    .sort((a, b) => a.dayIndex - b.dayIndex || a.order - b.order)
    .map<StoredPlanBlock>((block) => ({
      dayIndex: block.dayIndex,
      type: block.type,
      title: block.title,
      targetLabel: block.targetLabel,
      source: block.source,
      status: block.status,
      order: block.order,
    }));
}

function applyChanges(currentBlocks: StoredPlanBlock[], changes: CoachChange[]) {
  const nextBlocks = [...currentBlocks];
  const nextOrderByDay = new Map<number, number>();

  for (const block of currentBlocks) {
    nextOrderByDay.set(block.dayIndex, Math.max(nextOrderByDay.get(block.dayIndex) ?? -1, block.order));
  }

  for (const change of changes) {
    const block = normalizeBlock(change.block);
    const exists = nextBlocks.some(
      (current) =>
        current.dayIndex === block.dayIndex &&
        current.type === block.type &&
        current.title.trim().toLowerCase() === block.title.trim().toLowerCase(),
    );

    if (exists) continue;

    const order = (nextOrderByDay.get(block.dayIndex) ?? -1) + 1;
    nextOrderByDay.set(block.dayIndex, order);
    nextBlocks.push({ ...block, source: change.source, order });
  }

  return nextBlocks;
}

function normalizeBlock(block: StoredPlanBlock): StoredPlanBlock {
  const title = block.title.trim();

  if (!title) {
    throw new Error("Coach proposal block title is required");
  }

  if (!Number.isInteger(block.dayIndex) || block.dayIndex < 0 || block.dayIndex > 6) {
    throw new Error("Coach proposal day is invalid");
  }

  return {
    dayIndex: block.dayIndex,
    type: block.type,
    title,
    targetLabel: block.targetLabel?.trim() || undefined,
    source: block.source,
    status: block.status,
    order: block.order,
  };
}

async function replacePlanBlocks(
  ctx: MutationCtx,
  args: {
    userId: string;
    weeklyPlanId: Id<"weeklyPlans">;
    blocks: StoredPlanBlock[];
    now: number;
  },
) {
  const existingBlocks = await ctx.db
    .query("weeklyPlanBlocks")
    .withIndex("by_plan", (q) => q.eq("weeklyPlanId", args.weeklyPlanId))
    .collect();

  for (const block of existingBlocks) {
    await ctx.db.delete(block._id);
  }

  for (const block of args.blocks) {
    await ctx.db.insert("weeklyPlanBlocks", {
      userId: args.userId,
      weeklyPlanId: args.weeklyPlanId,
      dayIndex: block.dayIndex,
      type: block.type,
      title: block.title,
      targetLabel: block.targetLabel,
      source: block.source,
      status: block.status,
      order: block.order,
      createdAt: args.now,
      updatedAt: args.now,
    });
  }
}

export const apply = mutation({
  args: {
    weeklyPlanId: v.id("weeklyPlans"),
    proposalTitle: v.string(),
    changes: v.array(
      v.object({
        action: v.literal("addBlock"),
        block: planBlock,
        source: v.literal("coachProposal"),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const weeklyPlan = await getOwnedPlan(ctx, args.weeklyPlanId, userId);
    const now = Date.now();
    const beforeBlocks = await getPlanBlocks(ctx, weeklyPlan._id);
    const afterBlocks = applyChanges(beforeBlocks, args.changes);

    await replacePlanBlocks(ctx, {
      userId,
      weeklyPlanId: weeklyPlan._id,
      blocks: afterBlocks,
      now,
    });

    await ctx.db.patch(weeklyPlan._id, {
      updatedAt: now,
    });

    const applicationId = await ctx.db.insert("coachProposalApplications", {
      userId,
      weekStartDate: weeklyPlan.weekStartDate,
      weeklyPlanId: weeklyPlan._id,
      proposalTitle: args.proposalTitle.trim() || "Proposta do Coach",
      status: "applied",
      beforeBlocks,
      afterBlocks,
      appliedAt: now,
      undoExpiresAt: now + undoWindowMs,
      createdAt: now,
      updatedAt: now,
    });

    return {
      applicationId,
      undoExpiresAt: now + undoWindowMs,
    };
  },
});

export const getActive = query({
  args: {
    weeklyPlanId: v.optional(v.id("weeklyPlans")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);

    if (!args.weeklyPlanId) return null;

    const weeklyPlan = await ctx.db.get(args.weeklyPlanId);

    if (!weeklyPlan || weeklyPlan.userId !== userId) {
      return null;
    }

    const applications = await ctx.db
      .query("coachProposalApplications")
      .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "applied"))
      .collect();
    const latest = applications
      .filter((application) => application.weeklyPlanId === args.weeklyPlanId)
      .sort((a, b) => b.appliedAt - a.appliedAt)[0];

    if (!latest || Date.now() > latest.undoExpiresAt) {
      return null;
    }

    return latest;
  },
});

export const undo = mutation({
  args: {
    applicationId: v.id("coachProposalApplications"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const application = await ctx.db.get(args.applicationId);
    const now = Date.now();

    if (!application || application.userId !== userId) {
      throw new Error("Coach proposal application not found");
    }

    if (application.status !== "applied") {
      throw new Error("Coach proposal application is not active");
    }

    if (now > application.undoExpiresAt) {
      await ctx.db.patch(application._id, {
        status: "expired",
        updatedAt: now,
      });
      throw new Error("Já passaram os 30 segundos para anular esta alteração.");
    }

    await getOwnedPlan(ctx, application.weeklyPlanId, userId);

    await replacePlanBlocks(ctx, {
      userId,
      weeklyPlanId: application.weeklyPlanId,
      blocks: application.beforeBlocks,
      now,
    });

    await ctx.db.patch(application.weeklyPlanId, {
      updatedAt: now,
    });

    await ctx.db.patch(application._id, {
      status: "undone",
      undoneAt: now,
      updatedAt: now,
    });

    return {
      undone: true,
    };
  },
});
