import { PLAN_LIMITS, Plan } from "./plans";

export function canAccess(
  plan: Plan,
  feature: keyof (typeof PLAN_LIMITS)["free"]
): boolean {
  const limit = PLAN_LIMITS[plan][feature];
  return limit === true || limit === Infinity || (typeof limit === "number" && limit > 0);
}
