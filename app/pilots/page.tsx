export const dynamic = "force-dynamic"

import Link from "next/link"
import { Trophy, Zap, ArrowRight } from "lucide-react"
import { getLeaderboardPage, LEADERBOARD_PAGE_SIZE } from "@/lib/leaderboard"
import { PilotList } from "@/components/leaderboard/pilot-list"
import { StarField } from "@/components/layout/star-field"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Pilot Leaderboard — Galactic Code",
  description:
    "The top pilots of Galactic Code, ranked by XP earned from coding missions. Learn React, Node.js, and Next.js — and climb the board.",
}

export default async function PublicLeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const { pilots, hasNext } = await getLeaderboardPage(page)

  return (
    <div className="min-h-screen bg-[#080C14]">
      <StarField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 space-y-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#06B6D4]" />
            <span className="font-heading font-bold text-[#06B6D4]">GALACTIC CODE</span>
          </Link>
          <Link href="/sign-up">
            <Button size="sm" className="gap-1.5">
              Join the Academy <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </header>

        <div className="flex items-center gap-3 pt-4">
          <Trophy className="h-6 w-6 text-[#06B6D4]" />
          <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Pilot Leaderboard</h1>
        </div>
        <p className="text-sm text-[#94a3b8]">
          Every XP point on this board was earned by completing coding missions — React, Node.js, and Next.js.
        </p>

        <PilotList
          pilots={pilots}
          page={page}
          pageSize={LEADERBOARD_PAGE_SIZE}
          hasNext={hasNext}
          baseHref="/pilots"
          emptyHint="Be the first pilot on the board."
        />

        <div className="text-center pt-6 pb-4 border-t border-[#1e2d3d]">
          <p className="text-[#94a3b8] mb-3">Think you can climb the ranks?</p>
          <Link href="/sign-up">
            <Button className="gap-2">
              Start Your First Mission — Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
