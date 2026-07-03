export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Zap, ArrowRight, Rocket, Clock } from "lucide-react"
import { getTrack, getSystemDetail, parseSystemNumber, systemSlug } from "@/lib/curriculum-public"
import { StarField } from "@/components/layout/star-field"
import { Button } from "@/components/ui/button"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.app"

const MISSION_TYPE_LABELS: Record<string, string> = {
  briefing: "Briefing",
  "training-op": "Training Op",
  "strike-mission": "Strike Mission",
  debrief: "Debrief",
}

type Params = Promise<{ track: string; system: string }>

export async function generateMetadata({ params }: { params: Params }) {
  const { track: trackId, system: systemParam } = await params
  const number = parseSystemNumber(systemParam)
  const track = await getTrack(trackId)
  if (!track || number === null) return { title: "Curriculum — Galactic Code" }
  const detail = await getSystemDetail(track.id, number)
  if (!detail) return { title: "Curriculum — Galactic Code" }
  return {
    title: `${detail.system.title} — ${track.name} Curriculum | Galactic Code`,
    description: `${detail.system.description} ${detail.missions.length} hands-on ${track.name} missions, free to browse.`,
    alternates: { canonical: `${APP_URL}/curriculum/${track.id}/${systemSlug(detail.system)}` },
  }
}

export default async function PublicSystemPage({ params }: { params: Params }) {
  const { track: trackId, system: systemParam } = await params
  const number = parseSystemNumber(systemParam)
  if (number === null) notFound()

  const track = await getTrack(trackId)
  if (!track) notFound()

  const detail = await getSystemDetail(track.id, number)
  if (!detail) notFound()
  const { system, sectors, missions } = detail

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${system.title} — ${track.name} missions`,
    numberOfItems: missions.length,
    itemListElement: missions.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.title,
      description: m.description,
    })),
  }

  return (
    <div className="min-h-screen bg-[#080C14]">
      <StarField />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#06B6D4]" />
            <span className="font-heading font-bold text-[#06B6D4]">GALACTIC CODE</span>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="gap-1.5">
              Join the Academy <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </header>

        <nav className="text-xs text-[#94a3b8]">
          <Link href="/curriculum" className="hover:text-[#06B6D4]">Curriculum</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/curriculum/${track.id}`} className="hover:text-[#06B6D4]">{track.name}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#e2e8f0]">System {system.number}</span>
        </nav>

        <div>
          <p className="text-xs text-[#06B6D4] uppercase tracking-wide">System {system.number} · {track.name}</p>
          <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">{system.title}</h1>
          <p className="text-sm text-[#94a3b8] mt-2 max-w-xl">{system.description}</p>
        </div>

        {sectors.map(sector => {
          const sectorMissions = missions.filter(m => m.sectorId === sector.id)
          return (
            <section key={sector.id}>
              <h2 className="font-heading font-semibold text-[#e2e8f0] mb-3">
                <span className="text-xs text-[#06B6D4] uppercase tracking-wide mr-2">Sector {sector.number}</span>
                <span className="text-sm text-[#94a3b8]">— {sector.theme}</span>
              </h2>
              <div className="space-y-2">
                {sectorMissions.map(mission => (
                  <div key={mission.id} className="p-4 rounded-lg border border-[#1e2d3d] bg-[#0d1520]">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-[#e2e8f0]">{mission.title}</p>
                      <div className="flex items-center gap-2 shrink-0 text-xs text-[#94a3b8]">
                        <span className="px-2 py-0.5 rounded border border-[#1e2d3d] text-[#06B6D4]">
                          {MISSION_TYPE_LABELS[mission.type] ?? mission.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {mission.durationMinutes} min
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[#94a3b8] mt-1.5">{mission.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        <div className="p-4 rounded-lg border border-[#1e2d3d] bg-[#0d1520]">
          <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[#e2e8f0]">
            <Rocket className="h-4 w-4 text-[#06B6D4]" />
            Operation: {system.operationTitle}
          </div>
          <p className="text-xs text-[#94a3b8]">{system.operationDescription}</p>
        </div>

        <div className="text-center pt-6 pb-4 border-t border-[#1e2d3d]">
          <p className="text-[#94a3b8] mb-3">
            Fly these {missions.length} missions with XP, streaks, and in-browser exercises.
          </p>
          <Link href="/sign-up">
            <Button className="gap-2">
              Start System {system.number} — Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
