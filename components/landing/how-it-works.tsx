"use client"

import { motion, useReducedMotion } from "motion/react"
import { BookOpen, Coins, Swords } from "lucide-react"

const steps = [
  {
    icon: BookOpen,
    step: "01",
    title: "Complete Missions",
    description:
      "Work through bite-sized coding missions organized into Star Systems and Sectors. Each one earns XP and Credits the moment you finish.",
  },
  {
    icon: Coins,
    step: "02",
    title: "Earn & Equip",
    description:
      "Spend the Credits you earn in the Armory on weapons, shields, and engines that upgrade your ship's stats.",
  },
  {
    icon: Swords,
    step: "03",
    title: "Battle Void Entities",
    description:
      "Take your upgraded ship into the Combat Arena, team up in Fleets for boss fights, and climb the global leaderboard.",
  },
]

export function HowItWorks() {
  const reduceMotion = useReducedMotion()

  return (
    <section className="py-20 px-4 border-t border-[#1e2d3d]/60">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium uppercase tracking-wider text-[#06B6D4] mb-3">How it works</p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#e2e8f0] mb-4">
            Three steps to liftoff
          </h2>
          <p className="text-[#94a3b8] max-w-xl mx-auto">
            The work you put into learning directly powers your ship. Here&apos;s the loop.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.step}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: reduceMotion ? 0 : i * 0.12 }}
                className="relative p-6 rounded-xl border border-[#1e2d3d] bg-[#0d1520]"
              >
                <span className="absolute top-5 right-5 font-heading text-3xl font-bold text-[#1e2d3d]">
                  {s.step}
                </span>
                <div className="w-11 h-11 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-[#06B6D4]" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-[#e2e8f0] mb-2">{s.title}</h3>
                <p className="text-sm text-[#94a3b8]">{s.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
