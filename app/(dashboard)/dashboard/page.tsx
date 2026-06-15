import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUser, awardDailyLoginXP, updateStreak } from "@/lib/missions"
import { db } from "@/lib/db"
import { dailyLogs, missionProgress, missions } from "@/lib/db/schema"
import { eq, sql, desc } from "drizzle-orm"
import { subDays, format, startOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MissionQuota } from "@/components/gamification/mission-quota"
import { XPBar } from "@/components/gamification/xp-bar"
import { HyperdriveCounter } from "@/components/gamification/hyperdrive-counter"
import { RankBadge } from "@/components/gamification/rank-badge"
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap"
import { CrewWidget } from "@/components/dashboard/crew-widget"
import { QuickNav } from "@/components/dashboard/quick-nav"
import { Zap, Target, Flame } from "lucide-react"

export const metadata = { title: "Command Bridge" }

export default async function DashboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  // Award daily login XP and update streak
  await Promise.all([
    awardDailyLoginXP(user.id),
    updateStreak(user.id),
  ])

  const today = format(new Date(), "yyyy-MM-dd")
  const weekStart = format(startOfWeek(new Date()), "yyyy-MM-dd")
  const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd")

  const [todayLog, weekLogs, recentActivity, lastMissionData] = await Promise.all([
    db.select().from(dailyLogs).where(sql`user_id = ${user.id} AND date = ${today}`).limit(1),
    db.select({ total: sql<number>`coalesce(sum(missions_completed),0)` }).from(dailyLogs).where(sql`user_id = ${user.id} AND date >= ${weekStart}`),
    db.select().from(dailyLogs).where(sql`user_id = ${user.id} AND date >= ${ninetyDaysAgo}`).orderBy(dailyLogs.date),
    db.select({ missionId: missionProgress.missionId, title: missions.title, systemId: missions.systemId })
      .from(missionProgress)
      .innerJoin(missions, eq(missions.id, missionProgress.missionId))
      .where(sql`${missionProgress.userId} = ${user.id} AND ${missionProgress.status} = 'COMPLETED'`)
      .orderBy(desc(missionProgress.completedAt))
      .limit(1),
  ])

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Command Bridge</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Welcome back, {user.name?.split(" ")[0] ?? "Pilot"}</p>
      </div>

      <QuickNav
        lastMission={lastMissionData[0] ? { id: lastMissionData[0].missionId, title: lastMissionData[0].title, systemId: lastMissionData[0].systemId } : null}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#94a3b8] font-normal flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-[#06B6D4]">{user.totalXp.toLocaleString()}</p>
            <XPBar xp={user.totalXp} showValues={false} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#94a3b8] font-normal">Current Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <RankBadge xp={user.totalXp} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#94a3b8] font-normal flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Hyperdrive Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HyperdriveCounter streak={user.streak} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-[#94a3b8] font-normal flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5" /> Crew Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CrewWidget />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Activity Log (90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap data={recentActivity.map(l => ({ date: String(l.date), xpEarned: l.xpEarned, missionsCompleted: l.missionsCompleted }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mission Quota</CardTitle>
          </CardHeader>
          <CardContent>
            <MissionQuota
              daily={{ completed: todayLog[0]?.missionsCompleted ?? 0, goal: user.dailyGoalMissions }}
              weekly={{ completed: Number(weekLogs[0]?.total ?? 0), goal: user.weeklyGoalMissions }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
