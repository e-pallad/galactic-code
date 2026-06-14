import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getUser } from "@/lib/missions"
import { z } from "zod"

const schema = z.object({
  track: z.enum(["javascript", "python"]),
  dailyGoalMissions: z.number().int().min(1).max(10),
})

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await db.update(users)
    .set({
      track: parsed.data.track,
      dailyGoalMissions: parsed.data.dailyGoalMissions,
      onboardingCompleted: true,
    })
    .where(eq(users.id, user.id))

  const response = NextResponse.json({ success: true })
  response.cookies.set("gc_onboarding", "1", { path: "/", maxAge: 60 * 60 * 24 * 365 })
  return response
}
