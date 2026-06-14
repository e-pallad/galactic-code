"use client"

import { useEffect, useState } from "react"
import { Users } from "lucide-react"

export function CrewWidget() {
  const [count, setCount] = useState<number | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource("/api/crew-bay/presence")
    
    es.onopen = () => setConnected(true)
    es.addEventListener("crew-count", (e) => {
      try {
        const data = JSON.parse(e.data) as { count: number }
        setCount(data.count)
      } catch {}
    })
    es.onerror = () => setConnected(false)

    // Send heartbeat every 30s
    const heartbeat = setInterval(async () => {
      try {
        await fetch("/api/crew-bay/presence", { method: "POST" })
      } catch {}
    }, 30000)

    // Initial heartbeat
    fetch("/api/crew-bay/presence", { method: "POST" }).catch(() => {})

    return () => {
      es.close()
      clearInterval(heartbeat)
      fetch("/api/crew-bay/presence", { method: "DELETE" }).catch(() => {})
    }
  }, [])

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0d1520] border border-[#1e2d3d]">
      <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-[#94a3b8]"}`} />
      <Users className="h-4 w-4 text-[#94a3b8]" />
      <span className="text-sm text-[#94a3b8]">
        {count === null ? "..." : `${count} online`}
      </span>
    </div>
  )
}
