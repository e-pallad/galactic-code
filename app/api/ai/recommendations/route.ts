import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { aiRecommendations } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq } from "drizzle-orm"
import Anthropic from "@anthropic-ai/sdk"
import { aiRateLimit, applyRateLimit } from "@/lib/rate-limit"

export async function GET() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ disabled: true })
  }

  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const [cached] = await db.select().from(aiRecommendations).where(eq(aiRecommendations.userId, user.id)).limit(1)
  if (cached && new Date(cached.expiresAt) > new Date()) {
    return NextResponse.json({ content: cached.content, cached: true })
  }

  return NextResponse.json({ content: null, cached: false })
}

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ disabled: true })
  }

  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const limited = await applyRateLimit(aiRateLimit, user.id)
  if (limited) return limited

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `You are a learning coach for Galactic Code, a space-themed programming platform.
The pilot's stats: Track=${user.track}, Rank=${user.rank}, XP=${user.totalXp}, Streak=${user.streak} days.
Give 3 specific, actionable recommendations to improve their coding journey. Keep it short, motivating, space-themed. Max 150 words.`,
    }],
  })

  const content = message.content[0]?.type === "text" ? message.content[0].text : ""
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await db.insert(aiRecommendations)
    .values({ userId: user.id, content, expiresAt })
    .onConflictDoUpdate({
      target: aiRecommendations.userId,
      set: { content, generatedAt: new Date(), expiresAt },
    })

  return NextResponse.json({ content, cached: false })
}
