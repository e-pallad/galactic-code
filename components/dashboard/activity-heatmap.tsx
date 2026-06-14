"use client"

import dynamic from "next/dynamic"
import { useMemo } from "react"
import { subDays, format, startOfDay } from "date-fns"

const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false })
const ScatterChart = dynamic(() => import("recharts").then(m => m.ScatterChart), { ssr: false })
const Scatter = dynamic(() => import("recharts").then(m => m.Scatter), { ssr: false })
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false })
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false })
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false })

interface ActivityDay {
  date: string
  xpEarned: number
  missionsCompleted: number
}

interface ActivityHeatmapProps {
  data: ActivityDay[]
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = startOfDay(new Date())
    const days = Array.from({ length: 90 }, (_, i) => {
      const date = subDays(today, 89 - i)
      const dateStr = format(date, "yyyy-MM-dd")
      const found = data.find(d => d.date === dateStr)
      return {
        date: dateStr,
        week: Math.floor(i / 7),
        day: i % 7,
        xp: found?.xpEarned ?? 0,
        missions: found?.missionsCompleted ?? 0,
      }
    })
    return days
  }, [data])

  const getColor = (xp: number) => {
    if (xp === 0) return "#1e2d3d"
    if (xp < 20) return "#06B6D4" + "40"
    if (xp < 50) return "#06B6D4" + "80"
    if (xp < 100) return "#06B6D4" + "bb"
    return "#06B6D4"
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {heatmapData.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.xp} XP, ${day.missions} missions`}
            className="w-3 h-3 rounded-sm transition-all cursor-default"
            style={{ backgroundColor: getColor(day.xp) }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-[#94a3b8]">
        <span>Less</span>
        {[0, 20, 50, 100].map((v, i) => (
          <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(v) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
