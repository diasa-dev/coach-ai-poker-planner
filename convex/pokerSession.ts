import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const sessionEventType = v.union(
  v.literal("started"),
  v.literal("checkup"),
  v.literal("hand"),
  v.literal("note"),
  v.literal("microIntention"),
  v.literal("paused"),
  v.literal("resumed"),
  v.literal("finished"),
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

async function getActiveSession(ctx: QueryCtx | MutationCtx, userId: string) {
  const activeSessions = await ctx.db
    .query("pokerSessions")
    .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "active"))
    .collect();

  return activeSessions.sort((a, b) => b.startedAt - a.startedAt)[0] ?? null;
}

async function insertEvent(
  ctx: MutationCtx,
  args: {
    userId: string;
    sessionId: Id<"pokerSessions">;
    type: "started" | "checkup" | "hand" | "note" | "microIntention" | "paused" | "resumed" | "finished";
    title: string;
    detail: string;
    template?: string;
    note?: string;
    energy?: number;
    focusScore?: number;
    tilt?: number;
    tables?: number;
    createdAt: number;
  },
) {
  await ctx.db.insert("pokerSessionEvents", {
    userId: args.userId,
    sessionId: args.sessionId,
    type: args.type,
    title: args.title,
    detail: args.detail,
    template: args.template,
    note: args.note,
    energy: args.energy,
    focusScore: args.focusScore,
    tilt: args.tilt,
    tables: args.tables,
    createdAt: args.createdAt,
  });
}

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await getActiveSession(ctx, userId);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const sessions = await ctx.db
      .query("pokerSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", userId))
      .collect();

    return sessions.sort((a, b) => b.startedAt - a.startedAt).slice(0, 20);
  },
});

export const listEvents = query({
  args: {
    sessionId: v.optional(v.id("pokerSessions")),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = args.sessionId ? await ctx.db.get(args.sessionId) : await getActiveSession(ctx, userId);

    if (!session || session.userId !== userId) return [];

    const events = await ctx.db
      .query("pokerSessionEvents")
      .withIndex("by_session", (q) => q.eq("sessionId", session._id))
      .collect();

    return events.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  },
});

