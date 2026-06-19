export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { StarField } from "@/components/layout/star-field"
import Link from "next/link"
import { Zap } from "lucide-react"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export const metadata: Metadata = {
  title: "Galactic Code — Learn to Code Through Space Missions",
  description:
    "Galactic Code turns programming education into an RPG adventure. Complete coding missions, earn XP, outfit your ship with gear, and battle Void Entities. Start free — no setup required.",
  alternates: { canonical: APP_URL },
  openGraph: {
    title: "Galactic Code — Learn to Code Through Space Missions",
    description:
      "Galactic Code turns programming education into an RPG adventure. Complete coding missions, earn XP, outfit your ship with gear, and battle Void Entities.",
    url: APP_URL,
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${APP_URL}/#website`,
      url: APP_URL,
      name: "Galactic Code",
      description:
        "Space-themed RPG learning platform where programmers complete coding missions to earn XP, credits, and gear.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${APP_URL}/#app`,
      name: "Galactic Code",
      url: APP_URL,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      description:
        "Galactic Code is a gamified programming education platform. Players complete coding missions organized into Star Systems and Sectors, earn XP to rank up, and spend Credits on ship gear to battle Void Entities in the Combat Arena.",
      featureList: [
        "Structured coding missions across JavaScript and TypeScript",
        "XP-based pilot ranking system with 10 ranks",
        "Credits economy: earn from missions, spend in the Armory",
        "Ship customization with weapon, shield, and engine gear",
        "Combat Arena with Void Entity battles",
        "Fleet system for cooperative boss fights",
        "Skill Check quizzes with XP rewards",
        "Focus Cycle Pomodoro-style sessions",
        "Global leaderboard",
        "Visual Star Map progress tracker",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free to start — no setup required",
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#080C14]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
          <p>© {new Date().getFullYear()} Galactic Code. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
