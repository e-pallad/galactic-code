"use client"

import { useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { newlyUnlocked, type Access } from "@/lib/unlocks"

/**
 * Announces newly revealed areas after a rank-up. The last rank the pilot has
 * seen is remembered per user in localStorage; the first visit on a device
 * records silently so existing pilots aren't greeted with old unlocks.
 */
export function UnlockWatcher({ userId, access }: { userId: string; access: Access }) {
  useEffect(() => {
    const key = `gc_seen_rank:${userId}`
    let seen: number | null = null
    try {
      const raw = window.localStorage.getItem(key)
      seen = raw === null ? null : Number(raw)
      window.localStorage.setItem(key, String(access.rank))
    } catch {
      return
    }
    if (access.explorer || seen === null || Number.isNaN(seen) || access.rank <= seen) return

    const fresh = newlyUnlocked(seen, access.rank)
    if (fresh.length === 0) return
    toast({
      title: "New area online",
      description: fresh.map((i) => i.label).join(", ") + (fresh.length > 1 ? " are" : " is") + " now in your navigation.",
    })
  }, [userId, access.rank, access.explorer])

  return null
}
