import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { getRankProgress } from "@/lib/xp"
import { canAccess, unlockRankForPath, type Access } from "@/lib/unlocks"
import { Zap, Flame, Settings } from "lucide-react"
import type { User } from "@/lib/db/schema"

// Credits are only useful once the Armory is open (it lives under Hangar).
const CREDITS_UNLOCK_RANK = unlockRankForPath("/hangar")

interface TopBarProps {
  user: User | null
  demo: boolean
  access: Access
}

export function TopBar({ user, demo, access }: TopBarProps) {
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
            {canAccess(access, CREDITS_UNLOCK_RANK) && (
              <div className="hidden sm:flex items-center gap-1 text-sm font-mono">
                <span className="text-[#f59e0b]">⟁</span>
                <span className="text-[#f59e0b] font-medium">{user.credits.toLocaleString()} CR</span>
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          aria-label="Settings"
          className="rounded-md p-1.5 text-[#94a3b8] transition-colors hover:text-[#06B6D4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
        >
          <Settings className="h-5 w-5" />
        </Link>
        {!demo && <UserButton />}
      </div>
    </header>
  )
}
