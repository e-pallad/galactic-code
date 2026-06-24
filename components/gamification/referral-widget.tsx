"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Users, Share2 } from "lucide-react"

interface ReferralData {
  referralCode: string | null
  referralCount: number
  referralUrl: string | null
}

export function ReferralWidget() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/referral/stats")
      .then((r) => r.json())
      .then((d: ReferralData) => setData(d))
      .catch(() => {})
  }, [])

  if (!data?.referralUrl) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.referralUrl!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTweet = () => {
    const text = `Join me on Galactic Code — learn to code through space missions, XP, and ship combat. Use my link for a free XP bonus:`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(data.referralUrl!)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-[#06B6D4]" />
          Recruit Cadets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[#94a3b8]">
          Share your link. Both you and every new cadet who signs up earn{" "}
          <span className="text-[#06B6D4] font-semibold">+50 XP</span> instantly.
        </p>
        {data.referralCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20">
            <span className="text-[#06B6D4] font-bold text-lg">{data.referralCount}</span>
            <span className="text-[#94a3b8] text-sm">
              cadet{data.referralCount !== 1 ? "s" : ""} recruited ·{" "}
              <span className="text-[#10B981]">+{data.referralCount * 50} XP earned</span>
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <code className="flex-1 px-3 py-2 rounded-md bg-[#080C14] border border-[#1e2d3d] text-xs text-[#94a3b8] truncate font-mono">
            {data.referralUrl}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="gap-1.5 shrink-0 border-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#06B6D4]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleTweet}
          className="w-full gap-2 border-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#1DA1F2]"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share on X / Twitter
        </Button>
      </CardContent>
    </Card>
  )
}
