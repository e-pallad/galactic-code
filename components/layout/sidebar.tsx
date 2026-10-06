"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { navItems, matchesPath } from "./nav-config"
import { visibleNavItems, nextUnlock, rankLabel, type Access } from "@/lib/unlocks"

export function Sidebar({ access }: { access: Access }) {
  const pathname = usePathname()
  const items = visibleNavItems(access)
  const next = access.explorer ? null : nextUnlock(access.rank, navItems)

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#1e2d3d] bg-[#080C14] h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-[#1e2d3d]">
        <Zap className="h-6 w-6 text-[#06B6D4]" />
        <span className="font-heading font-bold text-lg text-[#06B6D4] tracking-wide">GALACTIC CODE</span>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = matchesPath(item, pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors hover:bg-[#0d1520] hover:text-[#06B6D4]",
                isActive
                  ? "bg-[#06B6D4]/10 text-[#06B6D4] border-r-2 border-[#06B6D4]"
                  : "text-[#94a3b8]"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      {next && (
        <p className="flex items-start gap-2 px-6 py-4 border-t border-[#1e2d3d] text-xs text-[#94a3b8]">
          <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="text-[#e2e8f0]">{next.label}</span> unlocks at Rank {next.unlockRank} · {rankLabel(next.unlockRank)}
          </span>
        </p>
      )}
    </aside>
  )
}
