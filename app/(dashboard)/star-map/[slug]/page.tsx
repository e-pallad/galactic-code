import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { db } from "@/lib/db"
import { starMapProgress } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { StarMapClient } from "@/components/star-map/star-map-client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

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
  const { userId: clerkId } = await auth()
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
      <div className="flex items-center gap-3">
        <Link href="/star-map" className="text-[#94a3b8] hover:text-[#e2e8f0]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">{mapData.title}</h1>
          <p className="text-sm text-[#94a3b8]">{mapData.description}</p>
        </div>
      </div>
      <StarMapClient mapData={mapData} completedNodes={completedNodes} />
    </div>
  )
}
