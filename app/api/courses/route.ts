import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { externalCourses } from "@/lib/db/schema"
import { getUser, awardXP } from "@/lib/missions"
import { XP_VALUES } from "@/lib/xp"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

const addSchema = z.object({
  action: z.literal("add"),
  platform: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  totalLessons: z.number().int().min(1),
})

const progressSchema = z.object({
  action: z.literal("progress"),
  id: z.string().uuid(),
  completedLessons: z.number().int().min(0),
})

const completeSchema = z.object({
  action: z.literal("complete"),
  id: z.string().uuid(),
})

const schema = z.discriminatedUnion("action", [addSchema, progressSchema, completeSchema])

export async function POST(req: Request) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json() as unknown
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (parsed.data.action === "add") {
    const { platform, url, title, totalLessons } = parsed.data
    const [course] = await db.insert(externalCourses).values({ userId: user.id, platform, url, title, totalLessons }).returning()
    await awardXP(user.id, XP_VALUES.ADD_COURSE)
    return NextResponse.json({ course })
  }

  if (parsed.data.action === "progress") {
    const { id, completedLessons } = parsed.data
    const [course] = await db.update(externalCourses)
      .set({ completedLessons })
      .where(and(eq(externalCourses.id, id), eq(externalCourses.userId, user.id)))
      .returning()
    return NextResponse.json({ course })
  }

  if (parsed.data.action === "complete") {
    const { id } = parsed.data
    const [course] = await db.update(externalCourses)
      .set({ isCompleted: true, completedAt: new Date(), xpEarned: XP_VALUES.COMPLETE_COURSE })
      .where(and(eq(externalCourses.id, id), eq(externalCourses.userId, user.id)))
      .returning()
    await awardXP(user.id, XP_VALUES.COMPLETE_COURSE)
    return NextResponse.json({ course })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
