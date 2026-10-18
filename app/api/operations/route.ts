import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { operations, starSystems } from "@/lib/db/schema"
import { getUser, awardXP, checkMedals } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES } from "@/lib/xp"
import { eq, and, ne } from "drizzle-orm"
import { z } from "zod"
import { httpUrl } from "@/lib/validation"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"
import { requireUnlock } from "@/lib/unlocks-server"
import { readJson } from "@/lib/http"

const createSchema = z.object({
  action: z.literal("create"),
  trackId: z.string().min(1).max(50),
  systemNumber: z.number().int().min(1).max(100),
})

const updateSchema = z.object({
  action: z.literal("update"),
  id: z.string().uuid(),
  repoUrl: httpUrl.optional(),
  liveUrl: httpUrl.optional(),
})

const completeSchema = z.object({
  action: z.literal("complete"),
  id: z.string().uuid(),
  repoUrl: httpUrl,
  liveUrl: httpUrl.optional(),
})

const schema = z.discriminatedUnion("action", [createSchema, updateSchema, completeSchema])

export async function POST(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await readJson(req)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const locked = await requireUnlock(user, "/operations")
  if (locked) return locked

  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  if (parsed.data.action === "create") {
    const { trackId, systemNumber } = parsed.data
    // Only real star systems have operations, and their title/brief come from the
    // system itself rather than from the client.
    const [system] = await db.select().from(starSystems)
      .where(and(eq(starSystems.trackId, trackId), eq(starSystems.number, systemNumber)))
      .limit(1)
    if (!system) return NextResponse.json({ error: "Unknown star system" }, { status: 404 })

    const [created] = await db.insert(operations)
      .values({ userId: user.id, trackId, systemNumber, title: system.operationTitle, description: system.operationDescription })
      .onConflictDoNothing()
      .returning()
    if (created) return NextResponse.json({ operation: created })

    const [existing] = await db.select().from(operations)
      .where(and(eq(operations.userId, user.id), eq(operations.trackId, trackId), eq(operations.systemNumber, systemNumber)))
      .limit(1)
    return NextResponse.json({ operation: existing ?? null })
  }

  if (parsed.data.action === "update") {
    const { id, repoUrl, liveUrl } = parsed.data
    const [op] = await db.update(operations)
      .set({ ...(repoUrl ? { repoUrl } : {}), ...(liveUrl ? { liveUrl } : {}), status: "IN_PROGRESS" })
      .where(and(eq(operations.id, id), eq(operations.userId, user.id), ne(operations.status, "COMPLETED")))
      .returning()
    // A completed operation is final: updating it must not reopen it, or it could be completed (and paid) again.
    return NextResponse.json({ operation: op ?? null })
  }

  if (parsed.data.action === "complete") {
    const { id, repoUrl, liveUrl } = parsed.data
    // Only update and award XP if not already completed
    const [op] = await db.update(operations)
      .set({ status: "COMPLETED", xpEarned: XP_VALUES.COMPLETE_OPERATION, completedAt: new Date(), ...(repoUrl ? { repoUrl } : {}), ...(liveUrl ? { liveUrl } : {}) })
      .where(and(eq(operations.id, id), eq(operations.userId, user.id), ne(operations.status, "COMPLETED")))
      .returning()
    if (op) {
      await awardXP(user.id, XP_VALUES.COMPLETE_OPERATION)
      await checkMedals(user.id)
    }
    return NextResponse.json({ operation: op ?? null })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
