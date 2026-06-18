"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ActiveBattle {
  id: string
  entityName: string
  entityIcon: string
}

export function ActiveBattleBanner() {
  const [battle, setBattle] = useState<ActiveBattle | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/combat/battles/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { battle?: { id: string }; entity?: { name: string; icon: string } } | null) => {
        if (active && d?.battle) {
          setBattle({
            id: d.battle.id,
            entityName: d.entity?.name ?? "an entity",
            entityIcon: d.entity?.icon ?? "👾",
          })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (!battle) return null

  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl shrink-0" aria-hidden="true">{battle.entityIcon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#e2e8f0]">Battle in progress</p>
          <p className="text-xs text-[#94a3b8] truncate">You&apos;re mid-fight against {battle.entityName}.</p>
        </div>
      </div>
      <Link href={`/combat/${battle.id}`} className="shrink-0">
        <Button size="sm">Resume</Button>
      </Link>
    </div>
  )
}
