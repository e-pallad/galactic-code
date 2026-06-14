import Link from "next/link"
import { Map } from "lucide-react"

const STAR_MAPS = [
  { slug: "javascript-fundamentals", title: "JavaScript Fundamentals", description: "Variables, functions, DOM, async/await, modules." },
  { slug: "react-ecosystem", title: "React Ecosystem", description: "Components, hooks, state management, Next.js." },
  { slug: "python-foundations", title: "Python Foundations", description: "Syntax, data structures, OOP, file I/O." },
  { slug: "data-science-path", title: "Data Science Path", description: "NumPy, Pandas, Matplotlib, scikit-learn." },
]

export const metadata = { title: "Star Maps" }

export default function StarMapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Star Maps</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Curated learning roadmaps — check off nodes as you learn.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STAR_MAPS.map(map => (
          <Link
            key={map.slug}
            href={`/star-map/${map.slug}`}
            className="p-5 rounded-xl border border-[#1e2d3d] bg-[#0d1520] hover:border-[#06B6D4]/40 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Map className="h-5 w-5 text-[#06B6D4]" />
              <h2 className="font-heading font-semibold text-[#e2e8f0] group-hover:text-[#06B6D4] transition-colors">{map.title}</h2>
            </div>
            <p className="text-sm text-[#94a3b8]">{map.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
