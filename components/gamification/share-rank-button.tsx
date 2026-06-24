"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check } from "lucide-react"

interface ShareRankButtonProps {
  rank: number
  rankLabel: string
  totalXp: number
  name?: string | null
  appUrl?: string
}

export function ShareRankButton({
  rank,
  rankLabel,
  totalXp,
  name,
  appUrl = "https://galacticcode.dev",
}: ShareRankButtonProps) {
  const [copied, setCopied] = useState(false)

  const shareParams = new URLSearchParams({
    type: "rank",
    rank: String(rank),
    label: rankLabel,
    xp: String(totalXp),
    name: name ?? "Cadet",
  })
  const shareUrl = `${appUrl}/share?${shareParams}`
  const tweetText = `Just reached Rank ${rank} — ${rankLabel} — on @GalacticCodeDev with ${totalXp.toLocaleString()} XP. Learning to code through space missions!`

  const handleTweet = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    )
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleTweet}
        className="gap-2 border-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#06B6D4]"
      >
        <Share2 className="h-3.5 w-3.5" />
        Share rank
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="gap-2 border-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0]"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy link"}
      </Button>
    </div>
  )
}
