"use client"

import { useState } from "react"
import { CheckCircle, Circle, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MapNode {
  id: string
  type: "topic" | "subtopic"
  label: string
  children?: MapNode[]
}

interface MapData {
  slug: string
  title: string
  nodes: MapNode[]
}

interface StarMapClientProps {
  mapData: MapData
  completedNodes: Set<string>
}

export function StarMapClient({ mapData, completedNodes: initial }: StarMapClientProps) {
  const [completed, setCompleted] = useState(initial)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(mapData.nodes.map(n => n.id)))
  const [toggling, setToggling] = useState<string | null>(null)

  const toggle = async (node: MapNode) => {
    if (toggling) return
    setToggling(node.id)
    const isCompleted = completed.has(node.id)
    try {
      await fetch("/api/star-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapSlug: mapData.slug, nodeId: node.id, nodeType: node.type, completed: !isCompleted }),
      })
      setCompleted(prev => {
        const next = new Set(prev)
        if (isCompleted) next.delete(node.id)
        else next.add(node.id)
        return next
      })
    } finally {
      setToggling(null)
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalNodes = mapData.nodes.reduce((sum, n) => sum + 1 + (n.children?.length ?? 0), 0)
  const completedCount = completed.size

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 rounded-lg bg-[#0d1520] border border-[#1e2d3d]">
        <div className="flex-1">
          <div className="flex justify-between text-xs text-[#94a3b8] mb-1">
            <span>Progress</span>
            <span>{completedCount}/{totalNodes} nodes</span>
          </div>
          <div className="h-2 rounded-full bg-[#1e2d3d] overflow-hidden">
            <div className="h-full bg-[#06B6D4] transition-all" style={{ width: `${totalNodes > 0 ? (completedCount / totalNodes) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {mapData.nodes.map(topic => {
        const isExpanded = expanded.has(topic.id)
        const topicCompleted = completed.has(topic.id)

        return (
          <div key={topic.id} className="rounded-xl border border-[#1e2d3d] bg-[#0d1520] overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <button onClick={() => toggleExpand(topic.id)} className="text-[#94a3b8] hover:text-[#e2e8f0]">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <button
                onClick={() => toggle(topic)}
                disabled={toggling === topic.id}
                className={cn("transition-colors", topicCompleted ? "text-green-400" : "text-[#1e2d3d] hover:text-[#06B6D4]")}
              >
                {topicCompleted ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </button>
              <span className={cn("font-heading font-semibold flex-1", topicCompleted ? "text-[#94a3b8] line-through" : "text-[#e2e8f0]")}>
                {topic.label}
              </span>
              {topic.children && (
                <span className="text-xs text-[#94a3b8]">
                  {topic.children.filter(c => completed.has(c.id)).length}/{topic.children.length}
                </span>
              )}
            </div>

            {isExpanded && topic.children && topic.children.length > 0 && (
              <div className="border-t border-[#1e2d3d]">
                {topic.children.map(subtopic => {
                  const subCompleted = completed.has(subtopic.id)
                  return (
                    <div key={subtopic.id} className="flex items-center gap-3 px-10 py-3 hover:bg-[#080C14]/50 transition-colors">
                      <button
                        onClick={() => toggle(subtopic)}
                        disabled={toggling === subtopic.id}
                        className={cn("transition-colors", subCompleted ? "text-green-400" : "text-[#1e2d3d] hover:text-[#06B6D4]")}
                      >
                        {subCompleted ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                      </button>
                      <span className={cn("text-sm", subCompleted ? "text-[#94a3b8] line-through" : "text-[#e2e8f0]")}>
                        {subtopic.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
