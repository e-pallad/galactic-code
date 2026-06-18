"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const EMBLEMS = ["🚀", "⭐", "🌌", "🔥", "💜", "⚡", "🛸", "🌠", "🎯", "🦅"]

interface CreateFleetFormProps {
  onCreated: () => void
}

export function CreateFleetForm({ onCreated }: CreateFleetFormProps) {
  const [name, setName] = useState("")
  const [tag, setTag] = useState("")
  const [emblem, setEmblem] = useState("🚀")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    setLoading(true)
    setError("")
    const res = await fetch("/api/combat/fleets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tag: tag.toUpperCase(), emblem }),
    })
    const data = await res.json() as { error?: string }
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Failed to create fleet"); return }
    onCreated()
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fleet-name">Fleet Name</Label>
        <Input
          id="fleet-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Galactic Vanguard"
          className="mt-1"
          maxLength={50}
        />
      </div>
      <div>
        <Label htmlFor="fleet-tag">Tag (2–4 uppercase letters/numbers)</Label>
        <Input
          id="fleet-tag"
          value={tag}
          onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
          placeholder="GV"
          className="mt-1"
          maxLength={4}
        />
      </div>
      <div>
        <Label>Emblem</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {EMBLEMS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmblem(e)}
              aria-label={`Emblem ${e}`}
              aria-pressed={emblem === e}
              className={`text-2xl p-2 rounded-lg border transition-all ${emblem === e ? "border-[#06B6D4] bg-[#06B6D4]/10" : "border-[#1e2d3d]"}`}
            >
              <span aria-hidden="true">{e}</span>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button
        onClick={handleSubmit}
        disabled={loading || !name.trim() || tag.length < 2}
        className="w-full"
      >
        {loading ? "Creating..." : "Create Fleet"}
      </Button>
    </div>
  )
}
