export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { getLeaderboardPage, LEADERBOARD_PAGE_SIZE } from "@/lib/leaderboard"
import { PilotList } from "@/components/leaderboard/pilot-list"
import { Trophy } from "lucide-react"
import { SectionTabs, CREW_TABS } from "@/components/layout/section-tabs"

export const metadata = { title: "Leaderboard" }

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const clerkId = await getClerkId()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const { pilots, hasNext } = await getLeaderboardPage(page)

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionTabs tabs={CREW_TABS} label="Crew sections" />
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-[#06B6D4]" />
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Leaderboard</h1>
      </div>
      <PilotList
        pilots={pilots}
        page={page}
        pageSize={LEADERBOARD_PAGE_SIZE}
        hasNext={hasNext}
        baseHref="/leaderboard"
        currentUserId={user.id}
        emptyHint="Enable leaderboard visibility in Settings to appear here."
      />
    </div>
  )
}
