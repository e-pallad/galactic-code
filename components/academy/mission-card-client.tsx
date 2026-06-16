"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MissionCard } from "@/components/academy/mission-card"
import { SkillCheckModal } from "@/components/academy/skill-check-modal"
import { CelebrationModal } from "@/components/gamification/celebration-modal"
import type { Mission } from "@/lib/db/schema"

interface Question {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
}

interface MissionCardClientProps {
  mission: Mission
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED"
  questions: Question[]
}

export function MissionCardClient({ mission, status, questions }: MissionCardClientProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState(status)
  const [showSkillCheck, setShowSkillCheck] = useState(false)
  const [pendingSkillCheck, setPendingSkillCheck] = useState(false)
  const [celebration, setCelebration] = useState<{ type: "levelUp" | "medal"; title: string; description: string; icon?: string } | null>(null)

  const handleComplete = async (missionId: string, usedFocusCycle: boolean) => {
    const res = await fetch("/api/progress/mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId, action: "complete", usedFocusCycle }),
    })
    const data = await res.json() as { leveledUp: boolean; newRank: number; newXp: number; newMedals: string[] }
    setCurrentStatus("COMPLETED")
    const hasCelebration = data.leveledUp || data.newMedals?.length > 0
    if (data.leveledUp) {
      setCelebration({ type: "levelUp", title: `Rank ${data.newRank} Achieved!`, description: `You've reached a new rank with ${data.newXp.toLocaleString()} XP!`, icon: "⭐" })
    } else if (data.newMedals?.length > 0) {
      setCelebration({ type: "medal", title: "Medal Unlocked!", description: `You earned: ${data.newMedals.join(", ")}`, icon: "🏅" })
    }
    if (questions.length > 0) {
      if (hasCelebration) setPendingSkillCheck(true)
      else setShowSkillCheck(true)
    }
    router.refresh()
  }

  const handleCelebrationClose = () => {
    setCelebration(null)
    if (pendingSkillCheck) {
      setPendingSkillCheck(false)
      setShowSkillCheck(true)
    }
  }

  const handleSkip = async (missionId: string) => {
    await fetch("/api/progress/mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId, action: "skip" }),
    })
    setCurrentStatus("SKIPPED")
    router.refresh()
  }

  return (
    <>
      <MissionCard
        mission={mission}
        status={currentStatus}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
      {showSkillCheck && questions.length > 0 && (
        <SkillCheckModal
          open={showSkillCheck}
          onClose={() => setShowSkillCheck(false)}
          questions={questions}
          missionId={mission.id}
          onComplete={() => {}}
        />
      )}
      {celebration && (
        <CelebrationModal
          open={!!celebration}
          onClose={handleCelebrationClose}
          type={celebration.type}
          title={celebration.title}
          description={celebration.description}
          icon={celebration.icon}
        />
      )}
    </>
  )
}
