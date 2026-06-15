import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/missions"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, desc, and, isNull } from "drizzle-orm"
import { getRankProgress } from "@/lib/xp"
import { Trophy, Flame } from "lucide-react"

export const metadata = { title: "Leaderboard" }

export default async function LeaderboardPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await getUser(clerkId)
  if (!user) redirect("/sign-in")

  const topPilots = await db
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
    .orderBy(desc(users.totalXp))
    .limit(50)

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
            return (
              <div
                key={pilot.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                  isMe ? "border-[#06B6D4]/50 bg-[#06B6D4]/5" : "border-[#1e2d3d] bg-[#0d1520]"
                }`}
              >
                <span className={`w-8 text-center font-bold font-heading text-lg ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-[#94a3b8]"
                }`}>
                  {i + 1}
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
    </div>
  )
}
