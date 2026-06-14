import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import { getUser } from "@/lib/missions"
import { getRankProgress } from "@/lib/xp"
import { Zap, Flame } from "lucide-react"

export async function TopBar() {
  const clerkUser = await currentUser()
  const user = clerkUser ? await getUser(clerkUser.id) : null
  const rankData = user ? getRankProgress(user.totalXp) : null

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 md:px-6 border-b border-[#1e2d3d] bg-[#080C14]/80 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {user && rankData && (
          <>
            <div className="flex items-center gap-1.5 text-sm">
              <Zap className="h-4 w-4 text-[#06B6D4]" />
              <span className="text-[#e2e8f0] font-medium">{user.totalXp.toLocaleString()} XP</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-[#94a3b8]">Rank {rankData.rank}</span>
              <span className="text-[#06B6D4] font-medium">{rankData.label}</span>
            </div>
            {user.streak > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-orange-400 font-medium">{user.streak}</span>
              </div>
            )}
          </>
        )}
      </div>
      <UserButton />
    </header>
  )
}
