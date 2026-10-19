import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { isDemo } from "@/lib/auth"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  analytics: true,
  prefix: "galactic:ai",
})

export const mutationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "galactic:mutation",
})

// Rewarded course completions: 2 per rolling 24h per pilot. Redis makes the slot
// reservation atomic, which a count-then-update in Postgres can't be.
export const courseRewardLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "24 h"),
  prefix: "galactic:course-reward",
})

export const demoRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "galactic:demo",
})

export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown"
}

export async function applyRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<NextResponse | null> {
  // Every demo visitor is the same shared user, so a per-user bucket would let one
  // noisy client lock everybody out: demo traffic is limited per IP instead.
  const key = (await isDemo()) ? `demo-ip:${await clientIp()}` : identifier
  const { success } = await limiter.limit(key)
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  return null
}