export const start = mutation({
  args: {
    date: v.string(),
    weeklyPlanId: v.optional(v.id("weeklyPlans")),
    weeklyPlanBlockId: v.optional(v.id("weeklyPlanBlocks")),
    sessionFocus: v.string(),
    weeklyFocus: v.string(),
    blockLabel: v.optional(v.string()),
    maxTables: v.number(),
    energy: v.number(),
    focusScore: v.number(),
    tilt: v.number(),
    microIntention: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const existingActive = await getActiveSession(ctx, userId);

    if (existingActive) {
      return existingActive._id;
    }

    const sessionId = await ctx.db.insert("pokerSessions", {
      userId,
      date: args.date,
      weeklyPlanId: args.weeklyPlanId,
      weeklyPlanBlockId: args.weeklyPlanBlockId,
      status: "active",
      sessionFocus: args.sessionFocus.trim() || "Sessão MTT",
      weeklyFocus: args.weeklyFocus,
      blockLabel: args.blockLabel,
      maxTables: args.maxTables,
      currentTables: args.maxTables,
      energy: args.energy,
      focusScore: args.focusScore,
      tilt: args.tilt,
      handsToReview: 0,
      microIntention: args.microIntention?.trim() || undefined,
      isPaused: false,
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await insertEvent(ctx, {
      userId,
      sessionId,
      type: "started",
      title: "Sessão iniciada",
      detail: `Foco · ${args.sessionFocus.trim() || "Sessão MTT"}`,
      createdAt: now,
    });

    if (args.microIntention?.trim()) {
      await insertEvent(ctx, {
        userId,
        sessionId,
        type: "microIntention",
        title: "Micro-intenção",
        detail: args.microIntention.trim(),
        createdAt: now + 1,
      });
    }

    return sessionId;
  },
});

export const addEvent = mutation({
  args: {
    sessionId: v.id("pokerSessions"),
    type: sessionEventType,
    title: v.string(),
    detail: v.string(),
    template: v.optional(v.string()),
    note: v.optional(v.string()),
    energy: v.optional(v.number()),
    focusScore: v.optional(v.number()),
    tilt: v.optional(v.number()),
    tables: v.optional(v.number()),
    microIntention: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);

    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    const now = Date.now();

    await insertEvent(ctx, {
      userId,
      sessionId: session._id,
      type: args.type,
      title: args.title,
      detail: args.detail,
      template: args.template,
      note: args.note,
      energy: args.energy,
      focusScore: args.focusScore,
      tilt: args.tilt,
      tables: args.tables,
      createdAt: now,
    });

    await ctx.db.patch(session._id, {
      energy: args.energy ?? session.energy,
      focusScore: args.focusScore ?? session.focusScore,
      tilt: args.tilt ?? session.tilt,
      currentTables: args.tables ?? session.currentTables,
      handsToReview: args.type === "hand" ? session.handsToReview + 1 : session.handsToReview,
      microIntention: args.microIntention ?? session.microIntention,
      updatedAt: now,
    });

    return null;
  },
});

export const togglePause = mutation({
  args: {
    sessionId: v.id("pokerSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);

    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    const now = Date.now();
    const nextPaused = !session.isPaused;

    await ctx.db.patch(session._id, {
      isPaused: nextPaused,
      updatedAt: now,
    });

    await insertEvent(ctx, {
      userId,
      sessionId: session._id,
      type: nextPaused ? "paused" : "resumed",
      title: nextPaused ? "Sessão em pausa" : "Sessão retomada",
      detail: nextPaused ? "Pausa registada" : "Sessão retomada",
      createdAt: now,
    });

    return null;
  },
});

export const finish = mutation({
  args: {
    sessionId: v.id("pokerSessions"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);

    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    const now = Date.now();

    await ctx.db.patch(session._id, {
      status: "reviewPending",
      endedAt: now,
      isPaused: false,
      updatedAt: now,
    });

    await insertEvent(ctx, {
      userId,
      sessionId: session._id,
      type: "finished",
      title: "Sessão terminada",
      detail: "Review pendente",
      createdAt: now,
    });

    return null;
  },
});

export const confirmReview = mutation({
  args: {
    sessionId: v.id("pokerSessions"),
    tournamentsPlayed: v.number(),
    decisionQuality: v.number(),
    finalFocus: v.number(),
    finalEnergy: v.number(),
    finalTilt: v.number(),
    goodDecision: v.optional(v.string()),
    mainLeak: v.optional(v.string()),
    nextAction: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const session = await ctx.db.get(args.sessionId);

    if (!session || session.userId !== userId) {
      throw new Error("Session not found");
    }

    const now = Date.now();
    const endedAt = session.endedAt ?? now;

    await ctx.db.patch(session._id, {
      status: "reviewed",
      tournamentsPlayed: Math.max(0, args.tournamentsPlayed),
      decisionQuality: args.decisionQuality,
      finalFocus: args.finalFocus,
      finalEnergy: args.finalEnergy,
      finalTilt: args.finalTilt,
      focusScore: args.finalFocus,
      energy: args.finalEnergy,
      tilt: args.finalTilt,
      goodDecision: args.goodDecision?.trim() || undefined,
      mainLeak: args.mainLeak?.trim() || undefined,
      nextAction: args.nextAction?.trim() || undefined,
      isPaused: false,
      endedAt,
      reviewedAt: now,
      updatedAt: now,
    });

    await insertEvent(ctx, {
      userId,
      sessionId: session._id,
      type: "finished",
      title: "Review confirmada",
      detail: `Qualidade ${args.decisionQuality}/5 · Tilt final ${args.finalTilt}/5`,
      createdAt: now,
    });

    return null;
  },
});
