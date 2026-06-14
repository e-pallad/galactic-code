import { db } from "@/lib/db"
import { starSystems, sectors, missions } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { CurriculumTree } from "@/components/admin/curriculum-tree"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const metadata = { title: "Admin — Curriculum" }

export default async function AdminCurriculumPage() {
  const allSystems = await db.select().from(starSystems).orderBy(asc(starSystems.number))
  const allSectors = await db.select().from(sectors).orderBy(asc(sectors.number))
  const allMissions = await db.select().from(missions).orderBy(asc(missions.number))

  const tree = allSystems.map(sys => ({
    ...sys,
    sectors: allSectors
      .filter(s => s.systemId === sys.id)
      .map(sec => ({
        ...sec,
        missions: allMissions.filter(m => m.sectorId === sec.id),
      })),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Curriculum</h1>
        <Link href="/admin/curriculum/new">
          <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />New System</Button>
        </Link>
      </div>
      <CurriculumTree systems={tree} />
    </div>
  )
}
