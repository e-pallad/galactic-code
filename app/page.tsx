export const dynamic = "force-dynamic"

import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { StarField } from "@/components/layout/star-field"
import Link from "next/link"
import { Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#080C14]">
      <StarField />
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[#1e2d3d]/50">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#06B6D4]" />
          <span className="font-heading font-bold text-[#06B6D4] tracking-wide">GALACTIC CODE</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/sign-in" className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">Sign In</Link>
          <Link href="/demo" className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">Try Demo</Link>
          <Link href="/sign-up" className="px-3 py-1.5 rounded-md bg-[#06B6D4] text-[#080C14] font-medium hover:bg-[#06B6D4]/90 transition-colors">
            Get Started
          </Link>
        </div>
      </header>
      <main className="relative z-10">
        <Hero />
        <Features />
        <footer className="py-12 px-6 text-center border-t border-[#1e2d3d] text-sm text-[#94a3b8]">
          <p>© 2025 Galactic Code. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
