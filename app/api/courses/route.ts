import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { externalCourses } from "@/lib/db/schema"
import { getUser, awardXP } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { XP_VALUES, COURSE_REWARD_LIMITS } from "@/lib/xp"
import { httpUrl } from "@/lib/validation"
import { eq, and, gt, sql } from "drizzle-orm"
import { z } from "zod"
import { mutationRateLimit, applyRateLimit } from "@/lib/rate-limit"
import { readJson } from "@/lib/http"

const addSchema = z.object({
  action: z.literal("add"),
  platform: z.string().trim().min(1).max(100),
  url: httpUrl,
  title: z.string().trim().min(1).max(200),
  totalLessons: z.number().int().min(1).max(2000),
})

const progressSchema = z.object({
  action: z.literal("progress"),
  id: z.string().uuid(),
  completedLessons: z.number().int().min(0).max(2000),
})

const completeSchema = z.object({
  action: z.literal("complete"),
  id: z.string().uuid(),
})

const schema = z.discriminatedUnion("action", [addSchema, progressSchema, completeSchema])

export async function POST(req: Request) {
  const clerkId = await getClerkId()
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await readJson(req)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  const user = await getUser(clerkId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const limited = await applyRateLimit(mutationRateLimit, user.id)
  if (limited) return limited

  if (parsed.data.action === "add") {
    const { platform, url, title, totalLessons } = parsed.data

    const mine = await db
      .select({ url: externalCourses.url })
      .from(externalCourses)
      .where(eq(externalCourses.userId, user.id))
    if (mine.length >= COURSE_REWARD_LIMITS.maxTracked) {
      return NextResponse.json({ error: "Course limit reached" }, { status: 409 })
    }
    if (mine.some((c) => c.url.toLowerCase() === url.toLowerCase())) {
      return NextResponse.json({ error: "Course already added" }, { status: 409 })
    }

    // Adding a course is free: XP is only paid for finishing one.
    const [course] = await db.insert(externalCourses).values({ userId: user.id, platform, url, title, totalLessons }).returning()
    return NextResponse.json({ course })
  }

  if (parsed.data.action === "progress") {
    const { id, completedLessons } = parsed.data
    const [course] = await db.update(externalCourses)
      .set({ completedLessons: sql`LEAST(${completedLessons}, ${externalCourses.totalLessons})` })
      .where(and(eq(externalCourses.id, id), eq(externalCourses.userId, user.id), eq(externalCourses.isCompleted, false)))
      .returning()
    return NextResponse.json({ course: course ?? null })
  }

  if (parsed.data.action === "complete") {
    const { id } = parsed.data

    const [target] = await db
      .select({ totalLessons: externalCourses.totalLessons })
      .from(externalCourses)
      .where(and(eq(externalCourses.id, id), eq(externalCourses.userId, user.id), eq(externalCourses.isCompleted, false)))
      .limit(1)
    if (!target) return NextResponse.json({ course: null })

    // Self-reported progress can't be verified, so rewards are capped: short
    // courses and anything past the daily allowance complete without XP.
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [recent] = await db
      .select({ count: sql<number>`count(*)` })
      .from(externalCourses)
      .where(and(eq(externalCourses.userId, user.id), gt(externalCourses.xpEarned, 0), gt(externalCourses.completedAt, dayAgo)))
    const rewarded =
      target.totalLessons >= COURSE_REWARD_LIMITS.minLessons &&
      Number(recent?.count ?? 0) < COURSE_REWARD_LIMITS.perDay
    const xp = rewarded ? XP_VALUES.COMPLETE_COURSE : 0

    // Atomic claim: only the request that flips isCompleted pays.
    const [course] = await db.update(externalCourses)
      .set({ isCompleted: true, completedAt: new Date(), completedLessons: externalCourses.totalLessons, xpEarned: xp })
      .where(and(eq(externalCourses.id, id), eq(externalCourses.userId, user.id), eq(externalCourses.isCompleted, false)))
      .returning()
    if (course && xp > 0) await awardXP(user.id, xp)
    return NextResponse.json({ course: course ?? null, xpEarned: course ? xp : 0 })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
