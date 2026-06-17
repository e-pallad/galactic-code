"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface LogEntry {
  id: string
  actorUserId: string | null
  damageDealt: number
  isCritical: boolean
  description: string
  turnNumber: number
}

export function BattleLogFeed({ logs, currentUserId }: { logs: LogEntry[]; currentUserId: string }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [logs])

  return (
    <div className="h-64 overflow-y-auto rounded-xl border border-[#1e2d3d] bg-[#080C14] p-3 space-y-1.5">
      {logs.map((log) => (
        <p
          key={log.id}
          className={cn(
            "text-xs font-mono",
            log.isCritical ? "text-[#f59e0b]" :
            log.actorUserId === null ? "text-red-400" :
            log.actorUserId === currentUserId ? "text-[#06B6D4]" :
            "text-[#94a3b8]"
          )}
        >
          <span className="text-[#1e2d3d] mr-1">[T{log.turnNumber}]</span>
          {log.description}
        </p>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
