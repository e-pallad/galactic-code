"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/lib/db/schema"

export function GoalsForm({ user }: { user: User }) {
  const router = useRouter()
  const [daily, setDaily] = useState(user.dailyGoalMissions)
  const [weekly, setWeekly] = useState(user.weeklyGoalMissions)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyGoalMissions: daily, weeklyGoalMissions: weekly }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Daily Quota</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <span className="text-4xl font-bold font-heading text-[#06B6D4]">{daily}</span>
            <p className="text-sm text-[#94a3b8]">missions per day</p>
          </div>
          <Slider min={1} max={10} step={1} value={[daily]} onValueChange={([v]) => setDaily(v)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Weekly Quota</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <span className="text-4xl font-bold font-heading text-[#06B6D4]">{weekly}</span>
            <p className="text-sm text-[#94a3b8]">missions per week</p>
          </div>
          <Slider min={5} max={70} step={5} value={[weekly]} onValueChange={([v]) => setWeekly(v)} />
        </CardContent>
      </Card>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save Goals"}
      </Button>
    </div>
  )
}
