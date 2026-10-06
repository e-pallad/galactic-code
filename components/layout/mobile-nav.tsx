"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { matchesPath } from "./nav-config"
import { visibleNavItems, type Access } from "@/lib/unlocks"

export function MobileNav({ access }: { access: Access }) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const items = visibleNavItems(access)
  const primaryItems = items.filter((i) => i.mobilePrimary)
  const overflowItems = items.filter((i) => !i.mobilePrimary)
  const moreActive = overflowItems.some((i) => matchesPath(i, pathname))

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1e2d3d] bg-[#080C14]" aria-label="Main">
        <div className="flex items-center justify-around h-16">
          {primaryItems.map((item) => {
            const Icon = item.icon
            const isActive = matchesPath(item, pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-[#06B6D4]" : "text-[#94a3b8] hover:text-[#e2e8f0]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.shortLabel ?? item.label}
              </Link>
            )
          })}
          {overflowItems.length > 0 && (
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label="More navigation"
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                moreActive ? "text-[#06B6D4]" : "text-[#94a3b8] hover:text-[#e2e8f0]"
              )}
            >
              <Menu className="h-5 w-5" />
              More
            </button>
          )}
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Navigate</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {overflowItems.map((item) => {
              const Icon = item.icon
              const isActive = matchesPath(item, pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium text-center transition-colors",
                    isActive
                      ? "border-[#06B6D4]/50 bg-[#06B6D4]/10 text-[#06B6D4]"
                      : "border-[#1e2d3d] bg-[#0d1520] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#06B6D4]/30"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="leading-tight">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
