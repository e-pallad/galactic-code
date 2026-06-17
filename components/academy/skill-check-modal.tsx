"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle } from "lucide-react"
import { analytics } from "@/lib/analytics"

interface Question {
  id: string
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
}

interface SkillCheckModalProps {
  open: boolean
  onClose: () => void
  questions: Question[]
  missionId: string
  onComplete: (score: number, xpEarned: number) => void
}

export function SkillCheckModal({ open, onClose, questions, missionId, onComplete }: SkillCheckModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const currentQuestion = questions[currentIndex]
  const isAnswered = selectedOption !== null
  const isCorrect = selectedOption === currentQuestion?.correctIndex

  const handleSelect = (index: number) => {
    if (isAnswered) return
    setSelectedOption(index)
  }

  const handleNext = async () => {
    if (selectedOption === null) return
    const newAnswers = [...answers, selectedOption]

    if (currentIndex < questions.length - 1) {
      setAnswers(newAnswers)
      setCurrentIndex(currentIndex + 1)
      setSelectedOption(null)
    } else {
      setSubmitting(true)
      const correct = newAnswers.filter((a, i) => a === questions[i].correctIndex).length
      const score = Math.round((correct / questions.length) * 100)
      try {
        const res = await fetch("/api/progress/skill-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionId, score }),
        })
        const data = await res.json() as { xpEarned: number; passed: boolean; perfect: boolean }
        analytics.skillCheckSubmit({
          score,
          passed: data.passed ?? score >= 70,
          perfect: data.perfect ?? score === 100,
          xp_earned: data.xpEarned ?? 0,
          question_count: questions.length,
        })
        setShowResult(true)
        onComplete(score, data.xpEarned)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const score = answers.filter((a, i) => a === questions[i]?.correctIndex).length

  if (showResult) {
    const finalScore = Math.round((score / questions.length) * 100)
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skill Check Results</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <div className="text-5xl font-bold font-heading mb-2" style={{ color: finalScore >= 70 ? "#10B981" : "#ef4444" }}>
              {finalScore}%
            </div>
            <p className="text-[#94a3b8]">{score} of {questions.length} correct</p>
            {finalScore >= 70 ? (
              <p className="text-green-400 font-medium mt-2">Mission Passed!</p>
            ) : (
              <p className="text-red-400 font-medium mt-2">Keep Training, Pilot</p>
            )}
          </div>
          <Button onClick={onClose} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Skill Check — Question {currentIndex + 1} of {questions.length}</DialogTitle>
        </DialogHeader>
        {currentQuestion && (
          <div className="space-y-4">
            <p className="text-[#e2e8f0] font-medium">{currentQuestion.question}</p>
            <div className="space-y-2">
              {currentQuestion.options.map((option, i) => {
                let optionStyle = "border-[#1e2d3d] hover:border-[#06B6D4]/50"
                if (isAnswered) {
                  if (i === currentQuestion.correctIndex) optionStyle = "border-green-500 bg-green-500/10"
                  else if (i === selectedOption) optionStyle = "border-red-500 bg-red-500/10"
                  else optionStyle = "border-[#1e2d3d] opacity-50"
                } else if (i === selectedOption) {
                  optionStyle = "border-[#06B6D4] bg-[#06B6D4]/10"
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={cn("w-full text-left px-4 py-3 rounded-lg border text-sm transition-all", optionStyle, !isAnswered && "cursor-pointer")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-[#e2e8f0]">{option}</span>
                      {isAnswered && i === currentQuestion.correctIndex && <CheckCircle className="ml-auto h-4 w-4 text-green-400" />}
                      {isAnswered && i === selectedOption && i !== currentQuestion.correctIndex && <XCircle className="ml-auto h-4 w-4 text-red-400" />}
                    </div>
                  </button>
                )
              })}
            </div>
            {isAnswered && (
              <div className={cn("p-3 rounded-lg text-sm", isCorrect ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400")}>
                <p className="font-medium mb-1">{isCorrect ? "Correct!" : "Incorrect"}</p>
                <p className="text-[#94a3b8]">{currentQuestion.explanation}</p>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-[#94a3b8]">{currentIndex + 1} / {questions.length}</span>
              <Button onClick={handleNext} disabled={!isAnswered || submitting}>
                {currentIndex < questions.length - 1 ? "Next Question" : "Submit"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
