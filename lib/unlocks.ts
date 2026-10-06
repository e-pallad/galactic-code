import { navItems, matchesPath, type NavItem } from "@/components/layout/nav-config"
import { getRankFromXP, RANK_THRESHOLDS } from "@/lib/xp"

export interface Access {
  rank: number
  /** Explorer mode (or the demo) shows every area regardless of rank. */
  explorer: boolean
}

export function getAccess(
  user: { totalXp: number; explorerMode: boolean } | null,
  demo: boolean
): Access {
  return {
    rank: getRankFromXP(user?.totalXp ?? 0),
    explorer: demo || (user?.explorerMode ?? false),
  }
}

export function canAccess(access: Access, unlockRank: number): boolean {
  return access.explorer || access.rank >= unlockRank
}

export function visibleNavItems(access: Access, items: NavItem[] = navItems): NavItem[] {
  return items.filter((i) => canAccess(access, i.unlockRank))
}

/** Rank required for a route, or 1 when the route isn't a gated area. */
export function unlockRankForPath(pathname: string, items: NavItem[] = navItems): number {
  return items.find((i) => matchesPath(i, pathname))?.unlockRank ?? 1
}

/** The nearest area still locked at `rank`, for the "next unlock" hint. */
export function nextUnlock(rank: number, items: NavItem[] = navItems): NavItem | null {
  const locked = items.filter((i) => i.unlockRank > rank)
  if (locked.length === 0) return null
  const next = Math.min(...locked.map((i) => i.unlockRank))
  return locked.find((i) => i.unlockRank === next) ?? null
}

/** Areas that appear when moving from `fromRank` up to `toRank`. */
export function newlyUnlocked(fromRank: number, toRank: number, items: NavItem[] = navItems): NavItem[] {
  return items.filter((i) => i.unlockRank > fromRank && i.unlockRank <= toRank)
}

export function rankLabel(rank: number): string {
  return RANK_THRESHOLDS.find((t) => t.rank === rank)?.label ?? `Rank ${rank}`
}

export function xpForRank(rank: number): number {
  return RANK_THRESHOLDS.find((t) => t.rank === rank)?.xpRequired ?? 0
}
