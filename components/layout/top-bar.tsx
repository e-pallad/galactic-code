import { currentUser } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"
import { cookies } from "next/headers"
import { getUser } from "@/lib/missions"
import { getRankProgress } from "@/lib/xp"
import { DEMO_CLERK_ID } from "@/lib/demo"
import { Zap, Flame } from "lucide-react"
import Link from "next/link"

export async function TopBar() {
  const jar = await cookies()
  const demo = jar.get("gc_demo")?.value === "1"

  const user = demo
    ? await getUser(DEMO_CLERK_ID)
    : (() => currentUser().then((u) => (u ? getUser(u.id) : null)))()

  const resolvedUser = await user
  const rankData = resolvedUser ? getRankProgress(resolvedUser.totalXp) : null

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-4 md:px-6 border-b border-[#1e2d3d] bg-[#080C14]/80 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {resolvedUser && rankData && (
          <>
            <div className="flex items-center gap-1.5 text-sm">
              <Zap className="h-4 w-4 text-[#06B6D4]" />
              <span className="text-[#e2e8f0] font-medium">{resolvedUser.totalXp.toLocaleString()} XP</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-[#94a3b8]">Rank {rankData.rank}</span>
              <span className="text-[#06B6D4] font-medium">{rankData.label}</span>
            </div>
            {resolvedUser.streak > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-orange-400 font-medium">{resolvedUser.streak}</span>
              </div>
            )}
          </>
        )}
      </div>
      {demo ? (
        <Link
          href="/sign-up"
          className="px-3 py-1.5 rounded-md bg-[#06B6D4] text-[#080C14] font-medium text-sm hover:bg-[#06B6D4]/90 transition-colors"
        >
          Sign up free
        </Link>
      ) : (
        <UserButton />
      )}
    </header>
  )
}
