export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { Zap, ArrowRight } from "lucide-react"
import { getTrack, getSystemsWithMissionCounts, systemSlug } from "@/lib/curriculum-public"
import { StarField } from "@/components/layout/star-field"
import { Button } from "@/components/ui/button"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.dev"

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }) {
  const { track: trackId } = await params
  const track = await getTrack(trackId)
  if (!track) return { title: "Curriculum — Galactic Code" }
  return {
    title: `Learn ${track.name} — Galactic Code Curriculum`,
    description: `${track.description} Browse every ${track.name} star system and mission in the Galactic Code curriculum — free.`,
    alternates: { canonical: `${APP_URL}/curriculum/${track.id}` },
  }
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track: trackId } = await params
  const track = await getTrack(trackId)
  if (!track) notFound()

  const systems = await getSystemsWithMissionCounts(track.id)
  const totalMissions = systems.reduce((sum, s) => sum + s.missionCount, 0)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${track.name} Track — Galactic Code`,
    description: track.description,
    provider: { "@type": "Organization", name: "Galactic Code", url: APP_URL },
    isAccessibleForFree: true,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT30M",
    },
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
          <span className="text-[#e2e8f0]">{track.name}</span>
        </nav>

        <div>
          <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">
            {track.icon} {track.name} Track
          </h1>
          <p className="text-xs text-[#06B6D4] uppercase tracking-wide mt-1">{track.characterClass}</p>
          <p className="text-sm text-[#94a3b8] mt-3 max-w-xl">{track.description}</p>
          <p className="text-sm text-[#94a3b8] mt-2">
            {systems.length} star systems · {totalMissions} missions · 15–30 minutes each
          </p>
        </div>

        <div className="space-y-3">
          {systems.map(system => (
            <Link
              key={system.id}
              href={`/curriculum/${track.id}/${systemSlug(system)}`}
              className="block p-4 rounded-lg border border-[#1e2d3d] bg-[#0d1520] hover:border-[#06B6D4]/40 transition-colors"
            >
              <p className="text-xs text-[#06B6D4] uppercase tracking-wide">System {system.number}</p>
              <p className="font-heading font-semibold text-[#e2e8f0]">{system.title}</p>
              <p className="text-sm text-[#94a3b8] mt-1">{system.description}</p>
              <p className="text-xs text-[#94a3b8] mt-2">{system.missionCount} missions</p>
            </Link>
          ))}
          {systems.length === 0 && (
            <p className="text-sm text-[#94a3b8] italic">Systems charting in progress.</p>
          )}
        </div>

        <div className="text-center pt-6 pb-4 border-t border-[#1e2d3d]">
          <p className="text-[#94a3b8] mb-3">Enroll as a {track.characterClass} and start earning XP.</p>
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
