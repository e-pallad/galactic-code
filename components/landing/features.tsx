"use client"

import { motion, useReducedMotion } from "motion/react"
import { Zap, Trophy, Map, Users, Target, Flame, Swords, ShoppingBag, Rocket, BookOpen, Coins, ArrowRight } from "lucide-react"

const features = [
  { icon: Target, title: "Mission-Based Learning", description: "Structured missions guide you through concepts step by step, from briefing to debrief.", accent: "cyan" },
  { icon: Zap, title: "XP & Rank System", description: "Earn XP for every mission, skill check, and operation. Rise from Cadet to Starfleet Legend.", accent: "cyan" },
  { icon: Flame, title: "Hyperdrive Streaks", description: "Keep your daily streak alive to earn bonus XP and unlock exclusive medals.", accent: "cyan" },
  { icon: Map, title: "Star Map Roadmap", description: "Visual learning paths showing your progress across the entire galaxy of knowledge.", accent: "cyan" },
  { icon: Users, title: "Crew Bay", description: "Study alongside other pilots in real-time. See who else is online and learning.", accent: "cyan" },
  { icon: Trophy, title: "Operations & Medals", description: "Complete capstone projects and earn medals that showcase your accomplishments.", accent: "cyan" },
  { icon: Swords, title: "Combat Arena", description: "Take your ship into battle against Void Entities. Turn-based combat powered by what you've learned.", accent: "amber" },
  { icon: ShoppingBag, title: "Armory & Gear", description: "Spend the Credits you earn from learning on weapons, shields, and engines that boost your ship's stats.", accent: "amber" },
  { icon: Rocket, title: "Fleets", description: "Team up with other pilots, form a fleet, and take down powerful boss entities together for epic loot.", accent: "amber" },
]

const loopSteps = [
  { icon: BookOpen, label: "Complete Missions" },
  { icon: Coins, label: "Earn Credits" },
  { icon: ShoppingBag, label: "Equip Gear" },
  { icon: Swords, label: "Win Battles" },
]

export function Features() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#e2e8f0] mb-4">
            One Loop: Learn, Earn, Battle
          </h2>
          <p className="text-[#94a3b8] max-w-xl mx-auto">
            Galactic Code turns studying into a game. The work you put into learning directly powers your ship.
          </p>
        </div>

        {/* The play loop */}
        <div className="mb-16 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {loopSteps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.label} className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 rounded-full border border-[#1e2d3d] bg-[#0d1520] px-4 py-2">
                  <Icon className="h-4 w-4 text-[#06B6D4]" />
                  <span className="text-sm text-[#e2e8f0] whitespace-nowrap">{step.label}</span>
                </div>
                {i < loopSteps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-[#06B6D4]/50 shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon
            const isAmber = feature.accent === "amber"
            return (
              <motion.div
                key={feature.title}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : (i % 3) * 0.1 }}
                className={`p-6 rounded-xl border bg-[#0d1520] transition-colors ${
                  isAmber
                    ? "border-[#f59e0b]/20 hover:border-[#f59e0b]/40"
                    : "border-[#1e2d3d] hover:border-[#06B6D4]/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                  isAmber ? "bg-[#f59e0b]/10" : "bg-[#06B6D4]/10"
                }`}>
                  <Icon className={`h-5 w-5 ${isAmber ? "text-[#f59e0b]" : "text-[#06B6D4]"}`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-heading font-semibold text-[#e2e8f0]">{feature.title}</h3>
                  {isAmber && (
                    <span className="text-[10px] uppercase tracking-wide font-medium text-[#f59e0b] border border-[#f59e0b]/30 rounded px-1.5 py-0.5">RPG</span>
                  )}
                </div>
                <p className="text-sm text-[#94a3b8]">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
