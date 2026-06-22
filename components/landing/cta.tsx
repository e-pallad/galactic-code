"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"

export function CallToAction() {
  const reduceMotion = useReducedMotion()
  return (
    <section className="py-24 px-4 border-t border-[#1e2d3d]/60">
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
        whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative max-w-3xl mx-auto text-center rounded-2xl border border-[#06B6D4]/20 bg-gradient-to-b from-[#0d1520] to-[#080C14] px-6 py-14 overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#06B6D4]/60 to-transparent" />
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#e2e8f0] mb-4">
          Your ship is waiting, pilot
        </h2>
        <p className="text-[#94a3b8] max-w-xl mx-auto mb-8">
          Start free, no credit card required. Jump into the demo or create your account and launch
          your first mission in under a minute.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              Launch Your Mission <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/demo" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
              <Sparkles className="h-4 w-4" /> Explore the Demo
            </Button>
          </Link>
        </div>
      </motion.div>
    </section>
  )
}
