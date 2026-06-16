"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Zap } from "lucide-react"

const tracks = [
  { id: "javascript", name: "JavaScript", icon: "⚡", class: "Code Pilot", description: "Build the web. Master JS fundamentals from the ground up." },
  { id: "react", name: "React", icon: "⚛️", class: "Reactor Pilot", description: "Build dynamic UIs. From JSX to advanced state patterns." },
  { id: "nodejs", name: "Node.js", icon: "🖥️", class: "Systems Engineer", description: "Server-side JS. APIs, CLIs, and production backends." },
  { id: "nextjs", name: "Next.js", icon: "🌐", class: "Warp Architect", description: "Full-stack React at warp speed. SSR, auth, and SaaS." },
  { id: "python", name: "Python", icon: "🔮", class: "Data Mage", description: "Data, AI, automation. Wield Python's power." },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [dailyGoal, setDailyGoal] = useState(3)
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    if (!selectedTrack) return
    setLoading(true)
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: selectedTrack, dailyGoalMissions: dailyGoal }),
      })
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080C14] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-8">
                <Zap className="h-6 w-6 text-[#06B6D4]" />
                <span className="font-heading font-bold text-[#06B6D4] text-lg">GALACTIC CODE</span>
              </div>
              <h1 className="font-heading text-3xl font-bold text-[#e2e8f0] mb-2">Choose Your Path</h1>
              <p className="text-[#94a3b8] mb-8">Select your character class to begin your galactic journey.</p>
              <div className="grid gap-4 mb-8">
                {tracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`p-5 rounded-xl border text-left transition-all ${
                      selectedTrack === track.id
                        ? "border-[#06B6D4] bg-[#06B6D4]/10"
                        : "border-[#1e2d3d] bg-[#0d1520] hover:border-[#1e2d3d]/80"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{track.icon}</span>
                      <div>
                        <p className="font-heading font-semibold text-[#e2e8f0]">{track.name}</p>
                        <p className="text-xs text-[#06B6D4]">{track.class}</p>
                        <p className="text-sm text-[#94a3b8] mt-1">{track.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Button className="w-full" disabled={!selectedTrack} onClick={() => setStep(2)}>
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="font-heading text-3xl font-bold text-[#e2e8f0] mb-2">Set Your Daily Mission Quota</h1>
              <p className="text-[#94a3b8] mb-8">How many missions do you want to complete each day?</p>
              <div className="p-6 rounded-xl border border-[#1e2d3d] bg-[#0d1520] mb-8">
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold font-heading text-[#06B6D4]">{dailyGoal}</span>
                  <p className="text-[#94a3b8] text-sm mt-1">missions per day</p>
                </div>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[dailyGoal]}
                  onValueChange={([v]) => setDailyGoal(v)}
                />
                <div className="flex justify-between text-xs text-[#94a3b8] mt-2">
                  <span>1 (Light)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Intense)</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handleComplete} disabled={loading} className="flex-1">
                  {loading ? "Launching..." : "Launch Mission"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
