import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  name: z.string().max(100).optional(),
  showOnLeaderboard: z.boolean().optional(),
  dailyGoalMissions: z.number().int().min(1).max(10).optional(),
  weeklyGoalMissions: z.number().int().min(1).max(100).optional(),
})

export async function PATCH(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const updates: Partial<typeof users.$inferInsert> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.showOnLeaderboard !== undefined) updates.showOnLeaderboard = parsed.data.showOnLeaderboard
  if (parsed.data.dailyGoalMissions !== undefined) updates.dailyGoalMissions = parsed.data.dailyGoalMissions
  if (parsed.data.weeklyGoalMissions !== undefined) updates.weeklyGoalMissions = parsed.data.weeklyGoalMissions

  await db.update(users).set(updates).where(eq(users.id, user.id))
  return NextResponse.json({ success: true })
}
