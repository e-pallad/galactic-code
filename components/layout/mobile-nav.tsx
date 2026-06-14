"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, GraduationCap, User, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  { href: "/dashboard", label: "Bridge", icon: LayoutDashboard },
  { href: "/academy", label: "Academy", icon: GraduationCap },
  { href: "/character", label: "Pilot", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1e2d3d] bg-[#080C14]">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
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
      </div>
    </nav>
  )
}
