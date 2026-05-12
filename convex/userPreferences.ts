import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const defaultWeekStartDay = 1;
const defaultHandReviewTemplates = [
  "Geral",
  "Pote grande",
  "ICM",
  "Bluff catch",
  "All-in marginal",
  "River difícil",
  "Exploit / read",
  "Erro emocional",
];

async function requireUserId(ctx: {
  auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Not authenticated");
  }

  return identity.subject;
}

async function getPreference(ctx: QueryCtx | MutationCtx, userId: string) {
  return await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique();
}

function normalizeHandReviewTemplates(values: string[]) {
  const seen = new Set<string>();
  const templates = values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLocaleLowerCase("pt-PT");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);

  return templates.length ? templates : defaultHandReviewTemplates;
}

export const getSessionCaptureSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const preference = await getPreference(ctx, userId);

    return {
      handReviewTemplates: normalizeHandReviewTemplates(
        preference?.handReviewTemplates ?? defaultHandReviewTemplates,
      ),
      enableHandScreenshotUrl: preference?.enableHandScreenshotUrl ?? true,
    };
  },
});

export const saveSessionCaptureSettings = mutation({
  args: {
    handReviewTemplates: v.array(v.string()),
    enableHandScreenshotUrl: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await getPreference(ctx, userId);
    const now = Date.now();
    const handReviewTemplates = normalizeHandReviewTemplates(args.handReviewTemplates);

    if (existing) {
      await ctx.db.patch(existing._id, {
        handReviewTemplates,
        enableHandScreenshotUrl: args.enableHandScreenshotUrl,
        updatedAt: now,
      });
      return null;
    }

    await ctx.db.insert("userPreferences", {
      userId,
      weekStartDay: defaultWeekStartDay,
      handReviewTemplates,
      enableHandScreenshotUrl: args.enableHandScreenshotUrl,
      updatedAt: now,
    });

    return null;
  },
});
