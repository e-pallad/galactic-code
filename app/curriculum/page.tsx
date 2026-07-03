export const dynamic = "force-dynamic"

import Link from "next/link"
import { Zap, ArrowRight, Map } from "lucide-react"
import { getActiveTracks, getSystemsWithMissionCounts, systemSlug } from "@/lib/curriculum-public"
import { StarField } from "@/components/layout/star-field"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Curriculum — Galactic Code",
  description:
    "The full Galactic Code curriculum: learn React, Node.js, and Next.js through space-themed coding missions. Every mission, sector, and star system — free to browse.",
}

export default async function CurriculumIndexPage() {
  const tracks = await getActiveTracks()
  const trackSystems = await Promise.all(
    tracks.map(async track => ({ track, systems: await getSystemsWithMissionCounts(track.id) }))
  )

  return (
    <div className="min-h-screen bg-[#080C14]">
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-8">
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

        <div>
          <div className="flex items-center gap-3">
            <Map className="h-6 w-6 text-[#06B6D4]" />
            <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">The Curriculum</h1>
          </div>
          <p className="text-sm text-[#94a3b8] mt-2 max-w-xl">
            Every track is a series of star systems. Each system is a month of themed sectors packed
            with short, focused coding missions — complete them to earn XP and rank up.
          </p>
        </div>

        {trackSystems.map(({ track, systems }) => (
          <section key={track.id}>
            <h2 className="font-heading text-lg font-semibold text-[#e2e8f0] mb-1">
              {track.icon} {track.name}
              <span className="ml-2 text-xs font-normal text-[#06B6D4] uppercase tracking-wide">{track.characterClass}</span>
            </h2>
            <p className="text-sm text-[#94a3b8] mb-3">{track.description}</p>
            <div className="space-y-2">
              {systems.map(system => (
                <Link
                  key={system.id}
                  href={`/curriculum/${track.id}/${systemSlug(system)}`}
                  className="block p-4 rounded-lg border border-[#1e2d3d] bg-[#0d1520] hover:border-[#06B6D4]/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#06B6D4] uppercase tracking-wide">System {system.number}</p>
                      <p className="font-medium text-[#e2e8f0]">{system.title}</p>
                    </div>
                    <span className="text-xs text-[#94a3b8] shrink-0 ml-4">{system.missionCount} missions</span>
                  </div>
                </Link>
              ))}
              {systems.length === 0 && (
                <p className="text-sm text-[#94a3b8] italic">Systems charting in progress.</p>
              )}
            </div>
          </section>
        ))}

        <div className="text-center pt-6 pb-4 border-t border-[#1e2d3d]">
          <p className="text-[#94a3b8] mb-3">Ready to fly the missions instead of reading about them?</p>
          <Link href="/sign-up">
            <Button className="gap-2">
              Start Your First Mission — Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
