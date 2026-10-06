"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface SectionTab {
  href: string
  label: string
}

/** Route-based tab strip tying related pages together under one nav item. */
export function SectionTabs({ tabs, label }: { tabs: SectionTab[]; label: string }) {
  const pathname = usePathname()
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto rounded-md bg-[#0d1520] p-1 w-fit max-w-full">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + "/")
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]",
              active ? "bg-[#1e2d3d] text-[#e2e8f0] shadow-sm" : "text-[#94a3b8] hover:text-[#e2e8f0]"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export const ACADEMY_TABS: SectionTab[] = [
  { href: "/academy", label: "Missions" },
  { href: "/mission-log", label: "Mission Log" },
  { href: "/star-map", label: "Star Map" },
]

export const HANGAR_TABS: SectionTab[] = [
  { href: "/hangar", label: "Loadout" },
  { href: "/armory", label: "Armory" },
]

export const CREW_TABS: SectionTab[] = [
  { href: "/fleet", label: "Fleet" },
  { href: "/leaderboard", label: "Leaderboard" },
]
