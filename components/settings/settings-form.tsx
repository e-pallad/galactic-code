"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "@/lib/db/schema"

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter()
  const [name, setName] = useState(user.name ?? "")
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(user.showOnLeaderboard)
  const [dailyGoal, setDailyGoal] = useState(user.dailyGoalMissions)
  const [weeklyGoal, setWeeklyGoal] = useState(user.weeklyGoalMissions)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, showOnLeaderboard, dailyGoalMissions: dailyGoal, weeklyGoalMissions: weeklyGoal }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1" placeholder="Your pilot name" />
          </div>
          <div>
            <Label>Email</Label>
            <p className="text-sm text-[#94a3b8] mt-1">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#e2e8f0]">Show on Leaderboard</p>
              <p className="text-xs text-[#94a3b8]">Allow other pilots to see your ranking</p>
            </div>
            <Switch checked={showOnLeaderboard} onCheckedChange={setShowOnLeaderboard} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mission Quotas</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <Label>Daily Goal</Label>
              <span className="text-sm font-bold text-[#06B6D4]">{dailyGoal} missions</span>
            </div>
            <Slider min={1} max={10} step={1} value={[dailyGoal]} onValueChange={([v]) => setDailyGoal(v)} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <Label>Weekly Goal</Label>
              <span className="text-sm font-bold text-[#06B6D4]">{weeklyGoal} missions</span>
            </div>
            <Slider min={5} max={50} step={5} value={[weeklyGoal]} onValueChange={([v]) => setWeeklyGoal(v)} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
