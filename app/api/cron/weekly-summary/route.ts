import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { users, dailyLogs } from "@/lib/db/schema"
import { isNull, gte, eq, and, sql } from "drizzle-orm"
import { sendWeeklySummaryEmail } from "@/lib/email"
import { subDays, startOfDay } from "date-fns"
import { getRankProgress } from "@/lib/xp"

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret")
  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const weekAgoDate = startOfDay(subDays(new Date(), 7)).toISOString().slice(0, 10)

  const allUsers = await db.select().from(users).where(isNull(users.deletedAt))

  let sent = 0
  for (const user of allUsers) {
    try {
      const [agg] = await db
        .select({
          xpThisWeek: sql<number>`coalesce(sum(${dailyLogs.xpEarned}), 0)`,
          missionsThisWeek: sql<number>`coalesce(sum(${dailyLogs.missionsCompleted}), 0)`,
        })
        .from(dailyLogs)
        .where(and(eq(dailyLogs.userId, user.id), gte(dailyLogs.date, weekAgoDate)))

      const xpThisWeek = Number(agg?.xpThisWeek ?? 0)
      const missionsThisWeek = Number(agg?.missionsThisWeek ?? 0)

      if (xpThisWeek === 0 && missionsThisWeek === 0) continue

      const rankInfo = getRankProgress(user.totalXp)
      await sendWeeklySummaryEmail(user.email, user.name, {
        xpThisWeek,
        missionsThisWeek,
        totalXp: user.totalXp,
        streak: user.streak,
        rankLabel: rankInfo.label,
      })
      sent++
    } catch {
      // continue
    }
  }

  return Response.json({ sent, total: allUsers.length })
}
