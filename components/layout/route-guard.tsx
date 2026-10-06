"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { navItems, matchesPath } from "./nav-config"
import { canAccess, rankLabel, unlockRankForPath, xpForRank, type Access } from "@/lib/unlocks"

/**
 * Friendly stand-in for a gated area reached by direct URL. Navigation hides
 * locked areas; this just keeps a typed or bookmarked link from landing on an
 * area the pilot hasn't unlocked yet. Soft gate only — not a security boundary.
 */
export function RouteGuard({ access, xp, children }: { access: Access; xp: number; children: React.ReactNode }) {
  const pathname = usePathname()
  const required = unlockRankForPath(pathname)

  if (canAccess(access, required)) return <>{children}</>

  const area = navItems.find((i) => matchesPath(i, pathname))
  const remaining = Math.max(0, xpForRank(required) - xp)

  return (
    <Card className="max-w-lg mx-auto mt-10">
      <CardContent className="p-8 text-center space-y-4">
        <Lock className="h-10 w-10 mx-auto text-[#94a3b8]" aria-hidden="true" />
        <div>
          <h1 className="font-heading text-xl font-bold text-[#e2e8f0]">{area?.label ?? "This area"} is locked</h1>
          <p className="text-sm text-[#94a3b8] mt-2">
            Reach Rank {required} · {rankLabel(required)} to unlock it — {remaining.toLocaleString()} XP to go.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/academy"><Button className="w-full sm:w-auto">Earn XP in the Academy</Button></Link>
          <Link href="/settings"><Button variant="outline" className="w-full sm:w-auto">Turn on Explorer Mode</Button></Link>
        </div>
      </CardContent>
    </Card>
  )
}
