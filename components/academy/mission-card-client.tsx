"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MissionCard } from "@/components/academy/mission-card"
import { SkillCheckModal } from "@/components/academy/skill-check-modal"
import { CelebrationModal } from "@/components/gamification/celebration-modal"
import { analytics } from "@/lib/analytics"
import { RANK_THRESHOLDS, MEDAL_DEFINITIONS } from "@/lib/xp"
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
  isLocked?: boolean
  userName?: string | null
}

export function MissionCardClient({ mission, status, questions, isLocked = false, userName }: MissionCardClientProps) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState(status)
  const [showSkillCheck, setShowSkillCheck] = useState(false)
  const [pendingSkillCheck, setPendingSkillCheck] = useState(false)
  const [celebration, setCelebration] = useState<{ type: "levelUp" | "medal"; title: string; description: string; icon?: string; shareUrl?: string } | null>(null)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://galacticcode.dev"

  const handleComplete = async (missionId: string, usedFocusCycle: boolean) => {
    const res = await fetch("/api/progress/mission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId, action: "complete", usedFocusCycle }),
    })
    const data = await res.json() as { leveledUp: boolean; newRank: number; newXp: number; newMedals: string[]; track?: string }
    analytics.missionComplete({
      mission_title: mission.title,
      mission_type: mission.type,
      track: data.track ?? "unknown",
      used_focus_cycle: usedFocusCycle,
      leveled_up: data.leveledUp ?? false,
      xp_earned: data.newXp ?? 0,
    })
    setCurrentStatus("COMPLETED")
    const hasCelebration = data.leveledUp || data.newMedals?.length > 0
    if (data.leveledUp) {
      const rankLabel = RANK_THRESHOLDS.find((t) => t.rank === data.newRank)?.label ?? `Rank ${data.newRank}`
      const shareUrl = `${APP_URL}/share?${new URLSearchParams({ type: "rank", rank: String(data.newRank), label: rankLabel, xp: String(data.newXp), name: userName ?? "Cadet" })}`
      setCelebration({ type: "levelUp", title: `Rank ${data.newRank} Achieved!`, description: `You've reached ${rankLabel} with ${data.newXp.toLocaleString()} XP!`, icon: "⭐", shareUrl })
    } else if (data.newMedals?.length > 0) {
      const def = MEDAL_DEFINITIONS.find((m) => m.slug === data.newMedals[0])
      const shareUrl = def
        ? `${APP_URL}/share?${new URLSearchParams({ type: "medal", medal: def.label, icon: def.icon, description: def.description, name: userName ?? "Cadet" })}`
        : undefined
      setCelebration({ type: "medal", title: def?.label ?? "Medal Unlocked!", description: def?.description ?? `You earned: ${data.newMedals.join(", ")}`, icon: def?.icon ?? "🏅", shareUrl })
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
    analytics.missionSkip({ mission_title: mission.title, mission_type: mission.type, track: mission.type })
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
        isLocked={isLocked}
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
          shareUrl={celebration.shareUrl}
        />
      )}
    </>
  )
}
