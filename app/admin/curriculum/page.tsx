import { db } from "@/lib/db"
import { starSystems, sectors, missions } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { CurriculumTree } from "@/components/admin/curriculum-tree"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const metadata = { title: "Admin — Curriculum" }

export default async function AdminCurriculumPage() {
  const [systems, allSectors, allMissions] = await Promise.all([
    db.select().from(starSystems).orderBy(asc(starSystems.number)),
    db.select().from(sectors).orderBy(asc(sectors.number)),
    db.select().from(missions).orderBy(asc(missions.number)),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Curriculum</h1>
        <Button size="sm" asChild><Link href="/admin/curriculum/new"><Plus className="h-4 w-4 mr-1" />New System</Link></Button>
      </div>
      <CurriculumTree systems={systems} sectors={allSectors} missions={allMissions} />
    </div>
  )
}
