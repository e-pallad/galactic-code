"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"

interface CelebrationModalProps {
  open: boolean
  onClose: () => void
  type: "levelUp" | "medal"
  title: string
  description: string
  icon?: string
  shareUrl?: string
}

export function CelebrationModal({ open, onClose, type, title, description, icon, shareUrl }: CelebrationModalProps) {
  const [prefersReduced, setPrefersReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  )

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const handleShare = () => {
    if (!shareUrl) return
    const text =
      type === "levelUp"
        ? `Just leveled up on Galactic Code! ${title} 🚀`
        : `Just earned the "${title}" medal on Galactic Code Academy! 🏅`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="text-center max-w-sm">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={prefersReduced ? {} : { scale: 0.5, opacity: 0 }}
              animate={prefersReduced ? {} : { scale: 1, opacity: 1 }}
              exit={prefersReduced ? {} : { scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              {icon && (
                <motion.div
                  animate={prefersReduced ? {} : { rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-6xl"
                >
                  {icon}
                </motion.div>
              )}
              <div>
                <h2 className="text-xl font-bold font-heading text-[#e2e8f0] mb-1">{title}</h2>
                <p className="text-[#94a3b8] text-sm">{description}</p>
              </div>
              {type === "levelUp" && (
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
                      animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="w-2 h-2 rounded-full bg-[#06B6D4]"
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                {shareUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="gap-1.5 border-[#1e2d3d] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#06B6D4]"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </Button>
                )}
                <Button onClick={onClose}>Continue Mission</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
