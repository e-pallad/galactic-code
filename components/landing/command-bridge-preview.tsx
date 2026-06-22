"use client"

import { Zap, Coins, Flame, Trophy, Target, Swords, Check } from "lucide-react"

/**
 * A stylized, non-interactive mock of the in-app Command Bridge.
 * Purely decorative product preview for the landing page.
 */
export function CommandBridgePreview() {
  return (
    <div
      aria-hidden="true"
      className="relative rounded-2xl border border-[#1e2d3d] bg-[#0b111c]/80 backdrop-blur-sm p-3 sm:p-4 shadow-2xl shadow-[#06B6D4]/5"
    >
      {/* glow */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-[#06B6D4]/10 to-transparent opacity-60" />

      <div className="relative rounded-xl border border-[#1e2d3d] bg-[#080C14] overflow-hidden">
        {/* window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e2d3d]/70">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]/70" />
          <span className="ml-3 text-xs text-[#64748b] font-sans">Command Bridge</span>
        </div>

        <div className="p-4 sm:p-6 text-left">
          {/* top stat row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#6366F1] flex items-center justify-center font-heading font-bold text-[#080C14]">
                R7
              </div>
              <div>
                <p className="font-heading font-semibold text-[#e2e8f0] leading-tight">Commander Nova</p>
                <p className="text-xs text-[#06B6D4]">Rank 7 · Code Pilot</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2.5 py-1 text-[#f59e0b]">
                <Coins className="h-3.5 w-3.5" /> 1,240
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#1e2d3d] bg-[#0d1520] px-2.5 py-1 text-[#e2e8f0]">
                <Flame className="h-3.5 w-3.5 text-[#f59e0b]" /> 12
              </span>
            </div>
          </div>

          {/* xp bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="flex items-center gap-1.5 text-[#94a3b8]">
                <Zap className="h-3.5 w-3.5 text-[#06B6D4]" /> XP to Rank 8
              </span>
              <span className="text-[#94a3b8]">2,140 / 3,000</span>
            </div>
            <div className="h-2 rounded-full bg-[#1e2d3d] overflow-hidden">
              <div className="h-full w-[71%] rounded-full bg-gradient-to-r from-[#06B6D4] to-[#6366F1]" />
            </div>
          </div>

          {/* cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#06B6D4]/30 bg-[#06B6D4]/5 p-3">
              <Target className="h-4 w-4 text-[#06B6D4] mb-2" />
              <p className="text-xs text-[#94a3b8]">Active Mission</p>
              <p className="text-sm font-medium text-[#e2e8f0]">Array Methods II</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-[#10B981]">
                <Check className="h-3 w-3" /> 3 / 4 objectives
              </div>
            </div>
            <div className="rounded-lg border border-[#1e2d3d] bg-[#0d1520] p-3">
              <Trophy className="h-4 w-4 text-[#8B5CF6] mb-2" />
              <p className="text-xs text-[#94a3b8]">Next Medal</p>
              <p className="text-sm font-medium text-[#e2e8f0]">Loop Master</p>
              <p className="mt-2 text-[10px] text-[#94a3b8]">2 missions away</p>
            </div>
            <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3">
              <Swords className="h-4 w-4 text-[#f59e0b] mb-2" />
              <p className="text-xs text-[#94a3b8]">Arena</p>
              <p className="text-sm font-medium text-[#e2e8f0]">Void Drifter</p>
              <p className="mt-2 text-[10px] text-[#f59e0b]">Ready to engage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
