import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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
