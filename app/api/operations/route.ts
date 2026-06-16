import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { operations } from "@/lib/db/schema"
import { getUser, awardXP, checkMedals } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES } from "@/lib/xp"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const createSchema = z.object({
  action: z.literal("create"),
  trackId: z.string(),
  systemNumber: z.number().int(),
  title: z.string().min(1),
  description: z.string().min(1),
})

const updateSchema = z.object({
  action: z.literal("update"),
  id: z.string().uuid(),
  repoUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
})

const completeSchema = z.object({
  action: z.literal("complete"),
  id: z.string().uuid(),
  repoUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
})

const schema = z.discriminatedUnion("action", [createSchema, updateSchema, completeSchema])

export async function POST(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (parsed.data.action === "create") {
    const { trackId, systemNumber, title, description } = parsed.data
    const [op] = await db.insert(operations).values({ userId: user.id, trackId, systemNumber, title, description }).returning()
    return NextResponse.json({ operation: op })
  }

  if (parsed.data.action === "update") {
    const { id, repoUrl, liveUrl } = parsed.data
    const [op] = await db.update(operations)
      .set({ ...(repoUrl ? { repoUrl } : {}), ...(liveUrl ? { liveUrl } : {}), status: "IN_PROGRESS" })
      .where(and(eq(operations.id, id), eq(operations.userId, user.id)))
      .returning()
    return NextResponse.json({ operation: op })
  }

  if (parsed.data.action === "complete") {
    const { id, repoUrl, liveUrl } = parsed.data
    const [op] = await db.update(operations)
      .set({ status: "COMPLETED", xpEarned: XP_VALUES.COMPLETE_OPERATION, completedAt: new Date(), ...(repoUrl ? { repoUrl } : {}), ...(liveUrl ? { liveUrl } : {}) })
      .where(and(eq(operations.id, id), eq(operations.userId, user.id)))
      .returning()
    await awardXP(user.id, XP_VALUES.COMPLETE_OPERATION)
    await checkMedals(user.id)
    return NextResponse.json({ operation: op })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
