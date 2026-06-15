import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getUser } from "@/lib/missions"
import { getRankProgress } from "@/lib/xp"
import { dailyLogs } from "@/lib/db/schema"
import { sql } from "drizzle-orm"
import { subDays, startOfDay, startOfWeek, format } from "date-fns"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await getUser(userId)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const today = startOfDay(new Date()).toISOString().slice(0, 10)
  const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd")
  const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd")

  const [todayLog, weekLogs, recentActivity] = await Promise.all([
    db.select().from(dailyLogs).where(sql`user_id = ${user.id} AND date = ${today}`).limit(1),
    db.select({ total: sql<number>`sum(missions_completed)` }).from(dailyLogs).where(sql`user_id = ${user.id} AND date >= ${weekStart}`),
    db.select().from(dailyLogs).where(sql`user_id = ${user.id} AND date >= ${ninetyDaysAgo}`).orderBy(dailyLogs.date),
  ])

  const rankProgress = getRankProgress(user.totalXp)

  return NextResponse.json({
    totalXp: user.totalXp,
    rank: user.rank,
    rankLabel: rankProgress.label,
    rankProgress,
    streak: user.streak,
    dailyProgress: {
      completed: todayLog[0]?.missionsCompleted ?? 0,
      goal: user.dailyGoalMissions,
    },
    weeklyProgress: {
      completed: Number(weekLogs[0]?.total ?? 0),
      goal: user.weeklyGoalMissions,
    },
    recentActivity: recentActivity.map(l => ({
      date: l.date,
      xpEarned: l.xpEarned,
      missionsCompleted: l.missionsCompleted,
    })),
  })
}
