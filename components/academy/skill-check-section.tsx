"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SkillCheckModal } from "@/components/academy/skill-check-modal"

interface Question {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
}

interface SkillCheckSectionProps {
  missionId: string
  questions: Question[]
}

export function SkillCheckSection({ missionId, questions }: SkillCheckSectionProps) {
  const [open, setOpen] = useState(false)

  if (questions.length === 0) return null

  return (
    <div className="mt-3">
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Take Skill Check ({questions.length}Q)
      </Button>
      <SkillCheckModal
        open={open}
        onClose={() => setOpen(false)}
        questions={questions}
        missionId={missionId}
        onComplete={() => setOpen(false)}
      />
    </div>
  )
}
