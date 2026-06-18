import {
  LayoutDashboard,
  GraduationCap,
  ScrollText,
  User,
  Rocket,
  Cpu,
  Map,
  Trophy,
  Settings,
  Anchor,
  ShoppingBag,
  Swords,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

/** Full navigation, shared by the desktop sidebar and the mobile "More" menu. */
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Command Bridge", icon: LayoutDashboard },
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/mission-log", label: "Mission Log", icon: ScrollText },
  { href: "/character", label: "Character", icon: User },
  { href: "/operations", label: "Operations", icon: Rocket },
  { href: "/hangar", label: "Hangar", icon: Anchor },
  { href: "/armory", label: "Armory", icon: ShoppingBag },
  { href: "/combat", label: "Combat", icon: Swords },
  { href: "/fleet", label: "Fleet", icon: Users },
  { href: "/sim-bay", label: "Sim Bay", icon: Cpu },
  { href: "/star-map", label: "Star Map", icon: Map },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/settings", label: "Settings", icon: Settings },
]
