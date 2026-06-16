export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { db } from "@/lib/db"
import { medals, dailyLogs, missionProgress, missions } from "@/lib/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { MedalGrid } from "@/components/character/medal-grid"
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { subDays, format } from "date-fns"

export const metadata = { title: "Mission Log" }

export default async function MissionLogPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd")

  const [userMedals, recentActivity, recentMissions] = await Promise.all([
    db.select().from(medals).where(eq(medals.userId, user.id)).orderBy(desc(medals.unlockedAt)),
    db.select().from(dailyLogs).where(sql`user_id = ${user.id} AND date >= ${ninetyDaysAgo}`).orderBy(dailyLogs.date),
    db.select({ title: missions.title, type: missions.type, completedAt: missionProgress.completedAt, xpEarned: missionProgress.xpEarned })
      .from(missionProgress)
      .innerJoin(missions, eq(missions.id, missionProgress.missionId))
      .where(sql`${missionProgress.userId} = ${user.id} AND ${missionProgress.status} = 'COMPLETED'`)
      .orderBy(desc(missionProgress.completedAt))
      .limit(20),
  ])

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Mission Log</h1>

      <Card>
        <CardHeader><CardTitle className="text-sm">Activity (90 days)</CardTitle></CardHeader>
        <CardContent>
          <ActivityHeatmap data={recentActivity.map(l => ({ date: String(l.date), xpEarned: l.xpEarned, missionsCompleted: l.missionsCompleted }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Missions</CardTitle></CardHeader>
        <CardContent>
          {recentMissions.length === 0 ? (
            <p className="text-sm text-[#94a3b8]">No completed missions yet. Begin your journey in the Academy.</p>
          ) : (
            <div className="space-y-2">
              {recentMissions.map((m, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e2d3d] last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={m.type as "briefing" | "training-op" | "strike-mission" | "debrief"} className="capitalize text-xs">{m.type.replace("-", " ")}</Badge>
                    <span className="text-sm text-[#e2e8f0]">{m.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#06B6D4]">+{m.xpEarned} XP</span>
                    <span className="text-xs text-[#94a3b8]">{m.completedAt ? new Date(m.completedAt).toLocaleDateString() : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Medal Gallery</CardTitle></CardHeader>
        <CardContent>
          <MedalGrid earnedMedals={userMedals} showAll={true} />
        </CardContent>
      </Card>
    </div>
  )
}
