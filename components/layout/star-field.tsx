"use client"

import React from "react"

export function StarField() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes twinkle-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }
        .star { position: absolute; border-radius: 50%; background: white; animation: twinkle var(--duration, 3s) ease-in-out infinite; animation-delay: var(--delay, 0s); }
        .star-slow { animation-name: twinkle-slow; }
      `}</style>
      {Array.from({ length: 80 }).map((_, i) => {
        const r = (Math.sin(i * 97.5) * 0.5 + 0.5)
        const size = r < 0.7 ? 1 : r < 0.9 ? 2 : 3
        const x = `${(Math.sin(i * 137.508) * 0.5 + 0.5) * 100}%`
        const y = `${(Math.cos(i * 137.508) * 0.5 + 0.5) * 100}%`
        const dur = `${2 + (i % 5)}s`
        const delay = `${(i * 0.3) % 4}s`
        const slow = i % 5 === 0
        return (
          <div
            key={i}
            className={`star${slow ? " star-slow" : ""}`}
            style={{
              width: size,
              height: size,
              left: x,
              top: y,
              ["--duration" as string]: dur,
              ["--delay" as string]: delay,
              opacity: 0.3,
            }}
          />
        )
      })}
    </div>
  )
}
