export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Features } from "@/components/landing/features"
import { CallToAction } from "@/components/landing/cta"
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
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[#1e2d3d]/50 bg-[#080C14]/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]" aria-label="Galactic Code — home">
          <Zap className="h-5 w-5 text-[#06B6D4]" />
          <span className="font-heading font-bold text-[#06B6D4] tracking-wide">GALACTIC CODE</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link href="/sign-in" className="hidden sm:inline-block text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">Sign In</Link>
          <Link href="/demo" className="text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">Try Demo</Link>
          <Link href="/sign-up" className="px-3 py-1.5 rounded-md bg-[#06B6D4] text-[#080C14] font-semibold hover:bg-[#06B6D4]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080C14]">
            Get Started
          </Link>
        </div>
      </header>
      <main className="relative z-10">
        <Hero />
        <HowItWorks />
        <Features />
        <CallToAction />
        <footer className="py-10 px-6 border-t border-[#1e2d3d] text-sm text-[#94a3b8]">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#06B6D4]" />
              <span className="font-heading font-semibold text-[#e2e8f0]">Galactic Code</span>
            </div>
            <nav className="flex items-center gap-5" aria-label="Footer">
              <Link href="/sign-in" className="hover:text-[#e2e8f0] transition-colors">Sign In</Link>
              <Link href="/sign-up" className="hover:text-[#e2e8f0] transition-colors">Sign Up</Link>
              <Link href="/demo" className="hover:text-[#e2e8f0] transition-colors">Demo</Link>
            </nav>
            <p>© {new Date().getFullYear()} Galactic Code. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
