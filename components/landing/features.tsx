"use client"

import { motion } from "motion/react"
import { Zap, Trophy, Map, Users, Target, Flame } from "lucide-react"

const features = [
  { icon: Target, title: "Mission-Based Learning", description: "Structured missions guide you through concepts step by step, from briefing to debrief." },
  { icon: Zap, title: "XP & Rank System", description: "Earn XP for every mission, skill check, and operation. Rise from Cadet to Starfleet Legend." },
  { icon: Flame, title: "Hyperdrive Streaks", description: "Keep your daily streak alive to earn bonus XP and unlock exclusive medals." },
  { icon: Map, title: "Star Map Roadmap", description: "Visual learning paths showing your progress across the entire galaxy of knowledge." },
  { icon: Users, title: "Crew Bay", description: "Study alongside other pilots in real-time. See who else is online and learning." },
  { icon: Trophy, title: "Operations & Medals", description: "Complete capstone projects and earn medals that showcase your accomplishments." },
]

export function Features() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#e2e8f0] mb-4">
            Mission Control Features
          </h2>
          <p className="text-[#94a3b8] max-w-xl mx-auto">
            Everything you need to level up your coding skills in an immersive galactic experience.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl border border-[#1e2d3d] bg-[#0d1520] hover:border-[#06B6D4]/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-[#06B6D4]" />
                </div>
                <h3 className="font-heading font-semibold text-[#e2e8f0] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#94a3b8]">{feature.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
