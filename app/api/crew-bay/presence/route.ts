export const runtime = "edge"

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

const PRESENCE_KEY = "galactic:crew:presence"

async function getRedis() {
  const { Redis } = await import("@upstash/redis")
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

async function getCrewCount(redis: Awaited<ReturnType<typeof getRedis>>): Promise<number> {
  const now = Math.floor(Date.now() / 1000)
  await redis.zremrangebyscore(PRESENCE_KEY, 0, now)
  return await redis.zcard(PRESENCE_KEY)
}

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendCount = async () => {
        try {
          const redis = await getRedis()
          const count = await getCrewCount(redis)
          const data = JSON.stringify({ count })
          controller.enqueue(encoder.encode(`event: crew-count\ndata: ${data}\n\n`))
        } catch {}
      }

      await sendCount()
      const interval = setInterval(sendCount, 5000)

      const timeout = setTimeout(() => {
        clearInterval(interval)
        controller.close()
      }, 55000) // close before Vercel 60s limit

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const redis = await getRedis()
  const expiry = Math.floor(Date.now() / 1000) + 60
  await redis.zadd(PRESENCE_KEY, { score: expiry, member: userId })
  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const redis = await getRedis()
  await redis.zrem(PRESENCE_KEY, userId)
  return NextResponse.json({ success: true })
}
