"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"

export function HangarClient({ ship }: { ship: { name: string } }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(ship.name)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/combat/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string }
      if (!res.ok) {
        toast({ title: "Rename failed", description: data.error ?? "Something went wrong.", variant: "destructive" })
        return
      }
      setEditing(false)
      router.refresh()
    } catch {
      toast({ title: "Connection error", description: "Could not rename your ship.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          className="max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <Button size="sm" onClick={handleSave} disabled={loading || !name.trim()}>Save</Button>
        <Button size="sm" variant="outline" onClick={() => { setEditing(false); setName(ship.name) }}>Cancel</Button>
      </div>
    )
  }

  return (
    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Rename Ship</Button>
  )
}
