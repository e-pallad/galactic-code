import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, tracks } from "@/lib/db/schema"
import { getUser } from "@/lib/missions"
import { getClerkId, isDemo } from "@/lib/auth"
import { isValidTimezone } from "@/lib/timezone"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  track: z.string().min(1).max(50).optional(),
  timezone: z.string().max(64).optional(),
  showOnLeaderboard: z.boolean().optional(),
  emailOptOut: z.boolean().optional(),
  explorerMode: z.boolean().optional(),
  dailyGoalMissions: z.number().int().min(1).max(10).optional(),
  weeklyGoalMissions: z.number().int().min(1).max(100).optional(),
})

export async function PATCH(req: Request) {
  if (await isDemo()) return NextResponse.json({ error: "Demo mode is read-only" }, { status: 403 })

  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (parsed.data.track !== undefined) {
    const [track] = await db
      .select({ id: tracks.id })
      .from(tracks)
      .where(and(eq(tracks.id, parsed.data.track), eq(tracks.isActive, true)))
      .limit(1)
    if (!track) return NextResponse.json({ error: "Unknown track" }, { status: 400 })
  }

  const updates: Partial<typeof users.$inferInsert> = {}
  if (parsed.data.name !== undefined) updates.name = parsed.data.name
  if (parsed.data.track !== undefined) updates.track = parsed.data.track
  if (parsed.data.timezone !== undefined && isValidTimezone(parsed.data.timezone)) updates.timezone = parsed.data.timezone
  if (parsed.data.showOnLeaderboard !== undefined) updates.showOnLeaderboard = parsed.data.showOnLeaderboard
  if (parsed.data.emailOptOut !== undefined) updates.emailOptOut = parsed.data.emailOptOut
  if (parsed.data.explorerMode !== undefined) updates.explorerMode = parsed.data.explorerMode
  if (parsed.data.dailyGoalMissions !== undefined) updates.dailyGoalMissions = parsed.data.dailyGoalMissions
  if (parsed.data.weeklyGoalMissions !== undefined) updates.weeklyGoalMissions = parsed.data.weeklyGoalMissions

  await db.update(users).set(updates).where(eq(users.id, user.id))
  return NextResponse.json({ success: true })
}
