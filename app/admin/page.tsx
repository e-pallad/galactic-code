import { db } from "@/lib/db"
import { users, starSystems, missions, missionProgress } from "@/lib/db/schema"
import { count, eq } from "drizzle-orm"

export const metadata = { title: "Admin Overview" }

export default async function AdminPage() {
  const [userCount, systemCount, missionCount, completionCount] = await Promise.all([
    db.select({ count: count() }).from(users).then(r => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(starSystems).then(r => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(missions).then(r => Number(r[0]?.count ?? 0)),
    db.select({ count: count() }).from(missionProgress).where(eq(missionProgress.status, "COMPLETED")).then(r => Number(r[0]?.count ?? 0)),
  ])

  const stats = [
    { label: "Total Users", value: userCount },
    { label: "Star Systems", value: systemCount },
    { label: "Missions", value: missionCount },
    { label: "Completions", value: completionCount },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-5 rounded-xl border border-[#1e2d3d] bg-[#0d1520]">
            <p className="text-xs text-[#94a3b8] uppercase tracking-wide mb-1">{s.label}</p>
            <p className="font-heading text-3xl font-bold text-[#8B5CF6]">{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
