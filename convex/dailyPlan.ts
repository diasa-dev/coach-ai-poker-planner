import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

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
