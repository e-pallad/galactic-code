"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { FlaskConical, ChevronDown, ChevronUp } from "lucide-react"
import type { ExerciseData } from "@/components/exercises/exercise-runner"

// Sandpack is heavy — load it only when a pilot actually opens the Sim Deck.
const ExerciseRunner = dynamic(
  () => import("@/components/exercises/exercise-runner").then((m) => m.ExerciseRunner),
  { ssr: false, loading: () => <p className="text-sm text-[#94a3b8] py-4">Booting simulator…</p> }
)

export function ExerciseSection({ exercises }: { exercises: ExerciseData[] }) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  if (exercises.length === 0) return null

  return (
    <div className="mt-2">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)} className="gap-1.5">
        <FlaskConical className="h-3.5 w-3.5 text-[#06B6D4]" />
        Sim Deck ({exercises.length} exercise{exercises.length !== 1 ? "s" : ""})
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </Button>

      {open && (
        <div className="mt-3 p-4 rounded-lg border border-[#1e2d3d] bg-[#0a111c] space-y-4">
          {exercises.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {exercises.map((ex, i) => (
                <button
                  key={ex.id}
                  onClick={() => setActiveIndex(i)}
                  className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                    i === activeIndex
                      ? "border-[#06B6D4] bg-[#06B6D4]/10 text-[#06B6D4]"
                      : "border-[#1e2d3d] text-[#94a3b8] hover:border-[#06B6D4]/40"
                  }`}
                >
                  {ex.title}
                </button>
              ))}
            </div>
          )}
          <h3 className="font-heading font-semibold text-[#e2e8f0]">{exercises[activeIndex].title}</h3>
          <ExerciseRunner key={exercises[activeIndex].id} exercise={exercises[activeIndex]} />
        </div>
      )}
    </div>
  )
}
