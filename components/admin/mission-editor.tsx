"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MissionEditorProps {
  onSave: (data: {
    title: string
    type: string
    durationMinutes: number
    description: string
  }) => Promise<void>
  onCancel: () => void
  initialData?: {
    title?: string
    type?: string
    durationMinutes?: number
    description?: string
  }
}

export function MissionEditor({ onSave, onCancel, initialData }: MissionEditorProps) {
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [type, setType] = useState(initialData?.type ?? "briefing")
  const [duration, setDuration] = useState(String(initialData?.durationMinutes ?? 15))
  const [description, setDescription] = useState(initialData?.description ?? "")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ title, type, durationMinutes: parseInt(duration), description })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Mission Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Mission Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="briefing">Briefing</SelectItem>
              <SelectItem value="training-op">Training Op</SelectItem>
              <SelectItem value="strike-mission">Strike Mission</SelectItem>
              <SelectItem value="debrief">Debrief</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="duration">Duration (min)</Label>
          <Input id="duration" type="number" min="5" max="120" value={duration} onChange={(e) => setDuration(e.target.value)} required className="mt-1" />
        </div>
      </div>
      <div>
        <Label htmlFor="desc">Description</Label>
        <textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="mt-1 flex w-full rounded-md border border-[#1e2d3d] bg-[#0d1520] px-3 py-2 text-sm text-[#e2e8f0] placeholder:text-[#94a3b8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Mission"}</Button>
      </div>
    </form>
  )
}
