"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Layers, Target } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StarSystem, Sector, Mission } from "@/lib/db/schema"

interface CurriculumTreeProps {
  systems: (StarSystem & { sectors: (Sector & { missions: Mission[] })[] })[]
}

export function CurriculumTree({ systems }: CurriculumTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {systems.map((system) => (
        <div key={system.id} className="rounded-lg border border-[#1e2d3d] overflow-hidden">
          <button
            onClick={() => toggle(system.id)}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#0d1520] transition-colors"
          >
            {expanded.has(system.id) ? <ChevronDown className="h-4 w-4 text-[#94a3b8]" /> : <ChevronRight className="h-4 w-4 text-[#94a3b8]" />}
            <Layers className="h-4 w-4 text-[#06B6D4]" />
            <span className="font-medium text-[#e2e8f0]">System {system.number}: {system.title}</span>
            <span className="ml-auto text-xs text-[#94a3b8]">{system.sectors.length} sectors</span>
          </button>
          {expanded.has(system.id) && (
            <div className="border-t border-[#1e2d3d]">
              {system.sectors.map((sector) => (
                <div key={sector.id}>
                  <button
                    onClick={() => toggle(sector.id)}
                    className="flex items-center gap-3 w-full px-8 py-2 text-left hover:bg-[#0d1520] transition-colors"
                  >
                    {expanded.has(sector.id) ? <ChevronDown className="h-3 w-3 text-[#94a3b8]" /> : <ChevronRight className="h-3 w-3 text-[#94a3b8]" />}
                    <span className="text-sm text-[#94a3b8]">Sector {sector.number}: {sector.theme}</span>
                    <span className="ml-auto text-xs text-[#94a3b8]">{sector.missions.length} missions</span>
                  </button>
                  {expanded.has(sector.id) && (
                    <div className="border-t border-[#1e2d3d]">
                      {sector.missions.map((mission) => (
                        <div key={mission.id} className="flex items-center gap-3 px-14 py-2 hover:bg-[#0d1520]">
                          <Target className="h-3 w-3 text-[#94a3b8]" />
                          <span className="text-xs text-[#94a3b8]">{mission.number}. {mission.title}</span>
                          <span className="ml-2 text-xs text-[#06B6D4]">{mission.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
