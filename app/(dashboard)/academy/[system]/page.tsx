import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { getUser } from "@/lib/missions"
import { db } from "@/lib/db"
import { starSystems, sectors, missions, missionProgress, skillCheckQuestions } from "@/lib/db/schema"
import { eq, sql, asc } from "drizzle-orm"
import { MissionCardClient } from "@/components/academy/mission-card-client"
import { FocusCycleTimer } from "@/components/academy/focus-cycle-timer"
import { FocusSounds } from "@/components/academy/focus-sounds"
import { ArrowLeft, Rocket } from "lucide-react"
import Link from "next/link"

export default async function SystemPage({ params }: { params: Promise<{ system: string }> }) {
  const { system: systemId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const [system] = await db.select().from(starSystems).where(eq(starSystems.id, systemId)).limit(1)
  if (!system) notFound()

  const systemSectors = await db.select().from(sectors).where(eq(sectors.systemId, systemId)).orderBy(asc(sectors.number))
  const sectorIds = systemSectors.map(s => s.id)

  const systemMissions = sectorIds.length > 0 ? await db.select().from(missions)
    .where(sql`sector_id = ANY(ARRAY[${sql.join(sectorIds.map(id => sql`${id}::uuid`), sql`, `)}])`)
    .orderBy(asc(missions.number)) : []

  const missionIds = systemMissions.map(m => m.id)

  const userProgress = missionIds.length > 0
    ? await db.select().from(missionProgress)
        .where(sql`user_id = ${user.id} AND mission_id = ANY(ARRAY[${sql.join(missionIds.map(id => sql`${id}::uuid`), sql`, `)}])`)
    : ([] as (typeof missionProgress.$inferSelect)[])

  const questions = missionIds.length > 0
    ? await db.select().from(skillCheckQuestions)
        .where(sql`mission_id = ANY(ARRAY[${sql.join(missionIds.map(id => sql`${id}::uuid`), sql`, `)}])`)
        .orderBy(asc(skillCheckQuestions.displayOrder))
    : ([] as (typeof skillCheckQuestions.$inferSelect)[])

  const progressMap = Object.fromEntries(userProgress.map(p => [p.missionId, p.status]))
  const questionsByMission = questions.reduce<Record<string, typeof questions>>((acc, q) => {
    if (!acc[q.missionId]) acc[q.missionId] = []
    acc[q.missionId]!.push(q)
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/academy" className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs text-[#06B6D4] uppercase tracking-wide font-medium">System {system.number}</p>
          <h1 className="font-heading text-xl font-bold text-[#e2e8f0]">{system.title}</h1>
        </div>
      </div>

      <p className="text-[#94a3b8] text-sm">{system.description}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {systemSectors.map(sector => {
            const sectorMissions = systemMissions.filter(m => m.sectorId === sector.id)
            return (
              <div key={sector.id}>
                <h2 className="font-heading font-semibold text-[#e2e8f0] mb-3 flex items-center gap-2">
                  <span className="text-xs text-[#06B6D4] uppercase tracking-wide">Sector {sector.number}</span>
                  <span className="text-sm text-[#94a3b8]">— {sector.theme}</span>
                </h2>
                <div className="space-y-3">
                  {sectorMissions.map(mission => (
                    <MissionCardClient
                      key={mission.id}
                      mission={mission}
                      status={(progressMap[mission.id] ?? "NOT_STARTED") as "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"}
                      questions={questionsByMission[mission.id] ?? []}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          <FocusCycleTimer />
          <FocusSounds />
          <div className="p-4 rounded-lg border border-[#1e2d3d] bg-[#0d1520]">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[#e2e8f0]">
              <Rocket className="h-4 w-4 text-[#06B6D4]" />
              Operation: {system.operationTitle}
            </div>
            <p className="text-xs text-[#94a3b8]">{system.operationDescription}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
