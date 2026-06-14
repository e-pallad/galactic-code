"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
      <p className="text-4xl">⚠️</p>
      <h2 className="font-heading text-xl font-bold text-[#e2e8f0]">Mission Failed</h2>
      <p className="text-[#94a3b8] max-w-sm">{error.message || "An unexpected error occurred."}</p>
      <Button onClick={reset} variant="outline">Retry Mission</Button>
    </div>
  )
}
