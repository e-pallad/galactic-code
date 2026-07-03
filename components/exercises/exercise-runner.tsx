"use client"

import { useState, useRef } from "react"
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackTests,
} from "@codesandbox/sandpack-react"
import { Button } from "@/components/ui/button"
import { Lightbulb, Eye, EyeOff, CheckCircle2 } from "lucide-react"

export interface ExerciseData {
  id: string
  title: string
  description: string
  starterCode: string
  solution: string
  hints: string[]
  tests: { description: string; code: string }[]
}

/**
 * Exercises whose code needs Node APIs (fs, process) or app-internal imports
 * can't run in the browser sandbox — they render as copy-and-run-locally.
 */
export function isBrowserRunnable(code: string): boolean {
  return !/require\(|from ["']@\/|["']fs["']|process\./.test(code)
}

function buildTestFile(tests: { description: string; code: string }[]): string {
  const body = tests
    .map((t) => `test(${JSON.stringify(t.description)}, () => {\n${t.code}\n});`)
    .join("\n\n")
  return `import React from 'react';
import { render, fireEvent, screen, renderHook, act, cleanup, within } from '@testing-library/react';
import Component from './App';

afterEach(() => cleanup());

${body}
`
}

function HintsAndSolution({ hints, solution }: { hints: string[]; solution: string }) {
  const [revealed, setRevealed] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  return (
    <div className="space-y-3">
      {hints.length > 0 && (
        <div className="space-y-2">
          {hints.slice(0, revealed).map((hint, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-sm text-[#e2e8f0]">
              <Lightbulb className="h-4 w-4 text-[#f59e0b] mt-0.5 shrink-0" />
              <span>{hint}</span>
            </div>
          ))}
          {revealed < hints.length && (
            <Button variant="outline" size="sm" onClick={() => setRevealed(revealed + 1)} className="gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Reveal Hint ({revealed + 1}/{hints.length})
            </Button>
          )}
        </div>
      )}
      <div>
        <Button variant="outline" size="sm" onClick={() => setShowSolution(!showSolution)} className="gap-1.5">
          {showSolution ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showSolution ? "Hide Solution" : "Show Solution"}
        </Button>
        {showSolution && (
          <pre className="mt-2 p-4 rounded-lg bg-[#0d1520] border border-[#1e2d3d] text-xs text-[#e2e8f0] overflow-x-auto">
            <code>{solution}</code>
          </pre>
        )}
      </div>
    </div>
  )
}

// Shape of Sandpack's test-run report (not exported by the package).
interface SpecNode {
  tests?: Record<string, { status: string }>
  describes?: Record<string, SpecNode>
}

function collectTestStatuses(node: SpecNode): string[] {
  const own = Object.values(node.tests ?? {}).map((t) => t.status)
  const nested = Object.values(node.describes ?? {}).flatMap(collectTestStatuses)
  return [...own, ...nested]
}

export function ExerciseRunner({ exercise }: { exercise: ExerciseData }) {
  const runnable = isBrowserRunnable(exercise.starterCode) && exercise.tests.length > 0
  const [award, setAward] = useState<{ xpEarned: number; alreadyCompleted: boolean } | null>(null)
  const submittedRef = useRef(false)

  const handleTestsComplete = (specs: Record<string, SpecNode>) => {
    if (submittedRef.current) return
    const statuses = Object.values(specs).flatMap(collectTestStatuses)
    if (statuses.length === 0 || !statuses.every((s) => s === "pass")) return
    submittedRef.current = true
    fetch("/api/progress/exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId: exercise.id }),
    })
      .then((res) => (res.ok ? (res.json() as Promise<{ xpEarned: number; alreadyCompleted: boolean }>) : null))
      .then((data) => {
        if (data) setAward(data)
        else submittedRef.current = false
      })
      .catch(() => {
        submittedRef.current = false
      })
  }

  if (!runnable) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#94a3b8]">{exercise.description}</p>
        <p className="text-xs text-[#f59e0b]">
          ⚠ This exercise uses Node.js or framework APIs — copy the starter code and run it in your local environment.
        </p>
        <pre className="p-4 rounded-lg bg-[#0d1520] border border-[#1e2d3d] text-xs text-[#e2e8f0] overflow-x-auto">
          <code>{exercise.starterCode}</code>
        </pre>
        {exercise.tests.length > 0 && (
          <div>
            <p className="text-xs font-medium text-[#e2e8f0] mb-2">Your solution should:</p>
            <ul className="space-y-1 text-xs text-[#94a3b8] list-disc pl-5">
              {exercise.tests.map((t, i) => <li key={i}>{t.description}</li>)}
            </ul>
          </div>
        )}
        <HintsAndSolution hints={exercise.hints} solution={exercise.solution} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#94a3b8]">{exercise.description}</p>
      <SandpackProvider
        template="react"
        theme="dark"
        files={{
          "/App.js": { code: exercise.starterCode, active: true },
          "/App.test.js": { code: buildTestFile(exercise.tests), readOnly: true },
        }}
        customSetup={{
          dependencies: { "@testing-library/react": "^14.3.1" },
        }}
        options={{ visibleFiles: ["/App.js", "/App.test.js"], activeFile: "/App.js" }}
      >
        <SandpackLayout>
          <SandpackCodeEditor showLineNumbers showTabs style={{ minHeight: 320 }} />
          <SandpackTests style={{ minHeight: 320 }} onComplete={handleTestsComplete} />
        </SandpackLayout>
      </SandpackProvider>
      {award && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/30 text-sm text-[#e2e8f0]">
          <CheckCircle2 className="h-4 w-4 text-[#10b981] shrink-0" />
          {award.xpEarned > 0
            ? `All simulations passed — +${award.xpEarned} XP logged.`
            : "All simulations passed. Exercise already completed — no additional XP."}
        </div>
      )}
      <HintsAndSolution hints={exercise.hints} solution={exercise.solution} />
    </div>
  )
}
