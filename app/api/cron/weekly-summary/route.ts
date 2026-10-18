import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { users, dailyLogs } from "@/lib/db/schema"
import { isNull, gte, eq, and, sql } from "drizzle-orm"
import { sendWeeklySummaryEmail } from "@/lib/email"
import { isCronAuthorized, sendInBatches } from "@/lib/cron"
import { subDays, startOfDay } from "date-fns"
import { getRankProgress } from "@/lib/xp"

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const weekAgoDate = startOfDay(subDays(new Date(), 7)).toISOString().slice(0, 10)

  // One query: only pilots with activity logged this week come back, with their sums.
  const active = await db
    .select({
      user: users,
      xpThisWeek: sql<number>`coalesce(sum(${dailyLogs.xpEarned}), 0)`,
      missionsThisWeek: sql<number>`coalesce(sum(${dailyLogs.missionsCompleted}), 0)`,
    })
    .from(users)
    .innerJoin(dailyLogs, eq(dailyLogs.userId, users.id))
    .where(and(isNull(users.deletedAt), eq(users.emailOptOut, false), gte(dailyLogs.date, weekAgoDate)))
    .groupBy(users.id)

  const targets = active
    .map((r) => ({ user: r.user, xpThisWeek: Number(r.xpThisWeek), missionsThisWeek: Number(r.missionsThisWeek) }))
    .filter((r) => r.xpThisWeek > 0 || r.missionsThisWeek > 0)

  const { sent, failed } = await sendInBatches(targets, ({ user, xpThisWeek, missionsThisWeek }) =>
    sendWeeklySummaryEmail(user.id, user.email, user.name, {
      xpThisWeek,
      missionsThisWeek,
      totalXp: user.totalXp,
      streak: user.streak,
      rankLabel: getRankProgress(user.totalXp).label,
    })
  )

  return Response.json({ sent, failed, total: targets.length })
}
