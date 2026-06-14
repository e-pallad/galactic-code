"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Zap, ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[85vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4] text-sm font-medium mb-6">
          <Zap className="h-3.5 w-3.5" />
          Space-Themed RPG Learning Platform
        </div>
        <h1 className="font-heading text-5xl md:text-7xl font-bold text-[#e2e8f0] mb-6 leading-tight">
          Code Your Way{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#6366F1]">
            Across the Galaxy
          </span>
        </h1>
        <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto mb-10">
          Master programming through epic missions, earn XP, rank up, and explore the universe of code.
          Your journey to becoming a Starfleet Legend starts now.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Launch Your Mission <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">
              Continue Journey
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute bottom-8 flex flex-col items-center gap-1"
      >
        <div className="w-0.5 h-8 bg-gradient-to-b from-[#06B6D4]/50 to-transparent" />
        <p className="text-xs text-[#94a3b8]">Scroll to explore</p>
      </motion.div>
    </section>
  )
}
