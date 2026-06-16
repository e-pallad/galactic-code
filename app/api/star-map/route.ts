import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { starMapProgress } from "@/lib/db/schema"
import { getUser, awardXP } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES } from "@/lib/xp"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

const schema = z.object({
  roadmapSlug: z.string().min(1),
  nodeId: z.string().min(1),
  nodeType: z.enum(["topic", "subtopic"]),
  completed: z.boolean(),
})

export async function POST(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  const { roadmapSlug, nodeId, nodeType, completed } = parsed.data
  const status = completed ? "COMPLETED" : "NOT_STARTED"

  // Read existing status before upsert to avoid re-awarding XP on re-toggle
  const [existing] = await db
    .select({ status: starMapProgress.status })
    .from(starMapProgress)
    .where(and(
      eq(starMapProgress.userId, user.id),
      eq(starMapProgress.roadmapSlug, roadmapSlug),
      eq(starMapProgress.nodeId, nodeId)
    ))
    .limit(1)

  const wasCompleted = existing?.status === "COMPLETED"

  const [progress] = await db
    .insert(starMapProgress)
    .values({ userId: user.id, roadmapSlug, nodeId, nodeType, status, completedAt: completed ? new Date() : null })
    .onConflictDoUpdate({
      target: [starMapProgress.userId, starMapProgress.roadmapSlug, starMapProgress.nodeId],
      set: { status, completedAt: completed ? new Date() : null },
    })
    .returning()

  if (completed && !wasCompleted) {
    const xp = nodeType === "topic" ? XP_VALUES.STAR_MAP_TOPIC : XP_VALUES.STAR_MAP_SUBTOPIC
    await awardXP(user.id, xp)
  }

  return NextResponse.json({ progress })
}
