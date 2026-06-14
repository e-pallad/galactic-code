import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const PRESENCE_KEY = "galactic:crew:presence"

export async function setPresence(userId: string, ttlSeconds = 60): Promise<void> {
  await redis.setex(`${PRESENCE_KEY}:${userId}`, ttlSeconds, "1")
}

export async function removePresence(userId: string): Promise<void> {
  await redis.del(`${PRESENCE_KEY}:${userId}`)
}

export async function getCrewCount(): Promise<number> {
  const keys = await redis.keys(`${PRESENCE_KEY}:*`)
  return keys.length
}
