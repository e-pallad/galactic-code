import { readdir } from "fs/promises"
import { join } from "path"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Map, ArrowRight } from "lucide-react"

export const metadata = { title: "Star Map" }

interface MapMeta { slug: string; title: string; description: string }

async function getMaps(): Promise<MapMeta[]> {
  try {
    const dir = join(process.cwd(), "content", "star-maps")
    const files = await readdir(dir)
    const maps = await Promise.all(
      files.filter(f => f.endsWith(".json")).map(async f => {
        const { default: data } = await import(`@/content/star-maps/${f}`, { with: { type: "json" } }) as { default: MapMeta }
        return data
      })
    )
    return maps
  } catch {
    return []
  }
}

export default async function StarMapPage() {
  const maps = await getMaps()

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Map className="h-6 w-6 text-[#06B6D4]" />
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Star Map</h1>
      </div>
      <p className="text-[#94a3b8]">Visual learning paths — toggle nodes as you master each topic.</p>
      {maps.length === 0 ? (
        <div className="text-center py-16 text-[#94a3b8]">
          <p className="text-4xl mb-4">🗺️</p>
          <p>No star maps charted yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {maps.map(map => (
            <Link key={map.slug} href={`/star-map/${map.slug}`}>
              <Card className="hover:border-[#06B6D4]/40 transition-all cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading font-semibold text-[#e2e8f0]">{map.title}</h2>
                    <p className="text-sm text-[#94a3b8] mt-1">{map.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-[#94a3b8]" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
