/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as annualOperatingTarget from "../annualOperatingTarget.js";
import type * as annualPlan from "../annualPlan.js";
import type * as coachProposal from "../coachProposal.js";
import type * as dailyPlan from "../dailyPlan.js";
import type * as monthlyTarget from "../monthlyTarget.js";
import type * as pokerSession from "../pokerSession.js";
import type * as studySession from "../studySession.js";
import type * as weeklyPlan from "../weeklyPlan.js";
import type * as weeklyReview from "../weeklyReview.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  annualOperatingTarget: typeof annualOperatingTarget;
  annualPlan: typeof annualPlan;
  coachProposal: typeof coachProposal;
  dailyPlan: typeof dailyPlan;
  monthlyTarget: typeof monthlyTarget;
  pokerSession: typeof pokerSession;
  studySession: typeof studySession;
  weeklyPlan: typeof weeklyPlan;
  weeklyReview: typeof weeklyReview;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
