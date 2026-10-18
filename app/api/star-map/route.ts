import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { starMapProgress } from "@/lib/db/schema"
import { getUser, awardXP } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES } from "@/lib/xp"
import { getStarMap, findStarMapNode } from "@/lib/star-maps"
import { and, eq, isNull } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"

const schema = z.object({
  roadmapSlug: z.string().min(1).max(64),
  nodeId: z.string().min(1).max(64),
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

  const { roadmapSlug, nodeId, completed } = parsed.data

  // Only nodes that exist in the roadmap count; the node type (and so the reward)
  // comes from the roadmap, never from the client.
  const map = await getStarMap(roadmapSlug)
  const node = map ? findStarMapNode(map.nodes, nodeId) : null
  if (!node) return NextResponse.json({ error: "Unknown roadmap node" }, { status: 404 })

  const status = completed ? "COMPLETED" : "NOT_STARTED"

  const [progress] = await db
    .insert(starMapProgress)
    .values({ userId: user.id, roadmapSlug, nodeId, nodeType: node.type, status, completedAt: completed ? new Date() : null })
    .onConflictDoUpdate({
      target: [starMapProgress.userId, starMapProgress.roadmapSlug, starMapProgress.nodeId],
      set: { status, completedAt: completed ? new Date() : null },
    })
    .returning()

  if (completed) {
    // One-time claim: only the request that flips xp_awarded_at from NULL pays, so
    // un-checking and re-checking a node (or racing requests) can't pay it twice.
    const claimed = await db
      .update(starMapProgress)
      .set({ xpAwardedAt: new Date() })
      .where(and(eq(starMapProgress.id, progress.id), isNull(starMapProgress.xpAwardedAt)))
      .returning({ id: starMapProgress.id })

    if (claimed.length > 0) {
      await awardXP(user.id, node.type === "topic" ? XP_VALUES.STAR_MAP_TOPIC : XP_VALUES.STAR_MAP_SUBTOPIC)
    }
  }

  return NextResponse.json({ progress })
}
