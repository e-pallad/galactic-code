export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { getClerkId } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, desc, asc, and, isNull } from "drizzle-orm"
import { getRankProgress } from "@/lib/xp"
import { Trophy, Flame } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Leaderboard" }

const PAGE_SIZE = 50

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
  const offset = (page - 1) * PAGE_SIZE

  // Fetch one extra row to know whether a next page exists without a count query.
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalXp: users.totalXp,
      rank: users.rank,
      streak: users.streak,
      track: users.track,
    })
    .from(users)
    .where(and(eq(users.showOnLeaderboard, true), isNull(users.deletedAt)))
    // Tie-break equal XP by signup order so identical scores have a stable rank.
    .orderBy(desc(users.totalXp), asc(users.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset(offset)

  const hasNext = rows.length > PAGE_SIZE
  const topPilots = rows.slice(0, PAGE_SIZE)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Trophy className="h-6 w-6 text-[#06B6D4]" />
        <h1 className="font-heading text-2xl font-bold text-[#e2e8f0]">Leaderboard</h1>
      </div>

      {topPilots.length === 0 ? (
        <div className="text-center py-16 text-[#94a3b8]">
          <p className="text-4xl mb-4">🏆</p>
          <p className="font-medium text-[#e2e8f0]">No pilots on the board yet</p>
          <p className="text-sm mt-1">Enable leaderboard visibility in Settings to appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {topPilots.map((pilot, i) => {
            const rankData = getRankProgress(pilot.totalXp)
            const isMe = pilot.id === user.id
            const globalRank = offset + i + 1
            return (
              <div
                key={pilot.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isMe ? "border-[#06B6D4]/50 bg-[#06B6D4]/5" : "border-[#1e2d3d] bg-[#0d1520]"
                }`}
              >
                <span className={`w-8 text-center font-bold font-heading text-lg ${
                  globalRank === 1 ? "text-yellow-400" : globalRank === 2 ? "text-gray-300" : globalRank === 3 ? "text-amber-600" : "text-[#94a3b8]"
                }`}>
                  {globalRank}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#06B6D4] to-[#6366F1] flex items-center justify-center text-sm font-bold text-white">
                  {(pilot.name ?? "?")[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#e2e8f0] truncate">{pilot.name ?? "Anonymous Pilot"} {isMe && <span className="text-xs text-[#06B6D4]">(You)</span>}</p>
                  <p className="text-xs text-[#94a3b8]">{rankData.label} · {pilot.track}</p>
                </div>
                {pilot.streak > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-orange-400">{pilot.streak}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="font-bold text-[#06B6D4]">{pilot.totalXp.toLocaleString()}</p>
                  <p className="text-xs text-[#94a3b8]">XP</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(page > 1 || hasNext) && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link
              href={`/leaderboard?page=${page - 1}`}
              className="px-4 py-2 rounded-md border border-[#1e2d3d] bg-[#0d1520] text-sm text-[#e2e8f0] hover:border-[#06B6D4]/40 transition-colors"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-[#94a3b8]">Page {page}</span>
          {hasNext ? (
            <Link
              href={`/leaderboard?page=${page + 1}`}
              className="px-4 py-2 rounded-md border border-[#1e2d3d] bg-[#0d1520] text-sm text-[#e2e8f0] hover:border-[#06B6D4]/40 transition-colors"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}
