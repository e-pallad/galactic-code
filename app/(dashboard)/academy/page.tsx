export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { db } from "@/lib/db"
import { starSystems, missions, missionProgress, operations } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { StarSystemCard } from "@/components/academy/star-system-card"
import { Progress } from "@/components/ui/progress"

export const metadata = { title: "Academy" }

export default async function AcademyPage() {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const systems = await db.select().from(starSystems)
    .where(eq(starSystems.trackId, user.track))
    .orderBy(starSystems.number)

  const systemIds = systems.map(s => s.id)

  const [missionCounts, userOps] = await Promise.all([
    systemIds.length > 0 ? db.select({ systemId: missions.systemId, count: sql<number>`count(*)` })
      .from(missions)
      .where(sql`system_id = ANY(ARRAY[${sql.join(systemIds.map(id => sql`${id}::uuid`), sql`, `)}])`)
      .groupBy(missions.systemId) : Promise.resolve([]),
    db.select().from(operations).where(eq(operations.userId, user.id)),
  ])

  const countBySystem = Object.fromEntries(missionCounts.map(r => [r.systemId, Number(r.count)]))

  // For completed: need to join differently
  const completedBySystem: Record<string, number> = {}
  // Simple approach: count completed missions per system
  const completedMissions = systemIds.length > 0 ? await db.select({ systemId: missions.systemId })
    .from(missionProgress)
    .innerJoin(missions, eq(missions.id, missionProgress.missionId))
    .where(sql`${missionProgress.userId} = ${user.id} AND ${missionProgress.status} = 'COMPLETED'`) : []

  completedMissions.forEach(m => {
    completedBySystem[m.systemId] = (completedBySystem[m.systemId] ?? 0) + 1
  })

  // Curriculum-wide totals for the progress summary.
  const totalAllMissions = systems.reduce((sum, s) => sum + (countBySystem[s.id] ?? 0), 0)
  const completedAllMissions = systems.reduce((sum, s) => sum + (completedBySystem[s.id] ?? 0), 0)
  const overallProgress = totalAllMissions > 0 ? Math.round((completedAllMissions / totalAllMissions) * 100) : 0

  // Index of the first unlocked system that isn't fully complete — the "continue here" target.
  const currentSystemIndex = systems.findIndex((s, i) => {
    const total = countBySystem[s.id] ?? 0
    const completed = completedBySystem[s.id] ?? 0
    const prevSystem = systems[i - 1]
    const unlocked = i === 0 || (completedBySystem[prevSystem?.id ?? ""] ?? 0) === (countBySystem[prevSystem?.id ?? ""] ?? 1)
    return unlocked && (total === 0 || completed < total)
  })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Academy</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Your {user.track} learning path</p>
      </div>

      {systems.length > 0 && (
        <div className="p-5 rounded-xl border border-[#1e2d3d] bg-[#0d1520]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#e2e8f0]">Curriculum progress</span>
            <span className="text-sm text-[#06B6D4] font-medium">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} />
          <p className="text-xs text-[#94a3b8] mt-2">
            {completedAllMissions} of {totalAllMissions} missions complete across {systems.length} {systems.length === 1 ? "system" : "systems"}
          </p>
        </div>
      )}

      {systems.length === 0 ? (
        <div className="text-center py-16 text-[#94a3b8]">
          <p className="text-4xl mb-4">🌌</p>
          <p className="font-medium text-[#e2e8f0]">No systems charted yet</p>
          <p className="text-sm mt-1">Your curriculum is being assembled. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {systems.map((system, i) => {
            const total = countBySystem[system.id] ?? 0
            const completed = completedBySystem[system.id] ?? 0
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0
            const op = userOps.find(o => o.trackId === system.trackId && o.systemNumber === system.number)
            const prevSystem = systems[i - 1]
            const prevCompleted = i === 0 ? true : (completedBySystem[prevSystem?.id ?? ""] ?? 0) === (countBySystem[prevSystem?.id ?? ""] ?? 1)
            return (
              <StarSystemCard
                key={system.id}
                system={system}
                progress={progress}
                totalMissions={total}
                completedMissions={completed}
                operationStatus={op?.status}
                isLocked={i > 0 && !prevCompleted}
                isCurrent={i === currentSystemIndex}
                unlockAfterSystem={prevSystem?.number}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
