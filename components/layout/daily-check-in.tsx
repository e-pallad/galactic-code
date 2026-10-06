"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Records the pilot's daily check-in once per day per browser session, then
 * refreshes server data if it paid XP or moved the streak. The endpoint is
 * idempotent, so the session guard only saves redundant requests.
 */
export function DailyCheckIn({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    const key = `gc_checkin:${userId}:${new Date().toLocaleDateString("en-CA")}`
    try {
      if (window.sessionStorage.getItem(key)) return
      window.sessionStorage.setItem(key, "1")
    } catch {
      // Storage blocked: fall through and rely on the endpoint's idempotency.
    }
    fetch("/api/user/check-in", { method: "POST" })
      .then((res) => (res.ok ? (res.json() as Promise<{ changed: boolean }>) : null))
      .then((data) => {
        if (data?.changed) router.refresh()
      })
      .catch(() => {})
  }, [userId, router])

  return null
}
