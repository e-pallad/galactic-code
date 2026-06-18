"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Zap, ArrowRight, Sparkles } from "lucide-react"

export function Hero() {
  const reduceMotion = useReducedMotion()
  const fadeUp = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } }

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[85vh] text-center px-4">
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-4xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4] text-sm font-medium mb-6">
          <Zap className="h-3.5 w-3.5" />
          Learn to code. Then fight with it.
        </div>
        <h1 className="font-heading text-5xl md:text-7xl font-bold text-[#e2e8f0] mb-6 leading-tight">
          Code Your Way{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#6366F1]">
            Across the Galaxy
          </span>
        </h1>
        <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto mb-4">
          Master programming through epic missions. Every lesson you complete earns{" "}
          <span className="text-[#f59e0b] font-medium">Credits</span> — spend them on gear,
          then take your ship into the <span className="text-[#e2e8f0] font-medium">Combat Arena</span> to
          battle Void Entities and rise from Cadet to Starfleet Legend.
        </p>
        <p className="text-sm text-[#64748b] max-w-xl mx-auto mb-10">
          No credit card. No setup. Jump straight into the demo and explore the whole galaxy.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              Launch Your Mission <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <Sparkles className="h-4 w-4" /> Try the Live Demo
            </Button>
          </Link>
        </div>
        <p className="text-sm text-[#94a3b8] mt-6">
          Already a pilot?{" "}
          <Link href="/sign-in" className="text-[#06B6D4] hover:underline">Continue your journey →</Link>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.5, duration: 1 }}
        className="absolute bottom-8 flex flex-col items-center gap-1"
      >
        <div className="w-0.5 h-8 bg-gradient-to-b from-[#06B6D4]/50 to-transparent" />
        <p className="text-xs text-[#94a3b8]">Scroll to explore</p>
      </motion.div>
    </section>
  )
}
