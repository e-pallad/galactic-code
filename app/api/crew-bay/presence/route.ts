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

export async function GET(req: Request) {
  const encoder = new TextEncoder()
  let interval: ReturnType<typeof setInterval> | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined
  let closed = false

  // Runs on disconnect (cancel/abort), on the 55s cap and when the stream breaks.
  // A function returned from start() is ignored by ReadableStream, so the timers
  // must be torn down from here or they outlive the client.
  const stop = (controller?: ReadableStreamDefaultController) => {
    if (closed) return
    closed = true
    clearInterval(interval)
    clearTimeout(timeout)
    try { controller?.close() } catch {}
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendCount = async () => {
        if (closed) return
        let count: number
        try {
          count = await getCrewCount(await getRedis())
        } catch {
          return // transient Redis error: try again on the next tick
        }
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`event: crew-count\ndata: ${JSON.stringify({ count })}\n\n`))
        } catch {
          stop() // the client is gone
        }
      }

      req.signal.addEventListener("abort", () => stop(controller))
      await sendCount()
      if (closed) return
      interval = setInterval(sendCount, 5000)
      timeout = setTimeout(() => stop(controller), 55000) // close before Vercel 60s limit
    },
    cancel() {
      stop()
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
