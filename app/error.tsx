"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-center px-4">
      <div className="text-6xl mb-6">💥</div>
      <h2 className="font-heading text-2xl font-bold text-[#e2e8f0] mb-2">System Malfunction</h2>
      <p className="text-[#94a3b8] mb-6 max-w-md">A critical error occurred in the ship's systems. Our engineers have been notified.</p>
      <Button onClick={reset}>Reboot Systems</Button>
    </div>
  )
}
