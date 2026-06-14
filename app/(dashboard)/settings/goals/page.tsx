"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useRouter } from "next/navigation"

export default function GoalsPage() {
  const router = useRouter()
  const [daily, setDaily] = useState(3)
  const [weekly, setWeekly] = useState(10)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/user/stats").then(r => r.json()).then(d => {
      if (d.user) { setDaily(d.user.dailyGoalMissions); setWeekly(d.user.weeklyGoalMissions) }
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/user/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailyGoalMissions: daily, weeklyGoalMissions: weekly }),
    })
    setSaving(false)
    router.push("/settings")
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Mission Goals</h1>
      <div className="p-6 rounded-xl border border-[#1e2d3d] bg-[#0d1520] space-y-6">
        <div>
          <div className="flex justify-between mb-3">
            <Label className="text-sm">Daily Mission Quota</Label>
            <span className="font-bold text-[#06B6D4]">{daily}</span>
          </div>
          <Slider min={1} max={10} step={1} value={[daily]} onValueChange={([v]) => setDaily(v)} />
        </div>
        <div>
          <div className="flex justify-between mb-3">
            <Label className="text-sm">Weekly Mission Target</Label>
            <span className="font-bold text-[#06B6D4]">{weekly}</span>
          </div>
          <Slider min={5} max={50} step={5} value={[weekly]} onValueChange={([v]) => setWeekly(v)} />
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Goals"}</Button>
    </div>
  )
}
