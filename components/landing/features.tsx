"use client"

import { motion, useReducedMotion } from "motion/react"
import { Zap, Trophy, Map, Users, Target, Flame, Swords, ShoppingBag, Rocket, type LucideIcon } from "lucide-react"

type Feature = { icon: LucideIcon; title: string; description: string }

const learningFeatures: Feature[] = [
  { icon: Target, title: "Mission-Based Learning", description: "Structured missions guide you through concepts step by step, from briefing to debrief." },
  { icon: Zap, title: "XP & Rank System", description: "Earn XP for every mission, skill check, and operation. Rise from Cadet to Starfleet Legend." },
  { icon: Flame, title: "Hyperdrive Streaks", description: "Keep your daily streak alive to earn bonus XP and unlock exclusive medals." },
  { icon: Map, title: "Star Map Roadmap", description: "Visual learning paths showing your progress across the entire galaxy of knowledge." },
  { icon: Users, title: "Crew Bay", description: "Study alongside other pilots in real time. See who else is online and learning." },
  { icon: Trophy, title: "Operations & Medals", description: "Complete capstone projects and earn medals that showcase your accomplishments." },
]

const rpgFeatures: Feature[] = [
  { icon: Swords, title: "Combat Arena", description: "Take your ship into battle against Void Entities. Turn-based combat powered by what you've learned." },
  { icon: ShoppingBag, title: "Armory & Gear", description: "Spend the Credits you earn from learning on weapons, shields, and engines that boost your ship's stats." },
  { icon: Rocket, title: "Fleets", description: "Team up with other pilots, form a fleet, and take down powerful boss entities together for epic loot." },
]

function FeatureCard({ feature, index, accent }: { feature: Feature; index: number; accent: "cyan" | "amber" }) {
  const reduceMotion = useReducedMotion()
  const isAmber = accent === "amber"
  const Icon = feature.icon
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: reduceMotion ? 0 : (index % 3) * 0.1 }}
      className={`p-6 rounded-xl border bg-[#0d1520] transition-colors ${
        isAmber ? "border-[#f59e0b]/20 hover:border-[#f59e0b]/40" : "border-[#1e2d3d] hover:border-[#06B6D4]/40"
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${isAmber ? "bg-[#f59e0b]/10" : "bg-[#06B6D4]/10"}`}>
        <Icon className={`h-5 w-5 ${isAmber ? "text-[#f59e0b]" : "text-[#06B6D4]"}`} />
      </div>
      <h3 className="font-heading font-semibold text-[#e2e8f0] mb-2">{feature.title}</h3>
      <p className="text-sm text-[#94a3b8]">{feature.description}</p>
    </motion.div>
  )
}

function SectionLabel({ accent, kicker, title, blurb }: { accent: "cyan" | "amber"; kicker: string; title: string; blurb: string }) {
  const isAmber = accent === "amber"
  return (
    <div className="mb-8">
      <span className={`inline-block text-xs font-medium uppercase tracking-wider mb-3 ${isAmber ? "text-[#f59e0b]" : "text-[#06B6D4]"}`}>
        {kicker}
      </span>
      <h3 className="font-heading text-2xl md:text-3xl font-bold text-[#e2e8f0] mb-2">{title}</h3>
      <p className="text-[#94a3b8] max-w-2xl">{blurb}</p>
    </div>
  )
}

export function Features() {
  return (
    <section className="py-20 px-4 border-t border-[#1e2d3d]/60">
      <div className="max-w-5xl mx-auto">
        <div className="mb-16">
          <SectionLabel
            accent="cyan"
            kicker="The Learning Engine"
            title="A structured path that actually sticks"
            blurb="Everything you need to learn to code, wrapped in a system designed to keep you coming back."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} accent="cyan" />
            ))}
          </div>
        </div>

        <div>
          <SectionLabel
            accent="amber"
            kicker="The RPG Layer"
            title="Turn your progress into firepower"
            blurb="What sets Galactic Code apart: the Credits and XP you earn from learning fuel a full RPG combat game."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rpgFeatures.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} accent="amber" />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
