export const PLAN_LIMITS = {
  free: {
    starSystems: Infinity,
    operations: Infinity,
    aiRecommendations: true,
    streakFreezes: 1,
  },
  pro: {
    starSystems: Infinity,
    operations: Infinity,
    aiRecommendations: true,
    streakFreezes: 3,
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;
