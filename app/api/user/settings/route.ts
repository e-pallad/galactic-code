import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUser } from "@/lib/missions"

const bodySchema = z.object({
  name: z.string().max(100).optional(),
  dailyGoalMissions: z.number().int().min(1).max(10).optional(),
  weeklyGoalMissions: z.number().int().min(5).max(50).optional(),
  showOnLeaderboard: z.boolean().optional(),
})

export async function PATCH(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUser(clerkId)
  if (!user) return Response.json({ error: "User not found" }, { status: 404 })

  const body = await req.json()
  const result = bodySchema.safeParse(body)
  if (!result.success) return Response.json({ error: result.error.flatten() }, { status: 422 })

  const updates: Record<string, unknown> = {}
  if (result.data.name !== undefined) updates.name = result.data.name
  if (result.data.dailyGoalMissions !== undefined) updates.dailyGoalMissions = result.data.dailyGoalMissions
  if (result.data.weeklyGoalMissions !== undefined) updates.weeklyGoalMissions = result.data.weeklyGoalMissions
  if (result.data.showOnLeaderboard !== undefined) updates.showOnLeaderboard = result.data.showOnLeaderboard

  if (Object.keys(updates).length === 0) return Response.json({ success: true })

  await db.update(users).set(updates).where(eq(users.id, user.id))
  return Response.json({ success: true })
}
