import {
  LayoutDashboard,
  GraduationCap,
  User,
  Rocket,
  Cpu,
  Anchor,
  Swords,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  /** Short label for the mobile bottom bar. */
  shortLabel?: string
  icon: LucideIcon
  /** Rank at which this area appears in the navigation. */
  unlockRank: number
  /** Other routes that live under this item (rendered as in-page tabs). */
  alsoMatches?: string[]
  /** Eligible for the mobile bottom bar (the rest go under "More"). */
  mobilePrimary?: boolean
}

/**
 * Full navigation, shared by the desktop sidebar and the mobile "More" menu.
 * Areas are revealed by rank (see lib/unlocks.ts); Settings lives in the top bar.
 */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Command Bridge", shortLabel: "Bridge", icon: LayoutDashboard, unlockRank: 1, mobilePrimary: true },
  // Academy also hosts the Mission Log and Star Map tabs.
  { href: "/academy", label: "Academy", icon: GraduationCap, unlockRank: 1, alsoMatches: ["/mission-log", "/star-map"], mobilePrimary: true },
  { href: "/character", label: "Character", shortLabel: "Pilot", icon: User, unlockRank: 1, mobilePrimary: true },
  { href: "/sim-bay", label: "Sim Bay", icon: Cpu, unlockRank: 2 },
  { href: "/operations", label: "Operations", icon: Rocket, unlockRank: 3 },
  // Hangar also hosts the Armory tab.
  { href: "/hangar", label: "Hangar", icon: Anchor, unlockRank: 4, alsoMatches: ["/armory"] },
  { href: "/combat", label: "Combat", icon: Swords, unlockRank: 4, mobilePrimary: true },
  // Crew hosts Fleet and the Leaderboard.
  { href: "/fleet", label: "Crew", icon: Users, unlockRank: 5, alsoMatches: ["/leaderboard"] },
]

export function matchesPath(item: NavItem, pathname: string): boolean {
  return [item.href, ...(item.alsoMatches ?? [])].some(
    (base) => pathname === base || pathname.startsWith(base + "/")
  )
}
