import { differenceInCalendarDays, startOfDay } from "date-fns"
import { db } from "@/lib/db"
import { users, dailyLogs, medals } from "@/lib/db/schema"
import { eq, sql, isNull, and } from "drizzle-orm"
import { getRankFromXP, XP_VALUES, MEDAL_DEFINITIONS } from "@/lib/xp"
import type { User } from "@/lib/db/schema"

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function getUser(clerkId: string): Promise<User | null> {
  const result = await db.select().from(users).where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt))).limit(1)
  return result[0] ?? null
}

export async function syncUser(
  clerkId: string,
  data: { email: string; name?: string | null; avatarUrl?: string | null }
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({ clerkId, email: data.email, name: data.name, avatarUrl: data.avatarUrl })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { email: data.email, name: data.name ?? undefined, avatarUrl: data.avatarUrl ?? undefined },
    })
    .returning()
  return user
}

export async function deleteUser(clerkId: string): Promise<void> {
  await db
    .update(users)
    .set({ deletedAt: new Date(), email: "deleted@void.space", name: null, avatarUrl: null, showOnLeaderboard: false })
    .where(eq(users.clerkId, clerkId))
}

export async function awardXP(
  userId: string,
  amount: number,
  opts: { tx?: DbTx; date?: Date } = {}
): Promise<{ leveledUp: boolean; newRank: number; newXp: number }> {
  const db_ = opts.tx ?? db
  const [user] = await db_.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new Error("User not found")

  const newXp = user.totalXp + amount
  const newRank = getRankFromXP(newXp)
  const leveledUp = newRank > user.rank

  await db_.update(users).set({ totalXp: newXp, rank: newRank }).where(eq(users.id, userId))

  const today = opts.date ?? new Date()
  const dateOnly = startOfDay(today).toISOString().slice(0, 10)

  await (db_ as typeof db)
    .insert(dailyLogs)
    .values({ userId, date: dateOnly, xpEarned: amount })
    .onConflictDoUpdate({
      target: [dailyLogs.userId, dailyLogs.date],
      set: { xpEarned: sql`${dailyLogs.xpEarned} + ${amount}` },
    })

  return { leveledUp, newRank, newXp }
}

export async function awardDailyLoginXP(userId: string): Promise<void> {
  const today = startOfDay(new Date()).toISOString().slice(0, 10)
  const result = await db
    .insert(dailyLogs)
    .values({ userId, date: today, xpEarned: 0 })
    .onConflictDoNothing()
    .returning()
  if (result.length > 0) await awardXP(userId, XP_VALUES.DAILY_LOGIN)
}

export async function updateStreak(userId: string): Promise<number> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new Error("User not found")

  const today = startOfDay(new Date())
  const lastSeen = user.lastSeenAt ? startOfDay(new Date(user.lastSeenAt)) : null

  let newStreak = user.streak
  let usedFreeze = false

  if (!lastSeen) {
    newStreak = 1
  } else {
    const gap = differenceInCalendarDays(today, lastSeen)
    if (gap === 0) return user.streak
    if (gap === 1) {
      newStreak = user.streak + 1
    } else if (gap === 2) {
      const freezeAvailable =
        !user.streakFreezeUsedAt ||
        differenceInCalendarDays(today, startOfDay(new Date(user.streakFreezeUsedAt))) >= 7
      if (freezeAvailable) { usedFreeze = true; newStreak = user.streak + 1 }
      else newStreak = 1
    } else {
      newStreak = 1
    }
  }

  await db
    .update(users)
    .set({ streak: newStreak, lastSeenAt: new Date(), ...(usedFreeze ? { streakFreezeUsedAt: new Date() } : {}) })
    .where(eq(users.id, userId))

  if (user.streak < 7 && newStreak >= 7) await awardXP(userId, XP_VALUES.STREAK_BONUS_7)
  if (user.streak < 30 && newStreak >= 30) await awardXP(userId, XP_VALUES.STREAK_BONUS_30)

  return newStreak
}

export async function checkMedals(userId: string): Promise<string[]> {
  const schema = await import("@/lib/db/schema")

  const [user, existingMedals, mCount, opCount, aCount, pCount, peCount] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1).then((r) => r[0]),
    db.select({ slug: medals.slug }).from(medals).where(eq(medals.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(schema.missionProgress).where(sql`user_id = ${userId} AND status = 'COMPLETED'`).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(schema.operations).where(sql`user_id = ${userId} AND status = 'COMPLETED'`).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(schema.skillCheckAttempts).where(eq(schema.skillCheckAttempts.userId, userId)).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(schema.skillCheckAttempts).where(sql`user_id = ${userId} AND passed = true`).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(schema.skillCheckAttempts).where(sql`user_id = ${userId} AND perfect = true`).then((r) => Number(r[0]?.count ?? 0)),
  ])

  if (!user) return []

  const existingSlugs = new Set(existingMedals.map((m) => m.slug))
  const stats = { streak: user.streak, rank: user.rank, totalXp: user.totalXp, missionsCompleted: mCount, operationsCompleted: opCount, skillCheckAttempts: aCount, skillChecksPassed: pCount, perfectChecks: peCount }

  const toUnlock = MEDAL_DEFINITIONS.filter((def) => !existingSlugs.has(def.slug) && def.check(stats))
  if (toUnlock.length === 0) return []

  const inserted = await db
    .insert(medals)
    .values(toUnlock.map((def) => ({ userId, slug: def.slug, label: def.label, description: def.description, icon: def.icon, xpBonus: def.xpBonus })))
    .onConflictDoNothing()
    .returning()

  const totalBonus = inserted.reduce((sum, m) => sum + m.xpBonus, 0)
  if (totalBonus > 0) await awardXP(userId, totalBonus)

  return toUnlock.map((d) => d.slug)
}
