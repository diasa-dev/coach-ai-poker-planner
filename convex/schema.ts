import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userPreferences: defineTable({
    userId: v.string(),
    weekStartDay: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  weeklyPlans: defineTable({
    userId: v.string(),
    weekStartDate: v.string(),
    focus: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("reviewed"),
      v.literal("archived"),
    ),
    coachReviewSummary: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_week", ["userId", "weekStartDate"]),

  weeklyPlanBlocks: defineTable({
    userId: v.string(),
    weeklyPlanId: v.id("weeklyPlans"),
    dayIndex: v.number(),
    type: v.union(
      v.literal("grind"),
      v.literal("study"),
      v.literal("review"),
      v.literal("sport"),
      v.literal("rest"),
      v.literal("admin"),
    ),
    title: v.string(),
    targetLabel: v.optional(v.string()),
    targetUnit: v.optional(v.string()),
    targetValue: v.optional(v.number()),
    studyType: v.optional(v.string()),
    status: v.union(
      v.literal("planned"),
      v.literal("done"),
      v.literal("adjusted"),
      v.literal("notDone"),
    ),
    statusReason: v.optional(v.string()),
    note: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_plan", ["weeklyPlanId"])
    .index("by_user_plan", ["userId", "weeklyPlanId"]),

  dailyPlans: defineTable({
    userId: v.string(),
    date: v.string(),
    weeklyPlanId: v.optional(v.id("weeklyPlans")),
    status: v.union(v.literal("prepared"), v.literal("closed")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  dailyCommitments: defineTable({
    userId: v.string(),
    dailyPlanId: v.id("dailyPlans"),
    sourceWeeklyPlanBlockId: v.optional(v.id("weeklyPlanBlocks")),
    kind: v.string(),
    title: v.string(),
    estimate: v.string(),
    status: v.union(
      v.literal("planned"),
      v.literal("done"),
      v.literal("adjusted"),
      v.literal("notDone"),
    ),
    reason: v.optional(v.string()),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_daily_plan", ["dailyPlanId"])
    .index("by_user_daily_plan", ["userId", "dailyPlanId"]),

  pokerSessions: defineTable({
    userId: v.string(),
    date: v.string(),
    weeklyPlanId: v.optional(v.id("weeklyPlans")),
    weeklyPlanBlockId: v.optional(v.id("weeklyPlanBlocks")),
    status: v.union(
      v.literal("active"),
      v.literal("reviewPending"),
      v.literal("reviewed"),
    ),
    sessionFocus: v.string(),
    weeklyFocus: v.string(),
    blockLabel: v.optional(v.string()),
    maxTables: v.number(),
    currentTables: v.number(),
    energy: v.number(),
    focusScore: v.number(),
    tilt: v.number(),
    handsToReview: v.number(),
    microIntention: v.optional(v.string()),
    isPaused: v.boolean(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_user_date", ["userId", "date"]),

  pokerSessionEvents: defineTable({
    userId: v.string(),
    sessionId: v.id("pokerSessions"),
    type: v.union(
      v.literal("started"),
      v.literal("checkup"),
      v.literal("hand"),
      v.literal("note"),
      v.literal("microIntention"),
      v.literal("paused"),
      v.literal("resumed"),
      v.literal("finished"),
    ),
    title: v.string(),
    detail: v.string(),
    template: v.optional(v.string()),
    note: v.optional(v.string()),
    energy: v.optional(v.number()),
    focusScore: v.optional(v.number()),
    tilt: v.optional(v.number()),
    tables: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user_session", ["userId", "sessionId"]),

  dailyCheckIns: defineTable({
    userId: v.string(),
    date: v.string(),
    sleep: v.number(),
    energy: v.number(),
    focus: v.number(),
    stress: v.number(),
    priority: v.string(),
    updatedAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  commitments: defineTable({
    userId: v.string(),
    date: v.string(),
    title: v.string(),
    detail: v.string(),
    phase: v.string(),
    tone: v.union(v.literal("default"), v.literal("accent"), v.literal("soft")),
    done: v.boolean(),
    order: v.number(),
    updatedAt: v.number(),
  }).index("by_user_date", ["userId", "date"]),
});
