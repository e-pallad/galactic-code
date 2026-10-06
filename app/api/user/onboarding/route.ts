import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, tracks } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { getUser } from "@/lib/missions"
import { getClerkId, isDemo } from "@/lib/auth"
import { isValidTimezone } from "@/lib/timezone"
import { z } from "zod"

const schema = z.object({
  track: z.string().min(1).max(50),
  dailyGoalMissions: z.number().int().min(1).max(10),
  timezone: z.string().max(64).optional(),
  explorerMode: z.boolean().optional(),
})

export async function POST(req: Request) {
  if (await isDemo()) return NextResponse.json({ error: "Demo mode is read-only" }, { status: 403 })

  const userId = await getClerkId()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const [track] = await db
    .select({ id: tracks.id })
    .from(tracks)
    .where(and(eq(tracks.id, parsed.data.track), eq(tracks.isActive, true)))
    .limit(1)
  if (!track) return NextResponse.json({ error: "Unknown track" }, { status: 400 })

  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const timezone =
    parsed.data.timezone && isValidTimezone(parsed.data.timezone) ? parsed.data.timezone : undefined

  await db.update(users)
    .set({
      track: parsed.data.track,
      dailyGoalMissions: parsed.data.dailyGoalMissions,
      ...(timezone ? { timezone } : {}),
      ...(parsed.data.explorerMode !== undefined ? { explorerMode: parsed.data.explorerMode } : {}),
      onboardingCompleted: true,
    })
    .where(eq(users.id, user.id))

  const response = NextResponse.json({ success: true })
  response.cookies.set("gc_onboarding", "1", { path: "/", maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax" })
  return response
}
