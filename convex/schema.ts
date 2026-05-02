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
