"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, GraduationCap, Swords, User, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { navItems } from "./nav-config"

const primaryItems = [
  { href: "/dashboard", label: "Bridge", icon: LayoutDashboard },
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/combat", label: "Combat", icon: Swords },
  { href: "/character", label: "Pilot", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const primaryHrefs = new Set(primaryItems.map((i) => i.href))
  const isPrimaryActive = (href: string) => pathname === href || pathname.startsWith(href + "/")
  const moreActive = !primaryItems.some((i) => isPrimaryActive(i.href))

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1e2d3d] bg-[#080C14]">
        <div className="flex items-center justify-around h-16">
          {primaryItems.map((item) => {
            const Icon = item.icon
            const isActive = isPrimaryActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-[#06B6D4]" : "text-[#94a3b8] hover:text-[#e2e8f0]"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
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
        </div>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Navigate</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const isPrimary = primaryHrefs.has(item.href)
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
                  {isPrimary && <span className="sr-only">(in bottom bar)</span>}
                </Link>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
