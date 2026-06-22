"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Zap, ArrowRight, Sparkles, Check } from "lucide-react"
import { CommandBridgePreview } from "@/components/landing/command-bridge-preview"

const trustPoints = ["Free to start", "No credit card", "JavaScript & TypeScript"]

export function Hero() {
  const reduceMotion = useReducedMotion()
  const fadeUp = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } }

  return (
    <section className="relative flex flex-col items-center text-center px-4 pt-20 pb-16 sm:pt-28">
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-3xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#06B6D4]/30 bg-[#06B6D4]/10 text-[#06B6D4] text-sm font-medium mb-6">
          <Zap className="h-3.5 w-3.5" />
          Learn to code. Then fight with it.
        </div>
        <h1 className="font-heading text-4xl sm:text-6xl md:text-7xl font-bold text-[#e2e8f0] mb-6 leading-[1.05]">
          Code Your Way{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#06B6D4] to-[#6366F1]">
            Across the Galaxy
          </span>
        </h1>
        <p className="text-lg md:text-xl text-[#cbd5e1] max-w-2xl mx-auto mb-8">
          Master programming through epic missions. Every lesson earns{" "}
          <span className="text-[#f59e0b] font-medium">Credits</span> you spend on gear — then
          take your ship into the <span className="text-[#e2e8f0] font-medium">Combat Arena</span> and
          rise from Cadet to Starfleet Legend.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              Launch Your Mission <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/demo" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <Sparkles className="h-4 w-4" /> Try the Live Demo
            </Button>
          </Link>
        </div>

        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#94a3b8]">
          {trustPoints.map((point) => (
            <li key={point} className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#10B981]" />
              {point}
            </li>
          ))}
        </ul>
        <p className="text-sm text-[#94a3b8] mt-5">
          Already a pilot?{" "}
          <Link href="/sign-in" className="text-[#06B6D4] hover:underline">Continue your journey →</Link>
        </p>
      </motion.div>

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.3, duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto mt-16"
      >
        <CommandBridgePreview />
      </motion.div>
    </section>
  )
}
