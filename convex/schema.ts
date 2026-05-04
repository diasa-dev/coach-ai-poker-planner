import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userPreferences: defineTable({
    userId: v.string(),
    weekStartDay: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  annualPlans: defineTable({
    userId: v.string(),
    year: v.number(),
    primaryDirection: v.string(),
    priorities: v.array(v.string()),
    nonNegotiables: v.array(v.string()),
    avoidRepeating: v.string(),
    decisionRule: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_year", ["userId", "year"]),

  annualOperatingTargets: defineTable({
    userId: v.string(),
    year: v.number(),
    metricKey: v.string(),
    label: v.string(),
    category: v.union(
      v.literal("grind"),
      v.literal("study"),
      v.literal("review"),
      v.literal("sport"),
      v.literal("recovery"),
      v.literal("custom"),
    ),
    unit: v.string(),
    cadence: v.union(v.literal("weekly"), v.literal("monthly")),
    targetValue: v.number(),
    effectiveFrom: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_year", ["userId", "year"])
    .index("by_user_year_metric", ["userId", "year", "metricKey"]),

  monthlyTargets: defineTable({
    userId: v.string(),
    month: v.string(),
    category: v.union(
      v.literal("grind"),
      v.literal("study"),
      v.literal("review"),
      v.literal("sport"),
    ),
    primaryUnit: v.string(),
    targetValue: v.number(),
    optionalSecondaryUnit: v.optional(v.string()),
    optionalSecondaryTargetValue: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_month", ["userId", "month"])
    .index("by_user_month_category", ["userId", "month", "category"]),

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
    source: v.optional(v.literal("coachProposal")),
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

  weeklyReviews: defineTable({
    userId: v.string(),
    weekStartDate: v.string(),
    weeklyPlanId: v.optional(v.id("weeklyPlans")),
    status: v.union(
      v.literal("draft"),
      v.literal("completed"),
      v.literal("skipped"),
    ),
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
    completedAt: v.optional(v.number()),
    skippedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_week", ["userId", "weekStartDate"]),

  coachProposalApplications: defineTable({
    userId: v.string(),
    weekStartDate: v.string(),
    weeklyPlanId: v.id("weeklyPlans"),
    proposalTitle: v.string(),
    status: v.union(v.literal("applied"), v.literal("undone"), v.literal("expired")),
    beforeBlocks: v.array(
      v.object({
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
        source: v.optional(v.literal("coachProposal")),
        status: v.union(
          v.literal("planned"),
          v.literal("done"),
          v.literal("adjusted"),
          v.literal("notDone"),
        ),
        order: v.number(),
      }),
    ),
    afterBlocks: v.array(
      v.object({
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
        source: v.optional(v.literal("coachProposal")),
        status: v.union(
          v.literal("planned"),
          v.literal("done"),
          v.literal("adjusted"),
          v.literal("notDone"),
        ),
        order: v.number(),
      }),
    ),
    appliedAt: v.number(),
    undoExpiresAt: v.number(),
    undoneAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_week", ["userId", "weekStartDate"])
    .index("by_user_status", ["userId", "status"]),

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
    tournamentsPlayed: v.optional(v.number()),
    decisionQuality: v.optional(v.number()),
    finalFocus: v.optional(v.number()),
    finalEnergy: v.optional(v.number()),
    finalTilt: v.optional(v.number()),
    goodDecision: v.optional(v.string()),
    mainLeak: v.optional(v.string()),
    nextAction: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
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
