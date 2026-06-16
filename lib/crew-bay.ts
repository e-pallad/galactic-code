import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Sorted set where score = expiry Unix timestamp (seconds)
const PRESENCE_KEY = "galactic:crew:presence"

export async function setPresence(userId: string, ttlSeconds = 60): Promise<void> {
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds
  await redis.zadd(PRESENCE_KEY, { score: expiry, member: userId })
}

export async function removePresence(userId: string): Promise<void> {
  await redis.zrem(PRESENCE_KEY, userId)
}

export async function getCrewCount(): Promise<number> {
  const now = Math.floor(Date.now() / 1000)
  // Remove expired entries, then count remaining
  await redis.zremrangebyscore(PRESENCE_KEY, 0, now)
  return await redis.zcard(PRESENCE_KEY)
}
