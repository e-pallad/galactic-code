import { db } from "@/lib/db"
import { users, missions, starSystems, missionProgress } from "@/lib/db/schema"
import { sql, isNull } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Layers, Trophy } from "lucide-react"

export const metadata = { title: "Admin Overview" }

export default async function AdminPage() {
  const [userCount, missionCount, systemCount, completionCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).where(isNull(users.deletedAt)).then(r => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(missions).then(r => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(starSystems).then(r => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(missionProgress).where(sql`status = 'COMPLETED'`).then(r => Number(r[0]?.count ?? 0)),
  ])

  const stats = [
    { label: "Total Pilots", value: userCount, icon: Users },
    { label: "Star Systems", value: systemCount, icon: Layers },
    { label: "Missions", value: missionCount, icon: Target },
    { label: "Completions", value: completionCount, icon: Trophy },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Fleet Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-[#94a3b8] font-normal flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold font-heading text-[#e2e8f0]">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
