import { db } from "@/lib/db"
import { tracks, starSystems, sectors, missions } from "@/lib/db/schema"
import { eq, and, asc, sql, inArray } from "drizzle-orm"

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function systemSlug(system: { number: number; title: string }): string {
  return `${system.number}-${slugify(system.title)}`
}

// System URLs are `${number}-${slug}`; only the leading number is authoritative
// so title edits never break indexed links.
export function parseSystemNumber(param: string): number | null {
  const n = parseInt(param, 10)
  return Number.isInteger(n) && n > 0 ? n : null
}

export async function getActiveTracks() {
  return db.select().from(tracks).where(eq(tracks.isActive, true)).orderBy(asc(tracks.id))
}

export async function getTrack(trackId: string) {
  const [track] = await db
    .select()
    .from(tracks)
    .where(and(eq(tracks.id, trackId), eq(tracks.isActive, true)))
    .limit(1)
  return track ?? null
}

export async function getSystemsWithMissionCounts(trackId: string) {
  const systems = await db
    .select()
    .from(starSystems)
    .where(eq(starSystems.trackId, trackId))
    .orderBy(asc(starSystems.number))

  if (systems.length === 0) return []

  const counts = await db
    .select({ systemId: missions.systemId, count: sql<number>`count(*)::int` })
    .from(missions)
    .where(inArray(missions.systemId, systems.map(s => s.id)))
    .groupBy(missions.systemId)

  const countMap = Object.fromEntries(counts.map(c => [c.systemId, c.count]))
  return systems.map(s => ({ ...s, missionCount: countMap[s.id] ?? 0 }))
}

export async function getSystemDetail(trackId: string, systemNumber: number) {
  const [system] = await db
    .select()
    .from(starSystems)
    .where(and(eq(starSystems.trackId, trackId), eq(starSystems.number, systemNumber)))
    .limit(1)
  if (!system) return null

  const systemSectors = await db
    .select()
    .from(sectors)
    .where(eq(sectors.systemId, system.id))
    .orderBy(asc(sectors.number))

  const systemMissions = await db
    .select()
    .from(missions)
    .where(eq(missions.systemId, system.id))
    .orderBy(asc(missions.number))

  return { system, sectors: systemSectors, missions: systemMissions }
}
