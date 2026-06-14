"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ChevronLeft, CheckCircle2, Circle } from "lucide-react"
import Link from "next/link"

interface RoadmapNode {
  id: string
  label: string
  type: "topic" | "subtopic"
  children?: RoadmapNode[]
}

const ROADMAPS: Record<string, { title: string; nodes: RoadmapNode[] }> = {
  "javascript-fundamentals": {
    title: "JavaScript Fundamentals",
    nodes: [
      { id: "variables", label: "Variables & Data Types", type: "topic", children: [{ id: "let-const", label: "let / const / var", type: "subtopic" }, { id: "primitives", label: "Primitives vs Objects", type: "subtopic" }] },
      { id: "functions", label: "Functions", type: "topic", children: [{ id: "declarations", label: "Declarations vs Expressions", type: "subtopic" }, { id: "arrow", label: "Arrow Functions", type: "subtopic" }, { id: "closures", label: "Closures", type: "subtopic" }] },
      { id: "async", label: "Async JavaScript", type: "topic", children: [{ id: "promises", label: "Promises", type: "subtopic" }, { id: "async-await", label: "async / await", type: "subtopic" }] },
    ],
  },
  "react-ecosystem": {
    title: "React Ecosystem",
    nodes: [
      { id: "components", label: "Components", type: "topic", children: [{ id: "jsx", label: "JSX", type: "subtopic" }, { id: "props", label: "Props", type: "subtopic" }] },
      { id: "hooks", label: "Hooks", type: "topic", children: [{ id: "usestate", label: "useState", type: "subtopic" }, { id: "useeffect", label: "useEffect", type: "subtopic" }] },
    ],
  },
  "python-foundations": {
    title: "Python Foundations",
    nodes: [
      { id: "syntax", label: "Syntax & Types", type: "topic", children: [{ id: "strings", label: "Strings", type: "subtopic" }, { id: "lists", label: "Lists & Tuples", type: "subtopic" }] },
      { id: "oop", label: "OOP", type: "topic", children: [{ id: "classes", label: "Classes", type: "subtopic" }, { id: "inheritance", label: "Inheritance", type: "subtopic" }] },
    ],
  },
  "data-science-path": {
    title: "Data Science Path",
    nodes: [
      { id: "numpy", label: "NumPy", type: "topic", children: [{ id: "arrays", label: "Arrays", type: "subtopic" }] },
      { id: "pandas", label: "Pandas", type: "topic", children: [{ id: "dataframes", label: "DataFrames", type: "subtopic" }] },
    ],
  },
}

export default function StarMapDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const roadmap = ROADMAPS[slug]
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/star-map").then(r => r.json()).then(d => {
      if (d.progress) setCompleted(new Set(d.progress.filter((p: { roadmapSlug: string }) => p.roadmapSlug === slug).map((p: { nodeId: string }) => p.nodeId)))
    })
  }, [slug])

  const toggle = async (nodeId: string, type: "topic" | "subtopic") => {
    const isComplete = completed.has(nodeId)
    const newSet = new Set(completed)
    if (isComplete) newSet.delete(nodeId)
    else newSet.add(nodeId)
    setCompleted(newSet)
    await fetch("/api/star-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roadmapSlug: slug, nodeId, nodeType: type, status: isComplete ? "NOT_STARTED" : "COMPLETED" }),
    })
  }

  if (!roadmap) return <div className="text-[#94a3b8]">Star map not found.</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/star-map" className="flex items-center gap-1 text-sm text-[#94a3b8] hover:text-[#e2e8f0] mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Star Maps
        </Link>
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">{roadmap.title}</h1>
      </div>
      <div className="space-y-4">
        {roadmap.nodes.map(node => (
          <div key={node.id} className="p-4 rounded-xl border border-[#1e2d3d] bg-[#0d1520]">
            <button
              onClick={() => toggle(node.id, "topic")}
              className="flex items-center gap-3 w-full text-left focus-visible:ring-2 focus-visible:ring-[#06B6D4] rounded"
            >
              {completed.has(node.id) ? <CheckCircle2 className="h-5 w-5 text-[#10B981] shrink-0" /> : <Circle className="h-5 w-5 text-[#94a3b8] shrink-0" />}
              <span className={`font-medium ${completed.has(node.id) ? "text-[#94a3b8] line-through" : "text-[#e2e8f0]"}`}>{node.label}</span>
            </button>
            {node.children && (
              <div className="ml-8 mt-2 space-y-1">
                {node.children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => toggle(child.id, "subtopic")}
                    className="flex items-center gap-2 w-full text-left text-sm focus-visible:ring-2 focus-visible:ring-[#06B6D4] rounded py-0.5"
                  >
                    {completed.has(child.id) ? <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" /> : <Circle className="h-4 w-4 text-[#94a3b8] shrink-0" />}
                    <span className={completed.has(child.id) ? "text-[#94a3b8] line-through" : "text-[#94a3b8] hover:text-[#e2e8f0]"}>{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
