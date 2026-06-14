"use client"

import { useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

const sounds = [
  { id: "lofi", label: "Lo-Fi", description: "Chill beats" },
  { id: "whitenoise", label: "White Noise", description: "Pure focus" },
  { id: "space", label: "Space Ambience", description: "Cosmic atmosphere" },
]

export function FocusSounds() {
  const [active, setActive] = useState<string | null>(null)

  const toggle = (id: string) => {
    setActive(active === id ? null : id)
  }

  return (
    <div className="p-4 rounded-lg border border-[#1e2d3d] bg-[#0d1520]">
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-[#94a3b8]">
        {active ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        Ambient Sounds
      </div>
      <div className="flex flex-wrap gap-2">
        {sounds.map((sound) => (
          <Button
            key={sound.id}
            size="sm"
            variant={active === sound.id ? "default" : "outline"}
            onClick={() => toggle(sound.id)}
            title={sound.description}
          >
            {sound.label}
          </Button>
        ))}
      </div>
      {active && (
        <p className="text-xs text-[#94a3b8] mt-2">
          Playing: {sounds.find(s => s.id === active)?.description} (placeholder — connect audio source)
        </p>
      )}
    </div>
  )
}
