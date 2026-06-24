export const dynamic = "force-dynamic"

import { notFound, redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { db } from "@/lib/db"
import { starMapProgress } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { StarMapClient } from "@/components/star-map/star-map-client"
import { BackLink } from "@/components/layout/back-link"

interface MapNode {
  id: string
  type: "topic" | "subtopic"
  label: string
  children?: MapNode[]
}

interface MapData {
  slug: string
  title: string
  description: string
  nodes: MapNode[]
}

async function getMapData(slug: string): Promise<MapData | null> {
  try {
    const data = await import(`@/content/star-maps/${slug}.json`, { with: { type: "json" } }) as { default: MapData }
    return data.default
  } catch {
    return null
  }
}

export default async function StarMapSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const mapData = await getMapData(slug)
  if (!mapData) notFound()

  const progress = await db.select().from(starMapProgress)
    .where(and(eq(starMapProgress.userId, user.id), eq(starMapProgress.roadmapSlug, slug)))

  const completedNodes = new Set(
    progress.filter(p => p.status === "COMPLETED").map(p => p.nodeId)
  )

  return (
    <div className="space-y-6 max-w-4xl">
      <BackLink href="/star-map" label="Star Map" />
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">{mapData.title}</h1>
        <p className="text-sm text-[#94a3b8] mt-1">{mapData.description}</p>
      </div>
      <StarMapClient mapData={mapData} completedNodes={completedNodes} />
    </div>
  )
}
