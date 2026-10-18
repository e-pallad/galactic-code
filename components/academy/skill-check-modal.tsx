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
}

interface ReviewItem {
  questionId: string
  selectedIndex: number | null
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
  const [showResult, setShowResult] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ score: number; review: ReviewItem[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<number[]>([])

  const currentQuestion = questions[currentIndex]
  const isAnswered = selectedOption !== null

  const handleSelect = (index: number) => {
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
      setError(null)
      try {
        // The server grades against the question bank and sends back the review.
        const res = await fetch("/api/progress/skill-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            missionId,
            answers: questions.map((q, i) => ({ questionId: q.id, selectedIndex: newAnswers[i] })),
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string }
          setError(err.error ?? "Skill check could not be submitted")
          return
        }
        const data = await res.json() as { score: number; xpEarned: number; passed: boolean; perfect: boolean; review: ReviewItem[] }
        analytics.skillCheckSubmit({
          score: data.score,
          passed: data.passed,
          perfect: data.perfect,
          xp_earned: data.xpEarned,
          question_count: questions.length,
        })
        setAnswers(newAnswers)
        setResult({ score: data.score, review: data.review })
        setShowResult(true)
        onComplete(data.score, data.xpEarned)
      } finally {
        setSubmitting(false)
      }
    }
  }

  if (showResult && result) {
    const finalScore = result.score
    const correctCount = result.review.filter((r) => r.selectedIndex === r.correctIndex).length
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Skill Check Results</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <div className="text-5xl font-bold font-heading mb-2" style={{ color: finalScore >= 70 ? "#10B981" : "#ef4444" }}>
              {finalScore}%
            </div>
            <p className="text-[#94a3b8]">{correctCount} of {questions.length} correct</p>
            {finalScore >= 70 ? (
              <p className="text-green-400 font-medium mt-2">Mission Passed!</p>
            ) : (
              <p className="text-red-400 font-medium mt-2">Keep Training, Pilot</p>
            )}
          </div>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const item = result.review.find((r) => r.questionId === q.id)
              if (!item) return null
              const ok = item.selectedIndex === item.correctIndex
              return (
                <div key={q.id} className={cn("p-3 rounded-lg text-sm border", ok ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10")}>
                  <p className="text-[#e2e8f0] font-medium mb-1 flex items-start gap-2">
                    {ok ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-400" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />}
                    {i + 1}. {q.question}
                  </p>
                  {!ok && (
                    <p className="text-[#94a3b8]">
                      Correct answer: <span className="text-green-400">{q.options[item.correctIndex]}</span>
                    </p>
                  )}
                  <p className="text-[#94a3b8] mt-1">{item.explanation}</p>
                </div>
              )
            })}
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
                const optionStyle = i === selectedOption
                  ? "border-[#06B6D4] bg-[#06B6D4]/10"
                  : "border-[#1e2d3d] hover:border-[#06B6D4]/50"

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={cn("w-full text-left px-4 py-3 rounded-lg border text-sm transition-all cursor-pointer", optionStyle)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-[#e2e8f0]">{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
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
