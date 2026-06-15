export const runtime = "edge"

import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

async function getRedis() {
  const { Redis } = await import("@upstash/redis")
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
}

const PRESENCE_KEY = "galactic:crew:presence"

export async function GET() {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendCount = async () => {
        try {
          const redis = await getRedis()
          const keys = await redis.keys(`${PRESENCE_KEY}:*`)
          const data = JSON.stringify({ count: keys.length })
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

export async function POST(_req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const redis = await getRedis()
  await redis.setex(`${PRESENCE_KEY}:${userId}`, 60, "1")
  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const redis = await getRedis()
  await redis.del(`${PRESENCE_KEY}:${userId}`)
  return NextResponse.json({ success: true })
}
