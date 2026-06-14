"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

interface ShareRankButtonProps {
  rank: number
  rankLabel: string
  totalXp: number
  appUrl?: string
}

export function ShareRankButton({ rank, rankLabel, totalXp, appUrl = "https://galacticcode.dev" }: ShareRankButtonProps) {
  const handleShare = () => {
    const text = `I just reached rank ${rank} — ${rankLabel} — on Galactic Code with ${totalXp.toLocaleString()} XP. Learning to code one mission at a time. ${appUrl}`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className="gap-2 border-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#06B6D4]"
    >
      <Share2 className="h-3.5 w-3.5" />
      Share rank
    </Button>
  )
}
